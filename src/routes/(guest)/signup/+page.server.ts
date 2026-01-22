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
import { sendEmail } from "$src/lib/server/email";

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

                const betterAuthTokenEntry = [...parsed.entries()].find(([name]) =>
                    name.includes("better-auth.session_token"),
                );
                if (!betterAuthTokenEntry) {
                    logger.error({ phase: "betterAuthToken" }, "signup: missing session token cookie");
                    return fail(500, { form });
                }

                const [betterAuthTokenName, betterAuthTokenOptions] = betterAuthTokenEntry;
                const betterAuthToken = betterAuthTokenOptions.value;

                // Important : reencode the cookie value because it is decoded by the browser
                const bearerCookie = `${betterAuthTokenName}=${encodeURIComponent(betterAuthToken)}`;

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

                // Update lastLogin and referralSource
                const endDb = startStep("db.user.update(lastLogin, referralSource)");
                await withTimeout(
                    db.user.update({
                        where: { id: session.user.id },
                        data: {
                            lastLogin: new Date(),
                            referralSource: $formData.referralSource || null,
                        },
                    }),
                    DB_UPDATE_TIMEOUT_MS,
                    "db.user.update(lastLogin)",
                ).catch((e) =>
                    logger.error({ error: e instanceof Error ? e.message : e }, "signup: lastLogin update failed"),
                );
                endDb();

                // Send notification emails to all admins
                try {
                    const endAdminNotification = startStep("sendAdminNotificationEmails");
                    const admins = await db.user.findMany({
                        where: { role: "admin" },
                        select: { id: true, email: true, name: true, username: true },
                    });

                    if (admins.length > 0) {
                        const newUserName = session.user.name || session.user.username || session.user.email;
                        const newUserEmail = session.user.email;
                        const joinDate = new Date().toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        });

                        for (const admin of admins) {
                            try {
                                const subject = `Nouvel utilisateur en attente d'approbation - ${newUserName}`;
                                const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouvel utilisateur</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #1a0f33; margin: 0; padding: 0; color: #f2f1f6; }
        .container { max-width: 600px; margin: 40px auto; background-color: #1f0a3d; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); border: 1px solid #30155c; }
        .header { background: linear-gradient(135deg, #b88fef 0%, #9d5dff 100%); color: #ffffff; padding: 40px 30px; text-align: center; }
        .logo { font-size: 28px; font-weight: 700; margin-bottom: 20px; letter-spacing: -0.5px; }
        .badge { display: inline-block; background-color: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); color: #fbbf24; padding: 8px 16px; border-radius: 6px; font-weight: 600; margin-top: 12px; font-size: 13px; border: 1px solid rgba(251, 191, 36, 0.3); }
        .content { padding: 40px 30px; background-color: #1a0f33; }
        .greeting { font-size: 18px; font-weight: 600; color: #f2f1f6; margin-bottom: 20px; }
        .message { font-size: 15px; line-height: 1.8; color: #d6d6e0; margin-bottom: 20px; }
        .highlight { color: #b88fef; font-weight: 600; }
        .user-card { background-color: #140825; border: 1px solid #30155c; border-radius: 6px; padding: 20px; margin: 25px 0; }
        .user-info { font-size: 14px; color: #d6d6e0; margin-bottom: 10px; }
        .user-info strong { color: #b88fef; }
        .referral-section { background-color: #140825; border: 1px solid #30155c; border-left: 3px solid #b88fef; border-radius: 6px; padding: 20px; margin: 25px 0; }
        .referral-label { font-weight: 600; color: #f2f1f6; margin-bottom: 8px; font-size: 14px; }
        .referral-text { font-size: 14px; color: #d6d6e0; margin: 0; }
        .cta { text-align: center; margin: 30px 0; }
        .button { background: linear-gradient(135deg, #b88fef 0%, #9d5dff 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block; transition: all 0.3s ease; box-shadow: 0 10px 25px rgba(184, 143, 239, 0.3); }
        .button:hover { transform: translateY(-2px); box-shadow: 0 15px 35px rgba(184, 143, 239, 0.4); }
        .footer { background-color: #1a0f33; padding: 25px; text-align: center; font-size: 12px; color: #b088d9; border-top: 1px solid #30155c; }
        .footer-link { color: #b88fef; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚀 NCORP</div>
            <div class="badge">⚡ Nouvel utilisateur</div>
        </div>
        <div class="content">
            <div class="greeting">Bonjour <span class="highlight">${admin.name || admin.username}</span>,</div>
            <p class="message">Un nouvel utilisateur s'est inscrit et est en attente d'approbation. Veuillez consulter les détails ci-dessous.</p>
            
            <div class="user-card">
                <div class="user-info"><strong>Nom :</strong> ${newUserName}</div>
                <div class="user-info"><strong>Email :</strong> ${newUserEmail}</div>
                <div class="user-info"><strong>Date d'inscription :</strong> ${joinDate}</div>
            </div>
            ${
                $formData.referralSource
                    ? `
            <div class="referral-section">
                <div class="referral-label">Comment l'utilisateur a-t-il connu le projet ?</div>
                <div class="referral-text">${$formData.referralSource}</div>
            </div>
            `
                    : ""
            }

            <p class="message">Veuillez vous connecter à la plateforme d'administration pour examiner et approuver ou rejeter cette demande.</p>
            
            <div class="cta">
                <a href="${PUBLIC_BETTER_AUTH_URL}/admin/user-approvals" class="button">Examiner les demandes</a>
            </div>
        </div>
        <div class="footer">
            <p style="margin: 0; margin-bottom: 10px;">&copy; ${new Date().getFullYear()} NCORP. Tous droits réservés.</p>
            <p style="margin: 0; color: #6b7280;">Cette notification a été envoyée automatiquement</p>
        </div>
    </div>
</body>
</html>`;

                                const text = `Bonjour ${admin.name || admin.username},\n\nUn nouvel utilisateur s'est inscrit et est en attente d'approbation.\n\nNom : ${newUserName}\nEmail : ${newUserEmail}\nDate d'inscription : ${joinDate}\n${$formData.referralSource ? `\nComme l'utilisateur a-t-il connu le projet :\n${$formData.referralSource}\n` : ""}\nVeuillez vous connecter à la plateforme d'administration pour examiner et approuver ou rejeter cette demande.\n\nCordial,\nNEORP Admin`;

                                await sendEmail({
                                    to: admin.email,
                                    subject,
                                    text,
                                    html,
                                });
                            } catch (adminEmailError) {
                                logger.error("Failed to send admin notification email", {
                                    adminId: admin.id,
                                    newUserId: session.user.id,
                                    error: adminEmailError instanceof Error ? adminEmailError.message : adminEmailError,
                                });
                            }
                        }
                    }

                    endAdminNotification({ adminCount: admins.length });
                } catch (adminNotificationError) {
                    logger.error("Failed to send admin notifications", {
                        userId: session.user.id,
                        error:
                            adminNotificationError instanceof Error
                                ? adminNotificationError.message
                                : adminNotificationError,
                    });
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

        // Login successful
        throw redirect(302, "/");
    },
};