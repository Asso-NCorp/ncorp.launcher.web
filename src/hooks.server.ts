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
import type { event, global_settings, role } from "@prisma/client";

// Caching configuration (tune as needed)
const GLOBAL_CACHE_TTL_MS = 60_000; // 60s
const GAMES_CACHE_TTL_MS = 30_000; // 30s
const GAME_ROUTE_PREFIXES = ["/games"]; // paths that need available games

// In-memory caches (reset on server restart / deploy)
let globalCache: {
    events: event[];
    globalSettings: global_settings[];
    roles: role[];
    winnersGifsFiles: string[];
    fetchedAt: number;
} | null = null;

let gamesCache: {
    availableGames: InstallableGameExtended[];
    fetchedAt: number;
} | null = null;

const isStale = (cached: { fetchedAt: number } | null, ttl: number) => !cached || Date.now() - cached.fetchedAt > ttl;

const routeRequiresGames = (path: string) => GAME_ROUTE_PREFIXES.some((p) => path.startsWith(p));

const initializeDefaults = (event: Parameters<Handle>[0]["event"]) => {
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

const handleAuthentication = async (event: Parameters<Handle>[0]["event"], jwtToken: string | undefined) => {
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
                        select: { local_games_dir: true },
                    }),
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
    const path = event.url.pathname;

    logger.info(`Handling request for ${path}`);

    // Initialize all locals with default values
    initializeDefaults(event);

    // Handle authentication and user-specific data
    await handleAuthentication(event, jwtToken);

    // Global (mostly static) data with cache
    try {
        if (isStale(globalCache, GLOBAL_CACHE_TTL_MS)) {
            logger.info("Global cache stale -> fetching");
            const [events, globalSettings, roles, winnersGifsFiles] = await Promise.all([
                db.event.findMany({ orderBy: { start_time: "asc" } }),
                db.global_settings.findMany(),
                db.role.findMany(),
                getWinnerGifFiles(),
            ]);
            globalCache = {
                events,
                globalSettings,
                roles,
                winnersGifsFiles,
                fetchedAt: Date.now(),
            };
        } else {
            logger.debug("Using cached global data");
        }

        // Apply cached globals to locals
        event.locals.events = globalCache.events;
        event.locals.globalSettings = globalCache.globalSettings;
        event.locals.roles = globalCache.roles;
        event.locals.winnersGifsFiles = globalCache.winnersGifsFiles;
    } catch (error) {
        logger.error(`Error fetching global data: ${error}`);
        // defaults remain
    }

    // Available games (conditional + cache)
    if (jwtToken && routeRequiresGames(path)) {
        try {
            if (isStale(gamesCache, GAMES_CACHE_TTL_MS)) {
                logger.info("Games cache stale -> fetching available games");
                const availableGamesRaw = await getServerApi(jwtToken).getAvailableGames();
                const availableGames = extendGames(availableGamesRaw);
                const slugs = availableGames
                    .map((g: InstallableGameExtended) => g.folderSlug)
                    .filter((slug): slug is string => typeof slug === "string");

                if (slugs.length > 0) {
                    const installationCounts = await db.user_game.groupBy({
                        by: ["game_slug"],
                        where: { game_slug: { in: slugs }, installed_at: { not: null } },
                        _count: { _all: true },
                    });
                    const countsMap = new Map(installationCounts.map((r) => [r.game_slug, r._count._all || 0]));
                    gamesCache = {
                        availableGames: availableGames.map((game: InstallableGameExtended) => ({
                            ...game,
                            totalInstallations: countsMap.get(game.folderSlug!) ?? 0,
                        })),
                        fetchedAt: Date.now(),
                    };
                } else {
                    gamesCache = {
                        availableGames,
                        fetchedAt: Date.now(),
                    };
                }
            } else {
                logger.debug("Using cached available games");
            }
            event.locals.availableGames = gamesCache.availableGames;
        } catch (error) {
            logger.error(`Error fetching available games: ${error}`);
            event.locals.availableGames = [];
        }
    } else {
        logger.debug("Skipping available games fetch (not needed for this route)");
    }

    return svelteKitHandler({ event, resolve, auth, building });
};
