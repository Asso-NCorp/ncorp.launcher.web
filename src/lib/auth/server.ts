import { betterAuth } from "better-auth";
import { username, jwt, bearer, admin, organization, openAPI, createAuthMiddleware } from "better-auth/plugins";
import { createPool } from "mysql2/promise";
import { BETTER_AUTH_SECRET, MYSQL_DATABASE, MYSQL_HOST, MYSQL_PASSWORD, MYSQL_PORT, MYSQL_USER } from "$env/static/private";
import { PUBLIC_BETTER_AUTH_URL } from "$env/static/public";

import { parse as parseTopLevelDomain } from 'tldts';

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
            domain: `.${parseTopLevelDomain(PUBLIC_BETTER_AUTH_URL).domain}`
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
                type: "string"
            }
        }
    },
    emailAndPassword: {
        enabled: true,
        autoSignIn: true
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
                keyPairConfig: { alg: "ES512" }
            },
            jwt: {
                expirationTime: "30d",
                issuer: PUBLIC_BETTER_AUTH_URL,
            },
        }),
        openAPI(),
        organization({
            allowUserToCreateOrganization: false,
        })
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
            }
        })
    },
    appName: "NCorp Launcher",
    trustedOrigins: [PUBLIC_BETTER_AUTH_URL]
})

export type ServerSession = typeof auth.$Infer.Session