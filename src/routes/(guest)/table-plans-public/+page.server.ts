import { getEditions } from "$lib/server/table-plan";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
    const editions = await getEditions();

    return {
        editions,
        user: null, // No user in guest mode
    };
}) satisfies PageServerLoad;
