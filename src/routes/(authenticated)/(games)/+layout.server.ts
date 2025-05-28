import type { LayoutServerLoad } from './$types';
import { db } from '$src/server/db';

export const load: LayoutServerLoad = async ({ locals }) => {
    const user = locals.user;

    if (!user) {
        return {
            recentGames: []
        };
    }

    // Get user's last 3 played games sorted by lastPlayedTime
    const userGameSessions = await db.$queryRaw<Array<{
        id: number;
        game_slug: string;
        start_time: Date;
        end_time: Date | null;
        total_seconds: number | null;
    }>>`
        SELECT 
            gs.id,
            gs.game_slug,
            gs.start_time,
            gs.end_time,
            gs.total_seconds
        FROM game_session gs
        WHERE gs.user_id = ${user.id}
        AND gs.total_seconds > 0
        ORDER BY gs.start_time DESC
    `;

    // Group by game_slug and get the 3 most recently played games
    const gameMap = new Map();

    for (const session of userGameSessions) {
        if (!gameMap.has(session.game_slug)) {
            gameMap.set(session.game_slug, {
                game_slug: session.game_slug,
                lastPlayedTime: session.start_time,
                totalPlayTime: session.total_seconds || 0
            });
        } else {
            const existing = gameMap.get(session.game_slug);
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
