import { db } from '$srv/db';
import { fail } from '@sveltejs/kit';
import { setError, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import type { Actions, PageServerLoad } from "./$types";
import { sidelinkFormSchema } from "./schema";
import { logger } from "$src/lib/stores/loggerStore";

export const load = (async () => {
    const sideLinks = await db.sidelink.findMany({
        orderBy: {
            name: "asc",
        },
    });

    return {
        sideLinks,
        addForm: await superValidate(zod4(sidelinkFormSchema)),
        editForm: await superValidate(zod4(sidelinkFormSchema)),
    };
}) satisfies PageServerLoad;

export const actions: Actions = {
    // Action for adding a new sidelink
    add: async ({ locals, request }) => {
        const formData = await request.formData();
        const form = await superValidate(formData, zod4(sidelinkFormSchema));
        if (!form.valid) {
            return fail(400, { form });
        }

        try {
            // Create new sidelink
            await db.sidelink.create({
                data: {
                    name: form.data.name,
                    url: form.data.url,
                    hidden: form.data.hidden,
                    createdBy: locals.user!.id,
                    updatedBy: locals.user!.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            });

            return { form };

        } catch (error) {
            logger.error(error);
            return setError(form, '', 'Une erreur est survenue lors de la création du lien');
        }
    },

    // Action for updating an existing sidelink
    update: async ({ locals, request }) => {
        const formData = await request.formData();
        const form = await superValidate(formData, zod4(sidelinkFormSchema));
        if (!form.valid) {
            return fail(400, { form });
        }

        console.log('form', form.data);

        try {
            // Update the sidelink
            await db.sidelink.update({
                where: {
                    id: form.data.id,
                },
                data: {
                    name: form.data.name,
                    url: form.data.url,
                    hidden: form.data.hidden,
                    updatedBy: locals.user!.id,
                    updatedAt: new Date(),
                }
            });

            return { form };

        } catch (error) {
            logger.error(error);
            return setError(form, '', 'Une erreur est survenue lors de la mise à jour du lien');
        }
    },

    // Action for deleting a sidelink
    delete: async (event) => {

        const formData = await event.request.formData();
        const id = formData.get('id');

        if (!id) {
            return fail(400, { message: 'ID is required' });
        }

        try {
            // Delete the sidelink
            await db.sidelink.delete({
                where: {
                    id: Number(id),
                }
            });

            return { success: true };

        } catch (error) {
            logger.error(error);
            return fail(500, { message: 'Une erreur est survenue lors de la suppression du lien' });
        }
    }
};