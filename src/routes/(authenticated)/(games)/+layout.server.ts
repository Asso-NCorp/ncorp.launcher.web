import type { LayoutServerLoad } from './$types';
import { db } from '$src/server/db';

export const load: LayoutServerLoad = async ({ locals }) => {
    const user = locals.user;

    if (!user) {
        return {
            recentGames: []
        };
    }

    // Get user's game sessions with valid playtime, ordered by start time
    const userGameSessions = await db.game_session.findMany({
        where: {
            user_id: user.id,
            total_seconds: {
                gt: 60 // Only consider sessions with more than 1 minute of playtime
            }
        },
        orderBy: {
            start_time: 'desc'
        },
        select: {
            game_slug: true,
            start_time: true,
            total_seconds: true
        }
    });

    // Group by game_slug and get the 3 most recently played games
    const gameMap = new Map<string, {
        game_slug: string;
        lastPlayedTime: Date;
        totalPlayTime: number;
    }>();

    for (const session of userGameSessions) {
        if (!gameMap.has(session.game_slug)) {
            gameMap.set(session.game_slug, {
                game_slug: session.game_slug,
                lastPlayedTime: session.start_time,
                totalPlayTime: session.total_seconds || 0
            });
        } else {
            const existing = gameMap.get(session.game_slug)!;
            existing.totalPlayTime += session.total_seconds || 0;
            if (session.start_time > existing.lastPlayedTime) {
                existing.lastPlayedTime = session.start_time;
            }
        }
    }

    // Convert to array, sort by lastPlayedTime, and take top 3
    const recentGames = Array.from(gameMap.values())
        .sort((a, b) => b.lastPlayedTime.getTime() - a.lastPlayedTime.getTime())
        .slice(0, 3);

    return {
        recentGames
    };
};
