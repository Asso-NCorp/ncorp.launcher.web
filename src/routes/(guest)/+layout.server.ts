import { db } from '$srv/db';
import type { LayoutServerLoad } from './$types';

export const load = (async () => {

    const nicknames = await db.user.findMany({
        select: {
            name: true
        }
    })

    return {
        nicknames: nicknames.map(({ name }) => name)
    };
}) satisfies LayoutServerLoad;