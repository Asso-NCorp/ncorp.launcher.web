import { type Handle } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { auth } from "./lib/auth/server";
import { db } from "$srv/db";

export const handle: Handle = async ({ event, resolve }) => {
    try {
        // Get session from auth
        const session = await auth.api.getSession({
            headers: event.request.headers,
        });

        // Set session and user to locals 
        event.locals.session = session?.session;
        event.locals.user = session?.user;


        if (event.locals.user) {
            const localGamesDir = await db.user_settings.findFirst({
                where: {
                    user_id: event.locals.user.id,
                },

            })


            if (localGamesDir) {
                event.locals.localGamesDir = localGamesDir.local_games_dir;
            }
        }

    } catch (error) {
        console.error("Error getting session", error);
        event.locals.session = undefined;
        event.locals.user = undefined;
    }

    return svelteKitHandler({
        auth,
        event,
        resolve,
    });
}