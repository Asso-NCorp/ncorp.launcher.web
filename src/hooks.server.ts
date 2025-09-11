import { redirect, type Handle } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { auth } from "./lib/auth/server";
import { building } from "$app/environment";
import { db } from "$srv/db";
import type { LiveUser } from "./lib/shared-models";
import { logger } from "./lib/stores/loggerStore";
import { getServerApi } from "./lib/utils";
import { getWinnerGifFiles } from "./lib/server/fileUtils";
import type { InstallableGameExtended } from "./lib/types";
import { extendGames } from "./lib/utils/games";

export const handle: Handle = async ({ event, resolve }) => {
    const jwtToken = event.cookies.get("token");
    try {
        // Get session from auth
        const session = await auth.api.getSession({
            headers: event.request.headers,
        });

        // Set session and user to locals
        event.locals.session = session?.session;
        event.locals.user = session?.user;

        let liveUsers: LiveUser[] = [];
        try {
            if (jwtToken) {
                liveUsers = await getServerApi(jwtToken).getOnlineUsers();
                event.locals.liveUsers = liveUsers;
            }
        } catch (error) {
            console.error("Error fetching live users");
        }

        if (event.locals.user) {
            const localGamesDir = await db.user_settings.findFirst({
                where: {
                    user_id: event.locals.user.id,
                },
            });

            if (localGamesDir) {
                event.locals.localGamesDir = localGamesDir.local_games_dir;
            }
        }
    } catch (error) {
        console.error("Error getting session", error);
        event.locals.session = undefined;
        event.locals.user = undefined;
    }

    try {
        // Get events from the server
        const events = await db.event.findMany({
            orderBy: { start_time: "asc" },
        });
        event.locals.events = events;
    } catch (error) {
        logger.error(`Error fetching events: ${error}`);
    }

    try {
        // Get global settings
        const globalSettings = await db.global_settings.findMany();
        event.locals.globalSettings = globalSettings;
    } catch (error) {
        logger.error(`Error fetching global settings: ${error}`);
    }

    try {
        if (jwtToken) {
            const availableGames = extendGames(await getServerApi(jwtToken).getAvailableGames());
            const slugs = availableGames.map((g: InstallableGameExtended) => g.folderSlug!);
            if (slugs.length === 0) return { availableGames: [] };

            const rows = await db.user_game.groupBy({
                by: ["game_slug"],
                where: { game_slug: { in: slugs }, installed_at: { not: null } },
                _count: { _all: true },
            });

            const counts = new Map(rows.map((r) => [r.game_slug, r._count._all]));

            const withCounts = availableGames.map((g: InstallableGameExtended) => ({
                ...g,
                totalInstallations: counts.get(g.folderSlug!) ?? 0,
            }));

            // si tu utilises locals ailleurs
            event.locals.availableGames = withCounts;
        }
    } catch (error) {
        logger.error(`Error fetching available games: ${error}`);
    }

    try {
        const roles = await db.role.findMany();
        event.locals.roles = roles;
    } catch (error) {
        logger.error(`Error fetching user roles: ${error}`);
    }

    try {
        const winnersGifsFiles = await getWinnerGifFiles();
        event.locals.winnersGifsFiles = winnersGifsFiles;
    } catch (error) {
        logger.error(`Error fetching winner GIF files: ${error}`);
    }

    return svelteKitHandler({ event, resolve, auth, building });
};
