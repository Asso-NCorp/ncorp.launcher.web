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
            secure: PUBLIC_BETTER_AUTH_URL.startsWith("https://"),
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
        },
    },
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
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
