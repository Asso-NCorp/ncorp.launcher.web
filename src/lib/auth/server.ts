import { betterAuth, logger } from "better-auth";
import { username, jwt, bearer, admin, organization, openAPI, createAuthMiddleware } from "better-auth/plugins";
import { createPool } from "mysql2/promise";
import {
    BETTER_AUTH_SECRET,
    MYSQL_DATABASE,
    MYSQL_HOST,
    MYSQL_PASSWORD,
    MYSQL_PORT,
    MYSQL_USER,
} from "$env/static/private";
import { PUBLIC_BETTER_AUTH_URL, PUBLIC_OAUTH2_REDIRECT_URI, PUBLIC_OAUTH2_SERVER_HOST } from "$env/static/public";
import { getRequestEvent } from "$app/server";
import { parse as parseTopLevelDomain } from "tldts";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { genericOAuth } from "better-auth/plugins";
import { sendEmail } from "$src/lib/server/email";

// Compute the domain once to ensure consistency across all cookie operations
const AUTH_DOMAIN = `.${parseTopLevelDomain(PUBLIC_BETTER_AUTH_URL).domain}`;

export const auth = betterAuth({
    database: createPool({
        host: MYSQL_HOST,
        database: MYSQL_DATABASE,
        user: MYSQL_USER,
        password: MYSQL_PASSWORD,
        port: parseInt(MYSQL_PORT),
        charset: "utf8mb4",
    }),
    advanced: {
        crossSubDomainCookies: {
            enabled: true,
            domain: AUTH_DOMAIN,
        },
        defaultCookieAttributes: {
            secure: true,
            sameSite: "none", // obligatoire pour partager entre sous-domaines
            httpOnly: true,
            partitioned: true,
        },
    },
    secret: BETTER_AUTH_SECRET,
    user: {
        additionalFields: {
            role: {
                type: "string",
            },
            lastLogin: {
                type: "date",
            },
            approvalStatus: {
                type: "string",
            },
        },
    },
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
        sendResetPassword: async ({ user, url, token }) => {
            const subject = "Réinitialisation de votre mot de passe - NCORP Launcher";
            const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation de mot de passe</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; color: #333; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background-color: #000000; color: #ffffff; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 30px; }
        .content p { font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
        .button-container { text-align: center; margin: 30px 0; }
        .button { background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; transition: background-color 0.3s; }
        .button:hover { background-color: #333333; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
        .link-fallback { font-size: 12px; color: #6b7280; word-break: break-all; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>NCORP Launcher</h1>
        </div>
        <div class="content">
            <p>Bonjour <strong>${user.name || user.email}</strong>,</p>
            <p>Nous avons reçu une demande de réinitialisation du mot de passe pour votre compte. Si vous êtes à l'origine de cette demande, cliquez sur le bouton ci-dessous :</p>
            <div class="button-container">
                <a href="${url}" class="button">Réinitialiser mon mot de passe</a>
            </div>
            <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller le lien suivant dans votre navigateur :</p>
            <p class="link-fallback">${url}</p>
            <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail en toute sécurité.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} NCORP. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>`;
            const text = `Bonjour ${user.name || user.email},\n\nNous avons reçu une demande de réinitialisation de mot de passe pour votre compte.\n\nPour réinitialiser votre mot de passe, veuillez cliquer sur le lien suivant : ${url}\n\nSi vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail.`;

            await sendEmail({
                to: user.email,
                subject,
                text,
                html,
            });
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 30, // 30 days,
    },
    plugins: [
        username(),
        admin(),
        bearer(),
        jwt({
            jwks: {
                disablePrivateKeyEncryption: true,
                keyPairConfig: { alg: "ES512" },
            },
            jwt: {
                expirationTime: "30d",
                issuer: PUBLIC_BETTER_AUTH_URL,
            },
        }),
        openAPI(),
        organization({
            allowUserToCreateOrganization: false,
        }),
        genericOAuth({
            config: [
                {
                    providerId: "nlan", // identifiant interne du provider
                    clientId: "launcher-client",
                    discoveryUrl: `https://${PUBLIC_OAUTH2_SERVER_HOST}/.well-known/openid-configuration`,
                    redirectURI: PUBLIC_OAUTH2_REDIRECT_URI,
                    scopes: ["openid", "profile", "email"],
                    pkce: true,
                    authorizationUrlParams: {
                        prompt: "login", // ou "select_account"
                    },
                },
            ],
        }),
        sveltekitCookies(getRequestEvent),
    ],
    hooks: {
        after: createAuthMiddleware(async (ctx) => {
            if (ctx.path === "/sign-out") {
                logger.info("Sign-out detected, clearing cookies");
                ctx.setCookie("token", "", {
                    httpOnly: true,
                    path: "/",
                    maxAge: 0,
                    domain: AUTH_DOMAIN,
                });

                ctx.setCookie("nlan.auth", "", {
                    httpOnly: true,
                    maxAge: 0,
                    domain: AUTH_DOMAIN,
                });
            }

            // on hooke uniquement les callbacks OAuth2
            if (ctx.path.startsWith("/oauth2/callback")) {
                const session = ctx.context.newSession;
                if (session) {
                    // 1. Récupère le token de session Better Auth
                    const sessionToken = session.session.token;

                    // 2. Appelle /api/auth/token pour obtenir le JWT
                    const res = await fetch(`${PUBLIC_BETTER_AUTH_URL}/api/auth/token`, {
                        headers: {
                            Authorization: `Bearer ${sessionToken}`,
                        },
                    });

                    if (res.ok) {
                        const { token: jwt } = await res.json();

                        // 3. Pose le JWT dans un cookie partagé
                        ctx.setCookie("token", jwt, {
                            domain: AUTH_DOMAIN,
                            path: "/",
                            httpOnly: true,
                            secure: true,
                            sameSite: "none",
                            maxAge: 60 * 60 * 24 * 30, // 30 jours
                        });
                    }
                }
            }
        }),
    },
    appName: "NCorp Launcher",
    trustedOrigins: [PUBLIC_BETTER_AUTH_URL],
});

export type ServerSession = typeof auth.$Infer.Session;
