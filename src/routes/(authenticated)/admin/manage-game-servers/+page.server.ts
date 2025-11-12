import { db } from "$srv/db";
import { fail } from "@sveltejs/kit";
import { setError, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import type { Actions, PageServerLoad } from "./$types";
import { gameServerFormSchema } from "./schema";
import { logger } from "$src/lib/stores/loggerStore";
import { getServerApi } from "$src/lib/utils";

export const load = (async ({ locals }) => {
    const gameServers = await db.game_server.findMany({
        orderBy: {
            name: "asc",
        },
    });

    // Fetch available games from the API
    let games: { folder_slug: string; title: string }[] = [];
    if (locals.token) {
        try {
            const availableGames = await getServerApi(locals.token).getAvailableGames();
            games = availableGames
                .filter((g) => g.folderSlug && g.title)
                .map((g) => ({
                    folder_slug: g.folderSlug!,
                    title: g.title!,
                }))
                .sort((a, b) => a.title.localeCompare(b.title));
        } catch (error) {
            logger.error(error);
        }
    }

    return {
        gameServers,
        games,
        addForm: await superValidate(zod4(gameServerFormSchema)),
        editForm: await superValidate(zod4(gameServerFormSchema)),
    };
}) satisfies PageServerLoad;

export const actions: Actions = {
    // Action for adding a new game server
    add: async ({ locals, request }) => {
        const formData = await request.formData();
        const form = await superValidate(formData, zod4(gameServerFormSchema));
        if (!form.valid) {
            return fail(400, { form });
        }

        try {
            // Create new game server
            await db.game_server.create({
                data: {
                    game_slug: form.data.game_slug,
                    game_title: form.data.game_title,
                    type: form.data.type,
                    port: form.data.port,
                    description: form.data.description,
                    name: form.data.name,
                    monitor: form.data.monitor,
                    created_by: locals.user!.id,
                    updated_by: locals.user!.id,
                },
            });

            return { form };
        } catch (error) {
            logger.error(error);
            return setError(form, "", "Une erreur est survenue lors de la création du serveur de jeu");
        }
    },

    // Action for updating an existing game server
    update: async ({ locals, request }) => {
        const formData = await request.formData();
        const form = await superValidate(formData, zod4(gameServerFormSchema));
        if (!form.valid) {
            return fail(400, { form });
        }

        try {
            // Update the game server
            await db.game_server.update({
                where: {
                    id: form.data.id,
                },
                data: {
                    game_slug: form.data.game_slug,
                    game_title: form.data.game_title,
                    type: form.data.type,
                    port: form.data.port,
                    description: form.data.description,
                    name: form.data.name,
                    monitor: form.data.monitor,
                    updated_by: locals.user!.id,
                },
            });

            return { form };
        } catch (error) {
            logger.error(error);
            return setError(form, "", "Une erreur est survenue lors de la mise à jour du serveur de jeu");
        }
    },

    // Action for deleting a game server
    delete: async (event) => {
        const formData = await event.request.formData();
        const id = formData.get("id");

        if (!id) {
            return fail(400, { message: "ID is required" });
        }

        try {
            // Delete the game server
            await db.game_server.delete({
                where: {
                    id: Number(id),
                },
            });

            return { success: true };
        } catch (error) {
            logger.error(error);
            return fail(500, { message: "Une erreur est survenue lors de la suppression du serveur de jeu" });
        }
    },
};
