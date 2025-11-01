import { db } from "$srv/db";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { PUBLIC_SIGNIN_PATH } from "$env/static/public";

// Types for better code organization
type UserInfo = {
    id: string;
    name: string;
    displayUsername: string | null;
    image: string | null;
    role: string | null;
};

type GameSession = {
    id: string;
    user_id: string;
    game_slug: string;
    start_time: Date;
    end_time: Date | null;
    total_seconds: number | null;
    user: UserInfo;
};

type GameSummary = {
    game_slug: string;
    totalPlayTime: number;
    sessionCount: number;
    user: UserInfo;
    lastPlayedTime: Date;
    isCurrentUser: boolean;
};

type ActivitySession = {
    id: string;
    game_slug: string;
    start_time: Date;
    end_time: Date | null;
    total_seconds: number;
    user: UserInfo;
    isCurrentUser: boolean;
};

/**
 * Fetch current user's game sessions
 */
async function getCurrentUserSessions(userId: string): Promise<GameSession[]> {
    return await db.game_session.findMany({
        where: { user_id: userId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    displayUsername: true,
                    image: true,
                    role: true,
                },
            },
        },
        orderBy: { start_time: "desc" },
        take: 50, // Increased to get more sessions
    });
}

/**
 * Fetch other users' game sessions
 */
async function getOtherUsersSessions(currentUserId: string): Promise<GameSession[]> {
    return await db.game_session.findMany({
        where: {
            user_id: { not: currentUserId },
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    displayUsername: true,
                    image: true,
                    role: true,
                },
            },
        },
        orderBy: { start_time: "desc" },
        take: 100, // Increased to get more sessions from other users
    });
}

/**
 * Filter sessions with valid play time (more than 0 seconds)
 */
function filterValidSessions(sessions: GameSession[]): GameSession[] {
    return sessions.filter((session) => (session.total_seconds || 0) > 0);
}

/**
 * Group user sessions by game and calculate totals
 */
function createUserGameSummaries(sessions: GameSession[]): GameSummary[] {
    const gameMap = new Map<string, GameSummary>();

    for (const session of sessions) {
        const gameSlug = session.game_slug;
        let summary = gameMap.get(gameSlug);

        if (!summary) {
            summary = {
                game_slug: gameSlug,
                totalPlayTime: 0,
                sessionCount: 0,
                user: session.user as UserInfo,
                lastPlayedTime: session.start_time,
                isCurrentUser: true,
            };
            gameMap.set(gameSlug, summary);
        }

        summary.totalPlayTime += session.total_seconds || 0;
        summary.sessionCount += 1;

        if (session.start_time > summary.lastPlayedTime) {
            summary.lastPlayedTime = session.start_time;
        }
    }

    return Array.from(gameMap.values()).sort((a, b) => b.totalPlayTime - a.totalPlayTime);
}

/**
 * Convert current user sessions to activity sessions
 */
function createCurrentUserActivitySessions(sessions: GameSession[]): ActivitySession[] {
    return sessions
        .filter((session) => (session.total_seconds || 0) >= 60) // At least 1 minute
        .map((session) => ({
            id: session.id,
            game_slug: session.game_slug,
            start_time: session.start_time,
            end_time: session.end_time,
            total_seconds: session.total_seconds || 0,
            user: session.user,
            isCurrentUser: true,
        }));
}

/**
 * Convert other users' sessions to activity sessions
 */
function createOtherUsersActivitySessions(sessions: GameSession[]): ActivitySession[] {
    return sessions
        .filter((session) => (session.total_seconds || 0) >= 60) // At least 1 minute
        .map((session) => ({
            id: session.id,
            game_slug: session.game_slug,
            start_time: session.start_time,
            end_time: session.end_time,
            total_seconds: session.total_seconds || 0,
            user: session.user,
            isCurrentUser: false,
        }));
}

/**
 * Combine and sort all activity sessions by start time
 */
function combineAndSortActivitySessions(
    currentUserSessions: ActivitySession[],
    otherUsersSessions: ActivitySession[],
): ActivitySession[] {
    return [...currentUserSessions, ...otherUsersSessions]
        .sort((a, b) => b.start_time.getTime() - a.start_time.getTime())
        .slice(0, 30); // Limit to 30 most recent activities
}

/**
 * Calculate trending games based on recent activity (last 7 days)
 * Algorithm prioritizes UNIQUE PLAYERS as primary sort criteria
 * Games with more unique players will ALWAYS rank higher regardless of playtime
 */
