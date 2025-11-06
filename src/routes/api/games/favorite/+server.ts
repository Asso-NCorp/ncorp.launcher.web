import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { db } from "$srv/db";

export const POST = async ({ request, locals }: RequestEvent) => {
    const user = locals.user;
    if (!user) {
        return json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { gameSlug, isFavorite } = body;

        if (!gameSlug || typeof isFavorite !== "boolean") {
            return json({ error: "Invalid request body" }, { status: 400 });
        }

        if (isFavorite) {
            // Add to favorites
            await db.user_game_favorite.upsert({
                where: {
                    user_id_game_slug: {
                        user_id: user.id,
                        game_slug: gameSlug,
                    },
                },
                update: {},
                create: {
                    user_id: user.id,
                    game_slug: gameSlug,
                },
            });
        } else {
            // Remove from favorites
            await db.user_game_favorite.deleteMany({
                where: {
                    user_id: user.id,
                    game_slug: gameSlug,
                },
            });
        }

        return json({ success: true });
    } catch (error) {
        console.error("Error toggling favorite:", error);
        return json({ error: "Failed to toggle favorite" }, { status: 500 });
    }
};
