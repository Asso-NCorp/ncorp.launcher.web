import { auth } from "$src/lib/auth/server";
import type { ServerLoad } from "@sveltejs/kit";

export const load: ServerLoad = async ({ request, params }) => {
    const session = await auth.api.getSession({
        headers: request.headers
    });


    if (!session || !session.user) {
        throw new Error("User session is invalid or not found.");
    }

    return {
        channelId: params.channelId,
        user: session.user
    };
}; 