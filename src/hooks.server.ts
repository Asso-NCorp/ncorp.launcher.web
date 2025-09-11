import { type Handle } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { auth } from "./lib/auth/server";
import { building } from "$app/environment";
import { db } from "$srv/db";
import { logger } from "./lib/stores/loggerStore";
import { getServerApi } from "./lib/utils";
import { getWinnerGifFiles } from "./lib/server/fileUtils";
import type { InstallableGameExtended } from "./lib/types";
import { extendGames } from "./lib/utils/games";

const initializeDefaults = (event: Parameters<Handle>[0]['event']) => {
    event.locals.session = undefined;
    event.locals.user = undefined;
    event.locals.liveUsers = [];
    event.locals.localGamesDir = undefined;
    event.locals.events = [];
    event.locals.globalSettings = [];
    event.locals.availableGames = [];
    event.locals.roles = [];
    event.locals.winnersGifsFiles = [];
};

const handleAuthentication = async (event: Parameters<Handle>[0]['event'], jwtToken: string | undefined) => {
    try {
        const session = await auth.api.getSession({
            headers: event.request.headers,
        });

        event.locals.session = session?.session;
        event.locals.user = session?.user;

        if (jwtToken && event.locals.user) {
            try {
                const [liveUsers, userSettings] = await Promise.all([
                    getServerApi(jwtToken).getOnlineUsers(),
                    db.user_settings.findFirst({
                        where: { user_id: event.locals.user.id },
                        select: { local_games_dir: true }
                    })
                ]);
                
                event.locals.liveUsers = liveUsers;
                event.locals.localGamesDir = userSettings?.local_games_dir;
            } catch (error) {
                logger.error(`Error fetching user data: ${error}`);
                event.locals.liveUsers = [];
            }
        }
    } catch (error) {
        logger.error(`Error getting session: ${error}`);
        event.locals.session = undefined;
        event.locals.user = undefined;
    }
};

export const handle: Handle = async ({ event, resolve }) => {
    const jwtToken = event.cookies.get("token");
    
    // Initialize all locals with default values
    initializeDefaults(event);
    
    // Handle authentication and user-specific data
    await handleAuthentication(event, jwtToken);

    // Fetch global data in parallel for better performance
    try {
        const [events, globalSettings, roles, winnersGifsFiles] = await Promise.all([
            db.event.findMany({ orderBy: { start_time: "asc" } }),
            db.global_settings.findMany(),
            db.role.findMany(),
            getWinnerGifFiles()
        ]);
        
        event.locals.events = events;
        event.locals.globalSettings = globalSettings;
        event.locals.roles = roles;
        event.locals.winnersGifsFiles = winnersGifsFiles;
    } catch (error) {
        logger.error(`Error fetching global data: ${error}`);
        // Keep defaults from initializeDefaults
    }

    // Handle games data separately as it depends on JWT token
    if (jwtToken) {
        try {
            const availableGames = extendGames(await getServerApi(jwtToken).getAvailableGames());
            const slugs = availableGames
                .map((g: InstallableGameExtended) => g.folderSlug)
                .filter((slug): slug is string => typeof slug === 'string');
            
            if (slugs.length > 0) {
                const installationCounts = await db.user_game.groupBy({
                    by: ["game_slug"],
                    where: { game_slug: { in: slugs }, installed_at: { not: null } },
                    _count: { _all: true },
                });

                const countsMap = new Map(
                    installationCounts.map((r) => [r.game_slug, r._count._all || 0])
                );

                event.locals.availableGames = availableGames.map((game: InstallableGameExtended) => ({
                    ...game,
                    totalInstallations: countsMap.get(game.folderSlug!) ?? 0,
                }));
            } else {
                event.locals.availableGames = availableGames;
            }
        } catch (error) {
            logger.error(`Error fetching available games: ${error}`);
            event.locals.availableGames = [];
        }
    }

    return svelteKitHandler({ event, resolve, auth, building });
};
