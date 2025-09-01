import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";
import { logger } from "$src/lib/stores/loggerStore";
import { getServerApi } from "$src/lib/utils";
import { type LiveUser } from "$src/lib/shared-models";
import { db } from "$srv/db";
import type { event, global_settings } from "@prisma/client";
import { getWinnerGifFiles } from "$src/lib/server/fileUtils";
import { extendGames } from "$src/lib/utils/games";
export const load: LayoutServerLoad = async ({ locals, request, cookies }) => {
    const session = locals.session;
    const user = locals.user;
    const localGamesDir = locals.localGamesDir;

    if (!session) {
        logger.error("Admin : No session");
        throw redirect(302, "/signin");
    }

    const jwtToken = cookies.get("token");
    if (!jwtToken) {
        logger.error("Admin : No token");
        throw redirect(302, "/signin");
    }

    let liveUsers: LiveUser[] = [];
    try {
        liveUsers = await getServerApi(jwtToken).getOnlineUsers();
        locals.liveUsers = liveUsers;
    } catch (error) {
        logger.error("Error fetching live users", error);
    }

    const url = new URL(request.url);

    if (url.pathname.startsWith("/admin")) {
        if (!user?.role?.includes("admin")) {
            logger.error("Unauthorized access attempt to admin route by:", user?.id);
            return redirect(302, "/");
        }
    }

    try {
        // Get events from the server
        const events = await db.event.findMany({
            orderBy: { start_time: "asc" },
        });
        locals.events = events;
    } catch (error) {
        logger.error("Error fetching events", error);
    }

    try {
        // Get global settings
        const globalSettings = await db.global_settings.findMany();
        locals.globalSettings = globalSettings;
    } catch (error) {
        logger.error("Error fetching global settings", error);
    }

    try {
        // Get available games
        const availableGames = extendGames(await getServerApi(jwtToken).getAvailableGames());
        locals.availableGames = availableGames;
    } catch (error) {
        logger.error("Error fetching available games", error);
    }

    try {
        const roles = await db.role.findMany();
        locals.roles = roles;
    } catch (error) {
        logger.error("Error fetching user roles", error);
    }

    const winnersGifsFiles = await getWinnerGifFiles();

    return {
        user,
        liveUsers: liveUsers,
        localGamesDir,
        events: locals.events as event[],
        globalSettings: locals.globalSettings as global_settings[],
        winnersGifsFiles,
        availableGames: locals.availableGames,
        roles: locals.roles,
    };
};
