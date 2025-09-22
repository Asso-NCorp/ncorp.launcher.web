import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getServerApi } from '$src/lib/utils';
import { extendGames } from "$src/lib/utils/games";

export const load = (async ({ params, cookies }) => {
    const { gameSlug } = params;

    if (!gameSlug) {
        return error(404, "Game not found");
    }

    const token = cookies.get("token");
    if (!token) {
        return error(401, "Unauthorized: No token provided");
    }

    const games = extendGames(await getServerApi(token).getAvailableGames());
    const game = games.find((g) => g.folderSlug?.toLowerCase() === gameSlug.toLocaleLowerCase());
    if (!game) {
        return error(404, "Game not found");
    }

    return { game };
}) satisfies PageServerLoad;