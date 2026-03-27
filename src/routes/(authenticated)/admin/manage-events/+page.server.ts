import { db } from "$srv/db";
import { fail } from "@sveltejs/kit";
import { setError, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import type { Actions, PageServerLoad } from "./$types";
import { eventFormSchema } from "./schema";
import { logger } from "$src/lib/stores/loggerStore";

export const load = (async () => {
    const events = await db.event.findMany({
        orderBy: { start_time: "asc" },
        include: { creator: { select: { name: true } }, updater: { select: { name: true } } },
    });

    return {
        events,
        addForm: await superValidate(zod4(eventFormSchema)),
        editForm: await superValidate(zod4(eventFormSchema)),
    };
}) satisfies PageServerLoad;

export const actions: Actions = {
    add: async ({ locals, request }) => {
        const formData = await request.formData();
        const form = await superValidate(formData, zod4(eventFormSchema));
        if (!form.valid) {
            return fail(400, { form });
        }

        try {
            await db.event.create({
                data: {
                    name: form.data.name,
                    description: form.data.description || null,
                    url: form.data.url || null,
                    start_time: new Date(form.data.start_time),
                    end_time: form.data.end_time ? new Date(form.data.end_time) : null,
                    image_url: form.data.image_url || null,
                    creator: { connect: { id: locals.user!.id } },
                    updater: { connect: { id: locals.user!.id } },
                },
            });

            return { form };
        } catch (error) {
            logger.error(error);
            return setError(form, "", "Une erreur est survenue lors de la création de l'événement");
        }
    },

    update: async ({ locals, request }) => {
        const formData = await request.formData();
        const form = await superValidate(formData, zod4(eventFormSchema));
        if (!form.valid) {
            return fail(400, { form });
        }

        try {
            await db.event.update({
                where: { id: form.data.id },
                data: {
                    name: form.data.name,
                    description: form.data.description || null,
                    url: form.data.url || null,
                    start_time: new Date(form.data.start_time),
                    end_time: form.data.end_time ? new Date(form.data.end_time) : null,
                    image_url: form.data.image_url || null,
                    updater: { connect: { id: locals.user!.id } },
                },
            });

            return { form };
        } catch (error) {
            logger.error(error);
            return setError(form, "", "Une erreur est survenue lors de la mise à jour de l'événement");
        }
    },

    delete: async (event) => {
        const formData = await event.request.formData();
        const id = formData.get("id");

        if (!id || typeof id !== "string") {
            return fail(400, { message: "ID is required" });
        }

        try {
            await db.event.delete({ where: { id } });
            return { success: true };
        } catch (error) {
            logger.error(error);
            return fail(500, { message: "Une erreur est survenue lors de la suppression de l'événement" });
        }
    },
};
