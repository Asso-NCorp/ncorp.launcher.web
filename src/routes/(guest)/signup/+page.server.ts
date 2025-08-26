import type { Actions, PageServerLoad } from "./$types";
import { fail, setError, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { APIError } from "better-auth/api";
import { redirect } from "@sveltejs/kit";
import { auth } from "$src/lib/auth/server";
import { parseSetCookieHeader } from "better-auth/cookies";
import { PUBLIC_BETTER_AUTH_URL } from "$env/static/public";
import { signupFormSchema } from "../schemas";
import { parse as parseTopLevelDomain } from "tldts";

import { logger } from "$src/lib/stores/loggerStore";
import { generateRandomAvatar } from "$src/lib/utils.server";

export const load: PageServerLoad = (async () => {
    return {
        form: await superValidate(zod(signupFormSchema)),
    };
}) satisfies PageServerLoad;

export const actions: Actions = {
    default: async (event) => {
        const form = await superValidate(event, zod(signupFormSchema));
        if (!form.valid) {
            return fail(400, {
                form,
            });
        }

        try {
            const authResponse = await auth.api.signUpEmail({
                asResponse: true,
                body: {
                    username: form.data.username,
                    email: form.data.email,
                    password: form.data.password,
                    name: form.data.name,
                    role: "user",
                    image: "/api/avatars/" + form.data.username,
                },
            });

            if (authResponse) {
                const cookieString = authResponse.headers.get("set-cookie");
                if (!cookieString) {
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
                        domain: `.${parseTopLevelDomain(PUBLIC_BETTER_AUTH_URL).domain}`,
                    });
                }

                const betterAuthToken = event.cookies.get("__Secure-better-auth.session_token");
                if (!betterAuthToken) {
                    return fail(500, { form });
                }

                // Important : reencode the cookie value because it is decoded by the browser
                const bearerCookie = `__Secure-better-auth.session_token=${encodeURIComponent(betterAuthToken)}`;

                // Get the JWT token
                let jwtTokenResponse: Response | null = null;
                try {
                    jwtTokenResponse = await event.fetch(`${PUBLIC_BETTER_AUTH_URL}/api/auth/token`, {
                        headers: {
                            cookie: `${bearerCookie}`,
                        },
                    });
                } catch (error) {
                    return fail(500, { form, response: error });
                }

                if (!jwtTokenResponse.ok) {
                    return fail(500, { form, response: jwtTokenResponse.statusText });
                }

                const jwtToken = await jwtTokenResponse.json();
                if (!jwtToken) {
                    return fail(500, { form });
                }

                // Set the token in apex domain so that it is available in all subdomains
                // As we are using different domain for c# backend
                event.cookies.set("token", jwtToken.token, {
                    maxAge: 60 * 60 * 24 * 30, // 30 days
                    path: "/",
                    httpOnly: true,
                    sameSite: "lax",
                    domain: `.${parseTopLevelDomain(PUBLIC_BETTER_AUTH_URL).domain}`,
                });

                const sessionHeaders: Headers = new Headers();
                sessionHeaders.set("Cookie", `${bearerCookie}`);

                const session = await auth.api.getSession({ headers: sessionHeaders });
                if (!session) {
                    return fail(500, { form, response: "Session retrieval failed" });
                }

                try {
                    await generateRandomAvatar(session.user.id);
                } catch (error) {
                    logger.debug({ error }, "Error occurred while generating random avatar");
                }
            }
        } catch (error) {
            console.log(error);
            if (error instanceof APIError) {
                if (error.body?.message) return setError(form, "", error.body.message);
                else return setError(form, "", "Une erreur fatale est survenue 🥵");
            }

            throw error;
        }

        try {
            await generateRandomAvatar(form.data.username);
        } catch (error) {
            logger.error({ error }, "Error occurred while saving the avatar");
        }

        // Login successful
        throw redirect(302, "/");
    },
};
