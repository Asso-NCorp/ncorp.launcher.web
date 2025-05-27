import { db } from "$srv/db";
import type { PageServerLoad } from "./$types";
import type { user as UserType } from '@prisma/client'; // Import User type

export const load: PageServerLoad = async ({ locals }) => {
    const user = locals.user;

    // Récupérer les sessions de jeu de l'utilisateur actuel
    const userGameSessions = await db.game_session.findMany({
        where: {
            user_id: user!.id,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    displayUsername: true,
                    image: true,
                }
            }
        },
        orderBy: { start_time: 'desc' },
        take: 10,
    });    // Récupérer les sessions des autres utilisateurs (max 3 par utilisateur)
    const otherUsersActivities = await db.$queryRaw<Array<{
        id: string;
        user_id: string;
        game_slug: string;
        start_time: Date;
        end_time: Date | null;
        total_seconds: number;
        name: string;
        displayUsername: string;
        image: string | null;
    }>>`
        SELECT
            gs.id,
            gs.game_slug,
            gs.start_time,
            gs.end_time,
            gs.total_seconds,
            u.id AS user_id,
            u.name,
            u.displayUsername,
            u.image
        FROM
            user u
        INNER JOIN
            game_session gs ON gs.user_id = u.id
        LEFT JOIN
            game_session gs_check ON gs.user_id = gs_check.user_id AND gs.start_time < gs_check.start_time
        WHERE
            u.id != ${user!.id}
        GROUP BY
            gs.id, gs.game_slug, gs.start_time, gs.end_time, gs.total_seconds,
            u.id, u.name, u.displayUsername, u.image
        HAVING
            COUNT(gs_check.id) < 3
        ORDER BY
            gs.start_time DESC
        LIMIT 20
    `;

    // Filtrer les sessions de l'utilisateur actuel avec total_seconds > 0
    const validUserGameSessions = userGameSessions.filter(session => (session.total_seconds || 0) > 0);

    // Grouper les sessions de l'utilisateur par jeu et calculer le temps total et le nombre de sessions
    const userGameSummaries = Array.from(
        validUserGameSessions.reduce((acc, session) => {
            const gameSlug = session.game_slug;
            let gameSummary = acc.get(gameSlug);
            if (!gameSummary) {
                gameSummary = {
                    game_slug: gameSlug,
                    totalPlayTime: 0,
                    sessionCount: 0,
                    user: session.user as UserType, // User details for current user
                    lastPlayedTime: session.start_time, // Initialize with first session's time
                };
                acc.set(gameSlug, gameSummary);
            }
            gameSummary.totalPlayTime += (session.total_seconds || 0);
            gameSummary.sessionCount += 1;
            if (session.start_time > gameSummary.lastPlayedTime) {
                gameSummary.lastPlayedTime = session.start_time;
            }
            return acc;
        }, new Map<string, { game_slug: string; totalPlayTime: number; sessionCount: number; user: UserType; lastPlayedTime: Date }>())
            .values()
    ).sort((a, b) => b.totalPlayTime - a.totalPlayTime); // Trier par temps de jeu décroissant pour les stats personnelles

    // Préparer les résumés de l'utilisateur actuel pour allActivities
    const currentUserActivitySummaries = userGameSummaries
        .map(summary => ({
            ...summary,
            isCurrentUser: true,
        }))
        .filter(summary => summary.totalPlayTime >= 60); // MODIFIED: Ensure at least 1 minute of playtime

    // Traiter les activités des autres utilisateurs pour les résumer par utilisateur et par jeu
    const filteredOtherUsersActivities = otherUsersActivities
        .filter(session => (session.total_seconds || 0) > 0);

    const otherUsersActivitySummaries = Array.from(
        filteredOtherUsersActivities.reduce((acc, session) => {
            const key = `${session.user_id}-${session.game_slug}`;
            let entry = acc.get(key);
            if (!entry) {
                entry = {
                    user: {
                        id: session.user_id,
                        name: session.name,
                        displayUsername: session.displayUsername,
                        image: session.image,
                    },
                    game_slug: session.game_slug,
                    totalPlayTime: 0,
                    sessionCount: 0,
                    isCurrentUser: false,
                    lastPlayedTime: session.start_time,
                };
                acc.set(key, entry);
            }
            entry.totalPlayTime += (session.total_seconds || 0);
            entry.sessionCount += 1;
            if (session.start_time > entry.lastPlayedTime) {
                entry.lastPlayedTime = session.start_time;
            }
            return acc;
        }, new Map<string, {
            user: { id: string; name: string; displayUsername: string; image: string | null };
            game_slug: string;
            totalPlayTime: number;
            sessionCount: number;
            isCurrentUser: boolean;
            lastPlayedTime: Date;
        }>()).values()
    )
        .filter(summary => summary.totalPlayTime >= 60); // MODIFIED: Ensure at least 1 minute of playtime

    // Combiner et trier tous les résumés d'activité
    const allActivities = [...currentUserActivitySummaries, ...otherUsersActivitySummaries]
        .sort((a, b) => b.lastPlayedTime.getTime() - a.lastPlayedTime.getTime());

    return {
        gameSessions: userGameSessions, // Conserver pour les statistiques qui nécessitent des sessions individuelles (ex: sessions cette semaine)
        userGameSummaries, // Pour les statistiques personnelles groupées par jeu
        allActivities: allActivities.slice(0, 30) // Flux d'activité principal avec résumés par utilisateur/jeu
    };
};
