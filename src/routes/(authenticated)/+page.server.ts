import { db } from "$srv/db";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { PUBLIC_SIGNIN_PATH, PUBLIC_MEDIAS_URL } from "$env/static/public";
import { getServerApi } from "$src/lib/utils";
import { extendGames } from "$src/lib/utils/games";

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
    game?: {
        name?: string;
        image?: string;
    };
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
        take: 500, // Increased to get more sessions for accurate statistics
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
        take: 500, // Increased to get more sessions for accurate leaderboard calculation
    });
}

/**
 * Enrich game sessions with game metadata from the server API
 */
async function enrichSessionsWithGameData(sessions: GameSession[], token: string): Promise<GameSession[]> {
    try {
        const api = getServerApi(token);
        const allGames = extendGames(await api.getAvailableGames());

        // Create a map of game_slug to game data for fast lookup
        const gameMap = new Map(
            allGames.map((g) => [
                g.folderSlug?.toLowerCase(),
                {
                    name: g.title || g.folderSlug,
                    image: `${PUBLIC_MEDIAS_URL}/games/${g.folderSlug}/poster_square.webp`,
                },
            ]),
        );

        // Enrich each session with game data
        return sessions.map((session) => ({
            ...session,
            game: gameMap.get(session.game_slug.toLowerCase()),
        }));
    } catch (error) {
        console.error("Failed to enrich sessions with game data:", error);
        // Return sessions as-is if enrichment fails
        return sessions;
    }
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

/**
 * Calculate user achievements/badges
 */
function calculateAchievements(sessions: GameSession[], allUsers: any[]) {
    const achievements = [];
    const totalSeconds = sessions.reduce((sum, s) => sum + (s.total_seconds || 0), 0);
    const totalHours = totalSeconds / 3600;
    const uniqueGames = new Set(sessions.map((s) => s.game_slug)).size;

    if (totalHours >= 100) achievements.push({ id: "100h", title: "Centième heure", icon: "🎮", color: "gold" });
    if (totalHours >= 50) achievements.push({ id: "50h", title: "50 heures", icon: "⏰", color: "silver" });
    if (totalHours >= 10) achievements.push({ id: "10h", title: "Apprenti", icon: "📚", color: "bronze" });
    if (uniqueGames >= 5) achievements.push({ id: "5games", title: "Polyglotte", icon: "🎯", color: "purple" });
    if (uniqueGames >= 10) achievements.push({ id: "10games", title: "Explorateur", icon: "🗺️", color: "cyan" });
    if (sessions.length >= 20) achievements.push({ id: "20sessions", title: "Asidu", icon: "⚡", color: "orange" });

    return achievements;
}

/**
 * Calculate current streak (consecutive days of play)
 */
function calculateStreak(sessions: GameSession[]): { current: number; longest: number } {
    if (sessions.length === 0) return { current: 0, longest: 0 };

    const sessionsByDay = new Map<string, number>();
    sessions.forEach((s) => {
        const day = new Date(s.start_time).toISOString().split("T")[0];
        sessionsByDay.set(day, (sessionsByDay.get(day) || 0) + 1);
    });

    const sortedDays = Array.from(sessionsByDay.keys()).sort().reverse();
    let current = 0;
    let longest = 0;
    let streak = 0;

    const today = new Date().toISOString().split("T")[0];
    let currentDay = today;

    for (const day of sortedDays) {
        const dayDate = new Date(day);
        const currentDate = new Date(currentDay);
        const diffDays = Math.floor((currentDate.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            streak++;
        } else if (diffDays === 1) {
            streak++;
            currentDay = day;
        } else {
            break;
        }
    }

    current = streak;
    longest = Math.max(current, sortedDays.length);

    return { current, longest };
}

/**
 * Calculate peak playing hours
 */
function calculatePeakHours(sessions: GameSession[]): Array<{ hour: number; sessions: number; minutes: string }> {
    const hourStats = new Map<number, { count: number; minutes: number }>();

    sessions.forEach((s) => {
        const hour = new Date(s.start_time).getHours();
        const current = hourStats.get(hour) || { count: 0, minutes: 0 };
        current.count += 1;
        current.minutes += Math.ceil((s.total_seconds || 0) / 60);
        hourStats.set(hour, current);
    });

    return Array.from(hourStats.entries())
        .map(([hour, data]) => ({
            hour,
            sessions: data.count,
            minutes: `${Math.round(data.minutes / 60)}h`,
        }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 5);
}

/**
 * Calculate activity heatmap data (last 12 weeks)
 */
function calculateActivityHeatmap(sessions: GameSession[]): Map<string, number> {
    const heatmap = new Map<string, number>();
    const today = new Date();

    // Initialize last 84 days (12 weeks)
    for (let i = 0; i < 84; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayKey = date.toISOString().split("T")[0];
        heatmap.set(dayKey, 0);
    }

    // Count sessions per day
    sessions.forEach((s) => {
        const dayKey = new Date(s.start_time).toISOString().split("T")[0];
        if (heatmap.has(dayKey)) {
            heatmap.set(dayKey, (heatmap.get(dayKey) || 0) + 1);
        }
    });

    return heatmap;
}

/**
 * Calculate leaderboard for the current month
 */
function calculateMonthlyLeaderboard(
    allSessions: GameSession[],
    currentUserId: string,
): { leaderboardData: any[]; userRank: number } {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filter sessions from this month and only include valid sessions (> 0 seconds)
    const monthSessions = allSessions.filter(
        (s) => new Date(s.start_time) >= firstDayOfMonth && (s.total_seconds || 0) > 0,
    );

    // Group by user and sum playtime
    const userStats = new Map<string, { totalPlayTime: number; sessionCount: number }>();

    monthSessions.forEach((session) => {
        const userId = session.user_id;
        const current = userStats.get(userId) || { totalPlayTime: 0, sessionCount: 0 };
        current.totalPlayTime += session.total_seconds || 0;
        current.sessionCount += 1;
        userStats.set(userId, current);
    });

    // Convert to leaderboard format
    const sessionsByUserId = new Map<string, GameSession[]>();
    monthSessions.forEach((session) => {
        if (!sessionsByUserId.has(session.user_id)) {
            sessionsByUserId.set(session.user_id, []);
        }
        sessionsByUserId.get(session.user_id)!.push(session);
    });

    const leaderboard = Array.from(userStats.entries())
        .map(([userId, stats]) => {
            const userSessions = sessionsByUserId.get(userId) || [];
            const userInfo = userSessions.length > 0 ? userSessions[0].user : null;

            return {
                id: userId,
                name: userInfo?.name || "Utilisateur",
                displayUsername: userInfo?.displayUsername,
                image: userInfo?.image,
                totalPlayTime: stats.totalPlayTime,
                sessionCount: stats.sessionCount,
                isCurrentUser: userId === currentUserId,
            };
        })
        .sort((a, b) => b.totalPlayTime - a.totalPlayTime)
        .slice(0, 10);

    const userRank = leaderboard.findIndex((u) => u.isCurrentUser) + 1;

    return { leaderboardData: leaderboard, userRank };
}

export const load: PageServerLoad = async ({ locals }) => {
    const user = locals.user;
    if (!user) {
        throw redirect(302, PUBLIC_SIGNIN_PATH);
    }

    // Fetch data from database
    const [userGameSessions, otherUsersSessions, roles, allUsers] = await Promise.all([
        getCurrentUserSessions(user.id),
        getOtherUsersSessions(user.id),
        db.role.findMany(),
        db.user.findMany({ select: { id: true, name: true, displayUsername: true, image: true } }),
    ]);

    // Enrich sessions with game metadata from the server API
    const enrichedUserGameSessions = await enrichSessionsWithGameData(userGameSessions, locals.token || "");
    const enrichedOtherUsersSessions = await enrichSessionsWithGameData(otherUsersSessions, locals.token || "");

    // Combine all sessions for trending calculation
    const allSessions = [...enrichedUserGameSessions, ...enrichedOtherUsersSessions];

    // Process current user's data for game summaries (personal stats)
    const validUserSessions = filterValidSessions(enrichedUserGameSessions);
    const userGameSummaries = createUserGameSummaries(validUserSessions);

    // Process individual sessions for activity feed (shows each session separately)
    const currentUserActivitySessions = createCurrentUserActivitySessions(validUserSessions);
    const otherUsersActivitySessions = createOtherUsersActivitySessions(
        filterValidSessions(enrichedOtherUsersSessions),
    );

    // Combine all individual sessions for the activity feed
    const allActivities = combineAndSortActivitySessions(currentUserActivitySessions, otherUsersActivitySessions);

    // Calculate trending games
    const trendingGames = calculateTrendingGames(allSessions);

    // Calculate additional stats
    const achievements = calculateAchievements(validUserSessions, allUsers);
    const streak = calculateStreak(validUserSessions);
    const peakHours = calculatePeakHours(validUserSessions);
    const activityHeatmap = calculateActivityHeatmap(validUserSessions);
    const favoriteGames = userGameSummaries.slice(0, 4);
    const { leaderboardData, userRank } = calculateMonthlyLeaderboard(allSessions, user.id);

    return {
        gameSessions: enrichedUserGameSessions,
        userGameSummaries,
        allActivities,
        trendingGames,
        roles,
        achievements,
        streak,
        peakHours,
        activityHeatmap: Object.fromEntries(activityHeatmap),
        favoriteGames,
        allUsers,
        leaderboardData,
        userRank,
    };
};
