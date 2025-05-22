import { db } from '$srv/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = (async () => {

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


    return { userDisplayNames: userDisplayNames };
}) satisfies PageServerLoad;