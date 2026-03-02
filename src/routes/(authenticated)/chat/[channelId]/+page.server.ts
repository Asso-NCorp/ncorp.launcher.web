import { redirect } from "@sveltejs/kit";
import { PUBLIC_SIGNIN_PATH } from "$env/static/public";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
    // Session is already validated in hooks.server.ts — use locals directly
    if (!locals.user) {
        redirect(302, PUBLIC_SIGNIN_PATH);
    }

    return {
        channelId: params.channelId,
        user: locals.user,
    };
};
