import { message, setError, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { APIError } from "better-auth/api";
import { error, type Cookies } from "@sveltejs/kit";
import { logger } from "$src/lib/stores/loggerStore";
import { addGameFormSchema } from "./schemas";
import { getServerApi } from "$src/lib/utils";
import { type AddGameModel } from "$src/lib/shared-models";
import { ResponseError } from "$src/lib/api/server";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = (async ({ cookies }: { cookies: Cookies }) => {
    const token = cookies.get("token");
    if (!token) {
        throw error(401, "Unauthorized");
    }

    // Get the folder slugs which haven't got a game.ini file yet
    let folders = new Array<string>();

    try {
        folders = [];
    } catch (error) {
        logger.error(error);
    }

    return {
        form: await superValidate(zod(addGameFormSchema)),
        folders,
    };
}) satisfies PageServerLoad;

export const actions: Actions = {
    default: async (event) => {
        const formData = await event.request.formData();
        const form = await superValidate(formData, zod(addGameFormSchema));
        if (!form.valid) {
            logger.error(form.errors);
            logger.error(form.data);
            return message(form, "Invalid form");
        }

        try {
            const model: AddGameModel = {
                title: form.data.title,
                description: form.data.description,
                cover: form.data.cover,
                screenshots: form.data.screenshots,
                maxPlayers: form.data.maxPlayers,
                genres: form.data.genres,
                folderSlug: form.data.folderSlug,
                startCommand: form.data.startCommand,
                size: form.data.sizeGb,
                mainProcessName: form.data.mainProcessName,
                useNotifications: form.data.useNotifications,
                gameModes: form.data.gameModes,
                logo: form.data.logo,
                isFeatured: form.data.isFeatured,
                dateUpdated: new Date(),
                dateAdded: form.data.dateAdded,
            };

            const result = await getServerApi(event.cookies.get("token")).addGame({
                addGameModel: model,
            });

            if (!result || result.isSuccess === false) {
                logger.error(result);
                throw new Error("No response from server");
            }

            if (result.isSuccess !== true) {
                logger.error(result.message);
                return setError(form, "", result.message?.toString() ?? "Une erreur fatale est survenue 🥵");
            }
        } catch (err) {
            if (err instanceof APIError) {
                logger.error(err);
                return setError(form, "", "Une erreur fatale est survenue 🥵");
            }

            if (err instanceof ResponseError) {
                if (err.response.status === 401) {
                    logger.error(err);
                    return setError(form, "Vous n'avez pas les droits pour effectuer cette action");
                }

                // Get body
                const body = await err.response.text();
                logger.error(body);
            }

            logger.error(err);
            throw error(500, "Internal Server Error");
        }

        logger.info("Game added successfully");
        // Success
        return message(form, "Succès!");
    },
};
