// src/hooks.server.ts
import { redirect, type Handle, type HandleFetch } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { auth } from "$lib/auth/server";
import { db } from "$srv/db";
import { building } from "$app/environment";
import { PUBLIC_BACKEND_API_URL, PUBLIC_BETTER_AUTH_URL } from "$env/static/public";
import { logger } from "better-auth";
import { PUBLIC_SIGNIN_PATH } from "$env/static/public";
import { parse as parseTopLevelDomain } from "tldts";

const AUTH_DOMAIN = `.${parseTopLevelDomain(PUBLIC_BETTER_AUTH_URL).domain}`;

/**
 * Attempts to refresh the JWT token from the session if the token cookie is missing or invalid.
 * This prevents unexpected logouts when the token cookie is cleared but the session is still valid.
 */
async function ensureTokenFromSession(event: any, session: any): Promise<string | null> {
    let token = event.cookies.get("token");

    logger.info(`[TOKEN_CHECK] Cookie exists: ${!!token}, Session token exists: ${!!session?.session?.token}`, {
        userId: session?.user?.id,
    });

    // If no token cookie but session exists, try to get JWT from session
    if (!token && session?.session?.token) {
        try {
            logger.info("Token cookie missing, attempting to refresh from session", {
                userId: session?.user?.id,
            });
            const res = await fetch(`${PUBLIC_BETTER_AUTH_URL}/api/auth/token`, {
                headers: {
                    Authorization: `Bearer ${session.session.token}`,
                },
            });

            if (res.ok) {
                const data = await res.json();
                token = data.token;

                // Set the token cookie for future requests
                if (token) {
                    event.cookies.set("token", token, {
                        domain: AUTH_DOMAIN,
                        path: "/",
                        httpOnly: true,
                        secure: true,
                        sameSite: "none",
                        maxAge: 60 * 60 * 24 * 30, // 30 days
                    });
                    logger.info("Token refreshed successfully from session", {
                        userId: session?.user?.id,
                    });
                }
            } else {
                logger.warn("Failed to refresh token from session", {
                    status: res.status,
                    userId: session?.user?.id,
                });
            }
        } catch (e) {
            logger.error("Error refreshing token from session", {
                error: e instanceof Error ? e.message : e,
                userId: session?.user?.id,
            });
        }
    }

    return token || null;
}

const isUnprotected = (routeId: string | null, pathname: string) => {
    // 1) groupe public/guest
    if (routeId && routeId.includes("(guest)")) return true;

    // 2) pages publiques
    const publicPages = new Set([PUBLIC_SIGNIN_PATH, "/signup"]);
    if (publicPages.has(pathname)) return true;

    // 3) routes internes (use startsWith for nested paths)
    const internalRoutes = ["/api/auth", "/api/medias", "/api/avatars", "/api/resources"];
    if (internalRoutes.some((route) => pathname.startsWith(route))) return true;

    // 4) assets / fichiers sans route (favicon, images, etc.)
    if (routeId === null) return true;

    return false; // tout le reste est protégé
};

const isAdminRoute = (routeId: string | null, pathname: string): boolean => {
    // Routes avec le groupe (admin) dans le routeId
    if (routeId && routeId.includes("(admin)")) return true;

    // Routes API avec /admin dans le chemin
    if (pathname.startsWith("/api/admin")) return true;

    return false;
};

export const handle: Handle = async ({ event, resolve }) => {
    const session = await auth.api.getSession(event.request);
    const pathname = event.url.pathname;
    const isProtected = !isUnprotected(event.route.id, pathname);

    // PROTÉGER PAR DÉFAUT
    if (isProtected) {
        if (!session?.user) {
            logger.error(`[HOOKS] Access denied - no user for ${pathname}`);
            redirect(302, PUBLIC_SIGNIN_PATH);
        }

        // Try to get token from cookie, or refresh from session if missing
        const token = await ensureTokenFromSession(event, session);
        if (!token) {
            logger.error(`[HOOKS] Access denied - no token available for ${pathname}`, {
                userId: session?.user?.id,
            });
            redirect(302, PUBLIC_SIGNIN_PATH);
        }

        event.locals.token = token;
        logger.info(`[HOOKS] Token set successfully for ${pathname}`, {
            userId: session?.user?.id,
        });

        // CHECK ADMIN - for both page routes and API routes
        if (isAdminRoute(event.route.id, pathname)) {
            const roles: string[] = session?.user?.role
                ? Array.isArray(session.user.role)
                    ? session.user.role
                    : [session.user.role]
                : [];

            if (!roles.includes("admin")) {
                logger.warn(`[HOOKS] Admin access denied for ${pathname}`, {
                    userId: session?.user?.id,
                    roles,
                });

                // For API routes, return 403 error
                if (pathname.startsWith("/api")) {
                    return new Response(JSON.stringify({ error: "Forbidden" }), {
                        status: 403,
                        headers: { "Content-Type": "application/json" },
                    });
                }

                // For pages, redirect to forbidden
                redirect(302, "/forbidden");
            }
        }
    }

    // locals
    event.locals.session = session?.session;
    event.locals.user = session?.user;

    if (event.locals.user) {
        try {
            const localGamesDir = await db.user_settings.findFirst({
                where: { user_id: event.locals.user.id },
            });
            if (localGamesDir) {
                event.locals.localGamesDir = localGamesDir.local_games_dir;
            }
        } catch (e) {
            console.error("DB error in hooks", e);
        }
    }

    return svelteKitHandler({ event, resolve, auth, building });
};

export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
    if (request.url.startsWith(`${PUBLIC_BACKEND_API_URL}/api`)) {
        const token = event.cookies.get("token");
        if (token) {
            const headers = new Headers(request.headers);
            headers.set("Authorization", `Bearer ${token}`);
            request = new Request(request, { headers, credentials: "include" });
        }
    }
    return fetch(request);
};
