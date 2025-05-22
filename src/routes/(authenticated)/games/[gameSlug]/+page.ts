import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
    const { gameSlug } = params;

    if (!gameSlug) {
        return error(404, 'Game not found');
    }

    return { gameSlug };
}) satisfies PageLoad;