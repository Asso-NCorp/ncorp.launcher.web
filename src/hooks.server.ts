// src/hooks.server.ts
import { redirect, type Handle, type HandleFetch } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { auth } from "$lib/auth/server";
import { db } from "$srv/db";
import { building } from "$app/environment";
import { PUBLIC_BACKEND_API_URL } from "$env/static/public";
import { logger } from "better-auth";

const loginPath = "/login";

const isUnprotected = (routeId: string | null, pathname: string) => {
    // 1) groupe public/guest
    if (routeId && routeId.includes("(guest)")) return true;

    // 2) pages publiques
    const publicPages = new Set([loginPath, "/signup"]);
    if (publicPages.has(pathname)) return true;

    // 3) routes internes better-auth
    if (pathname.startsWith("/api/auth")) return true;

    // 4) assets / fichiers sans route (favicon, images, etc.)
    if (routeId === null) return true;

    return false; // tout le reste est protégé
};

export const handle: Handle = async ({ event, resolve }) => {
    const session = await auth.api.getSession(event.request);

    // PROTÉGER PAR DÉFAUT
    if (!isUnprotected(event.route.id, event.url.pathname)) {
        if (!session?.user) redirect(302, loginPath);

        const token = event.cookies.get("token");
        if (!token) {
            logger.error("No token in cookies");
            redirect(302, loginPath);
        }

        event.locals.token = token;

        // CHECK ADMIN
        if (event.route.id?.includes("(admin)")) {
            const roles: string[] = session?.user?.role
                ? Array.isArray(session.user.role)
                    ? session.user.role
                    : [session.user.role]
                : [];

            if (!roles.includes("admin")) {
                logger.warn(`User ${session?.user?.id} tried to access admin route`);
                redirect(302, "/forbidden"); // crée une page 403 ou redirige /signin
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
