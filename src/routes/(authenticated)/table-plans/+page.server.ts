import type { PageServerLoad } from "./$types";
import { getEditions } from "$lib/server/table-plan";

export const load = (async ({ locals }) => {
    const editions = await getEditions();

    return {
        editions,
        user: locals.user,
    };
}) satisfies PageServerLoad;
