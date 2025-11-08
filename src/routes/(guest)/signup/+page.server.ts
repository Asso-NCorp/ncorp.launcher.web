import type { Actions, PageServerLoad } from "./$types";
import { fail, setError, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { APIError } from "better-auth/api";
import { redirect } from "@sveltejs/kit";
import { auth } from "$src/lib/auth/server";
import { parseSetCookieHeader } from "better-auth/cookies";
import { PUBLIC_BETTER_AUTH_URL } from "$env/static/public";
import { signupFormSchema } from "../schemas";
import { parse as parseTopLevelDomain } from "tldts";

import { logger } from "$src/lib/stores/loggerStore";
import { generateRandomAvatar } from "$src/lib/utils.server";
import { db } from "$srv/db";

// Central domain resolution
const parsedDomain = parseTopLevelDomain(PUBLIC_BETTER_AUTH_URL).domain;
const apexDomain = parsedDomain ? `.${parsedDomain}` : undefined;
if (!apexDomain) {
    logger.error(
        { PUBLIC_BETTER_AUTH_URL, parsedDomain },
        "signup: unable to derive apex domain; using host-only cookies",
    );
}

// Timeouts (ms)
const SIGNUP_TIMEOUT_MS = 8000;
const TOKEN_TIMEOUT_MS = 6000;
const SESSION_TIMEOUT_MS = 6000;
const DB_UPDATE_TIMEOUT_MS = 5000;
const AVATAR_TIMEOUT_MS = 5000;

// Step timing helper
function startStep(name: string) {
    const t0 = Date.now();
    logger.info({ step: name, at: t0 }, "signup step start");
    return (extra?: Record<string, unknown>) =>
        logger.info({ step: name, ms: Date.now() - t0, ...(extra || {}) }, "signup step end");
}

// Generic timeout wrapper
async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
    // CHANGED: portable timeout type
    let to: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>(
        (_, reject) => (to = setTimeout(() => reject(new Error(`${label} timeout after ${ms} ms`)), ms)),
    );
    try {
        return await Promise.race([p, timeoutPromise]);
    } finally {
        if (typeof to !== "undefined") clearTimeout(to);
    }
}

// fetch timeout wrapper
async function fetchWithTimeout(
    fetchFn: typeof fetch,
    url: string,
    options: RequestInit,
    timeoutMs: number,
    label: string,
) {
    const ac = new AbortController();
    const id = setTimeout(() => ac.abort(), timeoutMs);
    const t0 = Date.now();
    try {
        const res = await fetchFn(url, { ...options, signal: ac.signal });
        logger.info({ label, url, status: res.status, ms: Date.now() - t0 }, "signup external fetch");
        return res;
    } catch (e) {
        logger.error(
            { label, url, ms: Date.now() - t0, error: e instanceof Error ? e.message : e },
            "signup fetch failed",
        );
        throw e;
    } finally {
        clearTimeout(id);
    }
}

export const load: PageServerLoad = (async () => {
    return {
        form: await superValidate(zod4(signupFormSchema)),
    };
}) satisfies PageServerLoad;

export const actions: Actions = {
    default: async (event) => {
        const form = await superValidate(event, zod4(signupFormSchema));
        if (!form.valid) {
            return fail(400, {
                form,
            });
        }

        try {
            const endSignUp = startStep("auth.api.signUpEmail");
            const authResponse = await withTimeout(
                auth.api.signUpEmail({
                    asResponse: true,
                    body: {
                        username: form.data.username,
                        email: form.data.email,
                        password: form.data.password,
                        name: form.data.name,
                        lastLogin: new Date(),
                        image: "/api/avatars/" + form.data.username,
                    },
                }),
                SIGNUP_TIMEOUT_MS,
                "auth.api.signUpEmail",
            );
            endSignUp({ ok: !!authResponse });

            if (authResponse) {
                const cookieString = authResponse.headers.get("set-cookie");
                if (!cookieString) {
                    logger.error({ phase: "set-cookie" }, "signup: missing set-cookie header");
                    return fail(500, { form });
                }

                // Manually set the cookies as we login with a server action
                const parsed = parseSetCookieHeader(cookieString);
                for (const [name, options] of parsed.entries()) {
                    event.cookies.set(name, decodeURIComponent(options.value), {
                        maxAge: options["max-age"] ? options["max-age"] : undefined,
                        path: options.path ?? "/",
                        httpOnly: options.httponly,
                        sameSite: "none",
                        ...(apexDomain && { domain: apexDomain }),
                    });
                }

                const betterAuthToken = event.cookies.get("__Secure-better-auth.session_token");
                if (!betterAuthToken) {
                    logger.error({ phase: "betterAuthToken" }, "signup: missing session token cookie");
                    return fail(500, { form });
                }

                // Important : reencode the cookie value because it is decoded by the browser
                const bearerCookie = `__Secure-better-auth.session_token=${encodeURIComponent(betterAuthToken)}`;

                // Get the JWT token
                let jwtTokenResponse: Response | null = null;
                try {
                    const endToken = startStep("fetch.jwtToken");
                    jwtTokenResponse = await fetchWithTimeout(
                        event.fetch,
                        `${PUBLIC_BETTER_AUTH_URL}/api/auth/token`,
                        { headers: { cookie: bearerCookie } },
                        TOKEN_TIMEOUT_MS,
                        "jwtToken",
                    );
                    endToken({ status: jwtTokenResponse.status });
                } catch (error) {
                    return fail(500, { form, response: error });
                }

                if (!jwtTokenResponse.ok) {
                    logger.error({ status: jwtTokenResponse.status }, "signup: jwt token fetch not ok");
                    return fail(500, { form, response: jwtTokenResponse.statusText });
                }

                const jwtToken = await jwtTokenResponse.json();
                if (!jwtToken) {
                    logger.error({ phase: "jwtTokenParse" }, "signup: empty jwt token body");
                    return fail(500, { form });
                }

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

                const endSession = startStep("auth.api.getSession");
                const session = await withTimeout(
                    auth.api.getSession({
                        headers: new Headers({ Cookie: bearerCookie }),
                    }),
                    SESSION_TIMEOUT_MS,
                    "auth.api.getSession",
                );
                endSession({ userId: session?.user?.id });
                if (!session) {
                    logger.error({ phase: "session" }, "signup: session retrieval failed");
                    return fail(500, { form, response: "Session retrieval failed" });
                }

                // Avatar generation (non-critical)
                try {
                    const endAvatar = startStep("generateRandomAvatar(user.id)");
                    await withTimeout(
                        generateRandomAvatar(session.user.id),
                        AVATAR_TIMEOUT_MS,
                        "generateRandomAvatar(user.id)",
                    );
                    endAvatar();
                } catch (error) {
                    logger.debug({ error }, "signup: avatar generation (user.id) failed");
                }

                // Update lastLogin
                const endDb = startStep("db.user.update(lastLogin)");
                await withTimeout(
                    db.user.update({
                        where: { id: session.user.id },
                        data: { lastLogin: new Date() },
                    }),
                    DB_UPDATE_TIMEOUT_MS,
                    "db.user.update(lastLogin)",
                ).catch((e) =>
                    logger.error({ error: e instanceof Error ? e.message : e }, "signup: lastLogin update failed"),
                );
                endDb();
            }
        } catch (error) {
            console.log(error);
            if (error instanceof APIError) {
                if (error.body?.message) return setError(form, "", error.body.message);
                else return setError(form, "", "Une erreur fatale est survenue 🥵");
            }

            throw error;
        }

        // Login successful
        throw redirect(302, "/");
    },
};