function calculateTrendingGames(allSessions: GameSession[]): Array<{
    game_slug: string;
    totalPlayTime: number;
    sessionCount: number;
    uniquePlayers: number;
    lastPlayedTime: Date;
    trendingScore: number;
    players: Array<{
        id: string;
        name: string;
        displayUsername: string | null;
        image: string | null;
        role: string | null;
    }>;
}> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Filter sessions from the last 7 days
    const recentSessions = allSessions.filter(
        (session) => (session.total_seconds || 0) > 0 && session.start_time >= sevenDaysAgo,
    );

    const gameStats = new Map<
        string,
        {
            game_slug: string;
            totalPlayTime: number;
            sessionCount: number;
            uniquePlayers: Set<string>;
            lastPlayedTime: Date;
            players: Map<
                string,
                { id: string; name: string; displayUsername: string | null; image: string | null; role: string | null }
            >;
        }
    >();

    for (const session of recentSessions) {
        const gameSlug = session.game_slug;
        let stats = gameStats.get(gameSlug);

        if (!stats) {
            stats = {
                game_slug: gameSlug,
                totalPlayTime: 0,
                sessionCount: 0,
                uniquePlayers: new Set(),
                lastPlayedTime: session.start_time,
                players: new Map(),
            };
            gameStats.set(gameSlug, stats);
        }

        stats.totalPlayTime += session.total_seconds || 0;
        stats.sessionCount += 1;
        stats.uniquePlayers.add(session.user_id);

        // Add player info
        stats.players.set(session.user_id, {
            id: session.user.id,
            name: session.user.name,
            displayUsername: session.user.displayUsername,
            image: session.user.image,
            role: session.user.role,
        });

        if (session.start_time > stats.lastPlayedTime) {
            stats.lastPlayedTime = session.start_time;
        }
    }

    // Convert to array and calculate trending score
    const result = Array.from(gameStats.values())
        .map((stats) => {
            // Updated trending score calculation - prioritize unique players
            const uniquePlayerCount = stats.uniquePlayers.size;
            const hoursPlayed = stats.totalPlayTime / 3600;

            // Simple trending score for display (not used for sorting)
            // Sorting is now purely based on unique players first
            const trendingScore = Math.round(uniquePlayerCount * 10 + hoursPlayed * 1 + stats.sessionCount * 0.5);

            return {
                game_slug: stats.game_slug,
                totalPlayTime: stats.totalPlayTime,
                sessionCount: stats.sessionCount,
                uniquePlayers: uniquePlayerCount,
                lastPlayedTime: stats.lastPlayedTime,
                trendingScore: trendingScore,
                players: Array.from(stats.players.values()),
            };
        })
        .filter((game) => game.uniquePlayers >= 1) // At least 1 player
        .sort((a, b) => {
            // Primary sort: unique players (descending) - MOST IMPORTANT
            if (b.uniquePlayers !== a.uniquePlayers) {
                return b.uniquePlayers - a.uniquePlayers;
            }
            // Secondary sort: total play time (descending) - only for ties
            if (b.totalPlayTime !== a.totalPlayTime) {
                return b.totalPlayTime - a.totalPlayTime;
            }
            // Tertiary sort: session count (descending) - final tie-breaker
            if (b.sessionCount !== a.sessionCount) {
                return b.sessionCount - a.sessionCount;
            }
            // Final sort: recency (more recent = higher)
            return b.lastPlayedTime.getTime() - a.lastPlayedTime.getTime();
        })
        .slice(0, 5);

    return result;
}

export const load: PageServerLoad = async ({ locals }) => {
    const user = locals.user;
    if (!user) {
        throw redirect(302, PUBLIC_SIGNIN_PATH);
    }

    // Fetch data from database
    const [userGameSessions, otherUsersSessions, roles] = await Promise.all([
        getCurrentUserSessions(user.id),
        getOtherUsersSessions(user.id),
        db.role.findMany(),
    ]);

    // Combine all sessions for trending calculation
    const allSessions = [...userGameSessions, ...otherUsersSessions];

    // Process current user's data for game summaries (personal stats)
    const validUserSessions = filterValidSessions(userGameSessions);
    const userGameSummaries = createUserGameSummaries(validUserSessions);

    // Process individual sessions for activity feed (shows each session separately)
    const currentUserActivitySessions = createCurrentUserActivitySessions(validUserSessions);
    const otherUsersActivitySessions = createOtherUsersActivitySessions(filterValidSessions(otherUsersSessions));

    // Combine all individual sessions for the activity feed
    const allActivities = combineAndSortActivitySessions(currentUserActivitySessions, otherUsersActivitySessions); // Calculate trending games
    const trendingGames = calculateTrendingGames(allSessions);

    return {
        gameSessions: userGameSessions, // Individual sessions for detailed statistics
        userGameSummaries, // Personal game statistics grouped by game
        allActivities, // Combined activity feed with individual sessions (not grouped)
        trendingGames, // Trending games based on recent activity
        roles, // User roles with decorations
    };
};
