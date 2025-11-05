import type { PageServerLoad } from "./$types";
import { getEditions } from "$lib/server/table-plan";

export const load = (async () => {
    const editions = await getEditions();

    return {
        editions,
    };
}) satisfies PageServerLoad;
