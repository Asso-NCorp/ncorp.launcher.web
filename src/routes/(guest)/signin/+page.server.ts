
import type { Actions, PageServerLoad } from './$types';
import { fail, setError, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { APIError } from 'better-auth/api';
import { error, redirect } from '@sveltejs/kit';
import { auth } from '$src/lib/auth/server';
import { PUBLIC_BETTER_AUTH_URL } from '$env/static/public';
import { parseSetCookieHeader } from 'better-auth/cookies';
import { loginFormSchema } from '../schemas';
import { logger } from '$src/lib/stores/loggerStore';
import { parse as parseTopLevelDomain } from 'tldts';
import { db } from "$srv/db";

export const load: PageServerLoad = (async () => {
    return {
        form: await superValidate(zod(loginFormSchema)),
    };
}) satisfies PageServerLoad;

export const actions: Actions = {
    default: async (event) => {
        const form = await superValidate(event, zod(loginFormSchema));
        if (!form.valid) {
            return fail(400, {
                form,
            });
        }

        try {
            const authResponse = await auth.api.signInUsername({
                asResponse: true,
                body: {
                    username: form.data.username,
                    password: form.data.password,
                },
            });

            if (!authResponse) throw new Error("No response from auth server");

            const cookieString = authResponse.headers.get("set-cookie");
            if (!cookieString) {
                return setError(form, "", "Identifiants incorrects");
            }

            logger.info({ cookieString }, "Cookies received");
            // Manually set the cookies as we login with a server action
            const parsed = parseSetCookieHeader(cookieString);
            for (const [name, options] of parsed.entries()) {
                event.cookies.set(name, decodeURIComponent(options.value), {
                    maxAge: options["max-age"] ? options["max-age"] : undefined,
                    path: options.path ?? "/",
                    httpOnly: options.httponly,
                    sameSite: "none",
                    domain: `.${parseTopLevelDomain(PUBLIC_BETTER_AUTH_URL).domain}`,
                });
            }

            const betterAuthToken = event.cookies.get("__Secure-better-auth.session_token");
            if (!betterAuthToken) {
                logger.error(`No betterAuthToken found for user ${form.data.username}`);
                return fail(500, { form });
            }

            // Important : reencode the cookie value because it is decoded by the browser
            const bearerCookie = `__Secure-better-auth.session_token=${encodeURIComponent(betterAuthToken)}`;

            // Get the JWT token
            let jwtTokenResponse: Response | null = null;
            try {
                logger.info({ username: form.data.username }, "Fetching JWT token for user");
                logger.info({ bearerCookie }, "Bearer cookie");
                logger.info({ PUBLIC_BETTER_AUTH_URL }, "Public better auth url");

                jwtTokenResponse = await event.fetch(`${PUBLIC_BETTER_AUTH_URL}/api/auth/token`, {
                    headers: {
                        cookie: `${bearerCookie}`,
                    },
                });
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

            logger.info({ jwtToken }, "JWT token received");

            // Set the token in apex domain so that it is available in all subdomains
            // As we are using different domain for c# backend
            event.cookies.set("token", jwtToken.token, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: "/",
                httpOnly: true,
                sameSite: "lax",
                domain: `.${parseTopLevelDomain(PUBLIC_BETTER_AUTH_URL).domain}`,
            });

            logger.info({ username: form.data.username }, "User logged in successfully");

            const sessionHeaders: Headers = new Headers();
            sessionHeaders.set("Cookie", `${bearerCookie}`);

            const session = await auth.api.getSession({ headers: sessionHeaders });
            if (!session) {
                logger.error({ username: form.data.username }, "Session retrieval failed for user");
                return fail(500, { form, response: "Session retrieval failed" });
            }

            // Update the lastLogin
            await db.user.update({
                where: { id: session.user.id },
                data: { lastLogin: new Date() },
            });
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

        logger.info({ username: form.data.username }, "User logged in successfully");

        // Login successful
        throw redirect(302, "/");
    },
};