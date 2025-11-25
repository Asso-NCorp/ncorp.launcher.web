import type { Actions, PageServerLoad } from "./$types";
import { fail, setError, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { APIError } from "better-auth/api";
import { error, redirect } from "@sveltejs/kit";
import { auth } from "$src/lib/auth/server";
import { PUBLIC_BETTER_AUTH_URL } from "$env/static/public";
import { parseSetCookieHeader } from "better-auth/cookies";
import { loginFormSchema } from "../schemas";
import { logger } from "$src/lib/stores/loggerStore";
import { parse as parseTopLevelDomain } from "tldts";
import { db } from "$srv/db";

// Central domain resolution (avoids repeated parsing & potential undefined issues)
const parsedDomain = parseTopLevelDomain(PUBLIC_BETTER_AUTH_URL).domain;
const apexDomain = parsedDomain ? `.${parsedDomain}` : undefined;
if (!apexDomain) {
    logger.error(
        { PUBLIC_BETTER_AUTH_URL, parsedDomain },
        "Unable to derive apex domain from PUBLIC_BETTER_AUTH_URL; cookies will fall back to host-only.",
    );
}

// Tunables
const AUTH_TIMEOUT_MS = 8000;
const TOKEN_TIMEOUT_MS = 6000;
const DB_UPDATE_TIMEOUT_MS = 5000;

// Helper: step timing
function startStep(name: string) {
    const started = Date.now();
    logger.info({ step: name, at: started }, "Signin step start");
    return (extra?: Record<string, unknown>) =>
        logger.info({ step: name, ms: Date.now() - started, ...(extra || {}) }, "Signin step end");
}

// Generic timeout wrapper for promises
async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
    let to: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
        to = setTimeout(() => reject(new Error(`${label} timeout after ${ms} ms`)), ms);
    });
    try {
        return await Promise.race([p, timeoutPromise]);
    } finally {
        clearTimeout(to!);
    }
}

// fetch wrapper with AbortController timeout
async function fetchWithTimeout(
    fetchFn: typeof fetch,
    url: string,
    options: RequestInit,
    timeoutMs: number,
    label: string,
) {
    const ac = new AbortController();
    const id = setTimeout(() => ac.abort(), timeoutMs);
    const start = Date.now();
    try {
        const res = await fetchFn(url, { ...options, signal: ac.signal });
        logger.info({ label, url, status: res.status, ms: Date.now() - start }, "External fetch completed");
        return res;
    } catch (e) {
        logger.error(
            { label, url, ms: Date.now() - start, error: e instanceof Error ? e.message : e },
            "External fetch failed",
        );
        throw e;
    } finally {
        clearTimeout(id);
    }
}

export const load: PageServerLoad = (async (event) => {
    // Redirect if already authenticated
    const session = await auth.api.getSession({
        headers: new Headers({ cookie: event.request.headers.get("cookie") ?? "" }),
    });
    if (session) {
        logger.info({ userId: session.user?.id }, "User already authenticated, redirecting from /signin");
        throw redirect(302, "/");
    }

    return {
        form: await superValidate(zod4(loginFormSchema)),
    };
}) satisfies PageServerLoad;

