import { betterAuth } from "better-auth";
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
            domain: `.${parseTopLevelDomain(PUBLIC_BETTER_AUTH_URL).domain}`,
        },
        defaultCookieAttributes: {
            secure: PUBLIC_BETTER_AUTH_URL.startsWith("https://"),
            sameSite: "none",
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
                console.log("Signout!", ctx.path);
                ctx.setCookie("token", "", {
                    httpOnly: true,
                    maxAge: 0,
                    domain: `.${parseTopLevelDomain(PUBLIC_BETTER_AUTH_URL).domain}`,
                });

                ctx.setCookie("nlan.auth", "", {
                    httpOnly: true,
                    maxAge: 0,
                    domain: `.${parseTopLevelDomain(PUBLIC_BETTER_AUTH_URL).domain}`,
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
                            domain: ".n-lan.com",
                            path: "/",
                            httpOnly: true,
                            secure: true,
                            sameSite: "none",
                            maxAge: 60 * 60, // 1h
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
