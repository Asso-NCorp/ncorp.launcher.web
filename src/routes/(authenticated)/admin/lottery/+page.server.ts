import { db } from '$srv/db';
import type { PageServerLoad } from './$types';
import { getWinnerGifFiles } from '$lib/server/fileUtils'; // Updated import

export const load: PageServerLoad = (async () => {
    const winnerGifFiles = await getWinnerGifFiles();

    const userDisplayNames = await db.user.findMany({
        select: {
            id: true,
            name: true,
            role: true,
        },
        orderBy: {
            name: 'asc',
        },
    });

    return { userDisplayNames: userDisplayNames, winnerGifFiles };
}) satisfies PageServerLoad;