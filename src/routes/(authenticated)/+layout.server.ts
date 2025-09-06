import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";
import { logger } from "$src/lib/stores/loggerStore";
import { getServerApi } from "$src/lib/utils";
import { type LiveUser } from "$src/lib/shared-models";
import { db } from "$srv/db";
import type { event, global_settings } from "@prisma/client";
import { getWinnerGifFiles } from "$src/lib/server/fileUtils";
import { extendGames } from "$src/lib/utils/games";
import type { InstallableGameExtended } from "$src/lib/types";
import { auth } from "$src/lib/auth/server";
export const load: LayoutServerLoad = async ({ locals, request, cookies }) => {
    const session = await auth.api.getSession(request);
    console.log("Session : ", session);
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
        console.error("Error fetching live users");
    }

    const url = new URL(request.url);

    if (url.pathname.startsWith("/admin")) {
        if (!user?.role?.includes("admin")) {
            logger.error(`Unauthorized access attempt to admin route by: ${user?.id}`);
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
        logger.error(`Error fetching events: ${error}`);
    }

    try {
        // Get global settings
        const globalSettings = await db.global_settings.findMany();
        locals.globalSettings = globalSettings;
    } catch (error) {
        logger.error(`Error fetching global settings: ${error}`);
    }

    try {
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
        locals.availableGames = withCounts;
    } catch (error) {
        logger.error(`Error fetching available games: ${error}`);
    }

    try {
        const roles = await db.role.findMany();
        locals.roles = roles;
    } catch (error) {
        logger.error(`Error fetching user roles: ${error}`);
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
        token: jwtToken,
    };
};