export const actions: Actions = {
    default: async (event) => {
        const form = await superValidate(event, zod4(loginFormSchema));
        if (!form.valid) {
            return fail(400, {
                form,
            });
        }

        let session: Awaited<ReturnType<typeof auth.api.getSession>> | undefined;

        try {
            const endSignIn = startStep("auth.api.signInUsername");
            const authResponse = await withTimeout(
                auth.api.signInUsername({
                    asResponse: true,
                    body: {
                        username: form.data.username,
                        password: form.data.password,
                    },
                }),
                AUTH_TIMEOUT_MS,
                "auth.api.signInUsername",
            );
            endSignIn({ ok: !!authResponse });

            if (!authResponse) throw new Error("No response from auth server");

            const cookieString = authResponse.headers.get("set-cookie");
            if (!cookieString) {
                return setError(form, "", "Identifiants incorrects");
            }

            logger.info("Cookie string received: " + cookieString);

            logger.info("Cookies received");
            // Manually set the cookies as we login with a server action
            const parsed = parseSetCookieHeader(cookieString);
            for (const [name, options] of parsed.entries()) {
                event.cookies.set(name, decodeURIComponent(options.value), {
                    maxAge: options["max-age"] ? options["max-age"] : undefined,
                    path: options.path ?? "/",
                    httpOnly: options.httponly,
                    secure: options.secure ?? true,
                    sameSite: "none",
                    ...(apexDomain && { domain: apexDomain }),
                });
            }

            // Get the cookie whos name contains "better-auth.session_token"
            const betterAuthTokenEntry = [...parsed.entries()].find(([name]) =>
                name.includes("better-auth.session_token"),
            );
            if (!betterAuthTokenEntry) {
                logger.error(`No betterAuthToken found for user ${form.data.username}`);
                return fail(500, { form });
            }

            const [betterAuthTokenName, betterAuthTokenOptions] = betterAuthTokenEntry;
            const betterAuthToken = decodeURIComponent(betterAuthTokenOptions.value);

            // Important : reencode the cookie value because it is decoded by the browser
            const bearerCookie = `${betterAuthTokenName}=${encodeURIComponent(betterAuthToken)}`;

            // Get the JWT token
            let jwtTokenResponse: Response | null = null;
            try {
                const endToken = startStep("fetch.jwtToken");
                jwtTokenResponse = await fetchWithTimeout(
                    event.fetch,
                    `${PUBLIC_BETTER_AUTH_URL}/api/auth/token`,
                    {
                        headers: {
                            cookie: `${bearerCookie}`,
                        },
                    },
                    TOKEN_TIMEOUT_MS,
                    "jwtToken",
                );
                endToken({ status: jwtTokenResponse.status });
            } catch (error) {
                logger.error({ error }, "Error occured while fetching jwt token");
                return fail(500, { form, response: error });
            }

            if (!jwtTokenResponse.ok) {
                logger.error({ error: await jwtTokenResponse.text() }, "Error occcured while setting the jwt token");
                return fail(500, { form, response: jwtTokenResponse.statusText });
            }

            const jwtToken = await jwtTokenResponse.json();
            if (!jwtToken) {
                logger.error({ username: form.data.username }, "No jwt token found for user");
                return fail(500, { form });
            }

            logger.info("JWT token received");

            // Set the token in apex domain so that it is available in all subdomains
            // As we are using different domain for c# backend
            event.cookies.set("token", jwtToken.token, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: "/",
                httpOnly: true,
                secure: true,
                sameSite: "none",
                ...(apexDomain && { domain: apexDomain }),
            });

            logger.info({ username: form.data.username }, "User logged in successfully");

            const endSession = startStep("auth.api.getSession");
            session = await withTimeout(
                auth.api.getSession({
                    headers: new Headers({ Cookie: `${bearerCookie}` }),
                }),
                AUTH_TIMEOUT_MS,
                "auth.api.getSession",
            );
            endSession({ userId: session?.user?.id });
            if (!session || !session.user) {
                logger.error({ username: form.data.username }, "Session retrieval failed for user");
                return fail(500, { form, response: "Session retrieval failed" });
            }

            // Update the lastLogin with timeout
            const endDbUpdate = startStep("db.user.update(lastLogin)");
            await withTimeout(
                db.user.update({
                    where: { id: session.user.id },
                    data: { lastLogin: new Date() },
                }),
                DB_UPDATE_TIMEOUT_MS,
                "db.user.update",
            ).catch((e) => {
                logger.error(
                    {
                        userId: session?.user?.id,
                        error: e instanceof Error ? e.message : e,
                    },
                    "Failed to update lastLogin (continuing)",
                );
            });
            endDbUpdate();
        } catch (err) {
            console.log(err);
            if (err instanceof APIError) {
                if (err.body?.code === "INVALID_USERNAME_OR_PASSWORD") {
                    return setError(form, "", "Identifiants incorrects");
                } else {
                    if (err.body?.message) return setError(form, "", err.body.message);
                    else return setError(form, "", "Une erreur fatale est survenue 🥵");
                }
            }

            throw error(500, "Internal Server Error");
        }

        if (!session) {
            logger.error({ username: form.data.username }, "Session is undefined after login attempt");
            throw error(500, "Internal Server Error");
        }

        logger.info({ username: form.data.username, userId: session.user.id }, "User login completed, redirecting");

        // Login successful
        throw redirect(302, "/");
    },
};
