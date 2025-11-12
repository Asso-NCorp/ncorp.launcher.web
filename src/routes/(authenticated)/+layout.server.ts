import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";
import { logger } from "$src/lib/stores/loggerStore";
import { getServerApi } from "$src/lib/utils";
import { db } from "$srv/db";
import { getWinnerGifFiles } from "$src/lib/server/fileUtils";
import { extendGames } from "$src/lib/utils/games";
import { fetchLiveServers } from "$src/lib/utils/liveServers";
import type { InstallableGameExtended } from "$src/lib/types";
import type { event, global_settings, role } from "@prisma/client";
import type { LiveUser } from "$src/lib/shared-models";
import type { DetectedServer } from "$src/lib/utils/liveServers";

// Cache config
const GLOBAL_CACHE_TTL_MS = 60_000;
const GAMES_CACHE_TTL_MS = 30_000;
const GAME_ROUTE_PREFIXES = ["/"];

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

const isStale = (c: { fetchedAt: number } | null, ttl: number) => !c || Date.now() - c.fetchedAt > ttl;
const routeRequiresGames = (path: string) => GAME_ROUTE_PREFIXES.some((p) => path.startsWith(p));

export const load: LayoutServerLoad = async ({ locals, url, depends }) => {
    logger.info("Layout load");
    const user = locals.user;
    const jwtToken = locals.token as string | undefined;

    // Add dependency for live servers
    depends("app:liveServers");

    // Global cached data
    if (isStale(globalCache, GLOBAL_CACHE_TTL_MS)) {
        try {
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
        } catch (e) {
            logger.error(`Error fetching global data: ${e}`);
            globalCache ||= {
                events: [],
                globalSettings: [],
                roles: [],
                winnersGifsFiles: [],
                fetchedAt: Date.now(),
            };
        }
    }

    // Per-user / conditional data
    let liveUsers: LiveUser[] = [];
    let localGamesDir: string | undefined = undefined;
    if (jwtToken && user) {
        try {
            const [usersOnline, userSettings] = await Promise.all([
                getServerApi(jwtToken).getOnlineUsers(),
                db.user_settings.findFirst({
                    where: { user_id: user.id },
                    select: { local_games_dir: true },
                }),
            ]);
            liveUsers = usersOnline;
            localGamesDir = userSettings?.local_games_dir;
        } catch (e) {
            logger.error(`Error fetching user-scoped data: ${e}`);
        }
    }

    // Fetch live servers (server-side caching handled by the API)
    let liveServers: DetectedServer[] = [];
    try {
        liveServers = await fetchLiveServers();
    } catch (e) {
        logger.error(`Error fetching live servers: ${e}`);
    }

    // Available games cached & conditional
    let availableGames: InstallableGameExtended[] = [];
    if (jwtToken && routeRequiresGames(url.pathname)) {
        try {
            if (isStale(gamesCache, GAMES_CACHE_TTL_MS)) {
                logger.info("Games cache stale -> fetching available games");
                const availableGamesRaw = await getServerApi(jwtToken).getAvailableGames();
                const extended = extendGames(availableGamesRaw);
                const slugs = extended
                    .map((g: InstallableGameExtended) => g.folderSlug)
                    .filter((s): s is string => !!s);
                if (slugs.length) {
                    const installationCounts = await db.user_game.groupBy({
                        by: ["game_slug"],
                        where: { game_slug: { in: slugs }, installed_at: { not: null } },
                        _count: { _all: true },
                    });
                    const countsMap = new Map(installationCounts.map((r) => [r.game_slug, r._count._all || 0]));
                    gamesCache = {
                        availableGames: extended.map((g: InstallableGameExtended) => ({
                            ...g,
                            totalInstallations: countsMap.get(g.folderSlug!) ?? 0,
                        })),
                        fetchedAt: Date.now(),
                    };
                } else {
                    gamesCache = { availableGames: extended, fetchedAt: Date.now() };
                }
            } else {
                logger.debug("Using cached available games");
            }
            availableGames = gamesCache?.availableGames ?? [];

            // Load user favorites and match them to games
            if (jwtToken && user) {
                try {
                    const userFavorites = await db.user_game_favorite.findMany({
                        where: { user_id: user.id },
                        select: { game_slug: true },
                    });
                    const favoriteSet = new Set(userFavorites.map((f) => f.game_slug));
                    availableGames = availableGames.map((g) => ({
                        ...g,
                        isFavorite: favoriteSet.has(g.folderSlug!),
                    }));
                } catch (e) {
                    logger.error(`Error fetching user favorites: ${e}`);
                    // Default to isFavorite: false for all games if there's an error
                    availableGames = availableGames.map((g) => ({
                        ...g,
                        isFavorite: false,
                    }));
                }
            } else {
                // Default to isFavorite: false for all games if no user
                availableGames = availableGames.map((g) => ({
                    ...g,
                    isFavorite: false,
                }));
            }
        } catch (e) {
            logger.error(`Error fetching available games: ${e}`);
        }
    } else {
        logger.debug("Skipping available games fetch for this route");
    }

    return {
        user,
        liveUsers,
        localGamesDir,
        events: globalCache?.events ?? [],
        globalSettings: globalCache?.globalSettings ?? [],
        winnersGifsFiles: globalCache?.winnersGifsFiles ?? [],
        availableGames,
        roles: globalCache?.roles ?? [],
        liveServers,
    };
};
