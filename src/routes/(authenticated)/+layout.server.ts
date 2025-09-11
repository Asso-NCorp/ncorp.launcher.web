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
export const load: LayoutServerLoad = async ({ locals }) => {
    // Data (events, settings, roles, gifs, availableGames) now provided via hook with caching.
    const user = locals.user;
    const localGamesDir = locals.localGamesDir;

    logger.info("Layout load");

    return {
        user,
        liveUsers: locals.liveUsers as LiveUser[],
        localGamesDir,
        events: locals.events as event[],
        globalSettings: locals.globalSettings as global_settings[],
        winnersGifsFiles: locals.winnersGifsFiles as string[],
        availableGames: locals.availableGames,
        roles: locals.roles,
    };
};
