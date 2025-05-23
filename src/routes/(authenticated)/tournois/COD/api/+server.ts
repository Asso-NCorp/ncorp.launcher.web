import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/db'; // Assuming prisma client is here

export const GET: RequestHandler = async ({ url }) => {
    const phaseIdParam = url.searchParams.get('phase_id');

    try {
        if (phaseIdParam) {
            const phaseId = parseInt(phaseIdParam, 10);
            if (isNaN(phaseId)) {
                return json({ error: 'Invalid phase_id parameter' }, { status: 400 });
            }
            const matches = await prisma.matches.findMany({
                where: { phase_id: phaseId },
                select: {
                    match_id: true,
                    faction: true,
                    team_1: true,
                    team_2: true,
                    winner: true,
                    phase_id: true, // Included for completeness, though filtered by it
                }
            });
            return json(matches);
        } else {
            // Fetch all matches if no phase_id is provided
            const matches = await prisma.matches.findMany({
                select: { // Selecting specific fields, similar to the phase_id case
                    match_id: true,
                    faction: true,
                    team_1: true,
                    team_2: true,
                    winner: true,
                    phase_id: true,
                }
            });
            return json(matches);
        }
    } catch (error) {
        console.error('Error fetching matches:', error);
        return json({ error: 'Failed to fetch matches' }, { status: 500 });
    }
};

export const POST: RequestHandler = async ({ url }) => {
    if (url.searchParams.has('recalculate_points')) {
        try {
            await prisma.$transaction(async (tx) => {
                // Reset all team points
                await tx.equipes.updateMany({
                    data: { points: 0 },
                });

                // Get all matches
                const allMatches = await tx.matches.findMany({
                    select: {
                        team_1: true,
                        team_2: true,
                        winner: true,
                    },
                });

                for (const match of allMatches) {
                    const { team_1, team_2, winner } = match;

                    // Award points to the winner
                    if (winner) {
                        await tx.equipes.update({
                            where: { nom_equipe: winner },
                            data: { points: { increment: 3 } },
                        });
                    }

                    // Determine loser and award points
                    let loser: string | null = null;
                    if (winner && team_1 && winner === team_1) {
                        loser = team_2;
                    } else if (winner && team_2 && winner === team_2) {
                        loser = team_1;
                    }

                    if (loser) {
                        await tx.equipes.update({
                            where: { nom_equipe: loser },
                            data: { points: { increment: 1 } },
                        });
                    }
                }
            });
            return json({ success: true, message: 'Points recalculated successfully' });
        } catch (error) {
            console.error('Error recalculating points:', error);
            // Check if error is a known Prisma error type for more specific messages if needed
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            return json({ success: false, message: `Failed to recalculate points: ${errorMessage}` }, { status: 500 });
        }
    }

    return json({ error: 'Invalid request' }, { status: 400 });
};