import { auth } from "$src/lib/auth/server";
import { setError, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import type { Actions, PageServerLoad } from "./$types";
import { userFormSchema, editUserFormSchema } from "./schema";
import { APIError } from "better-auth/api";
import { fail } from "@sveltejs/kit";
import { logger } from "$src/lib/stores/loggerStore";
import { db } from "$srv/db";
import type { User } from "$src/lib/auth/client";

export const load = (async ({ request }) => {
    const usersResult = await auth.api.listUsers({
        query: {
            limit: 100,
        },
        headers: request.headers,
    });

    return {
        addForm: await superValidate(zod4(userFormSchema)),
        editForm: await superValidate(zod4(editUserFormSchema)),
        users: usersResult.users.sort((a, b) => a.name.localeCompare(b.name)),
    };
}) satisfies PageServerLoad;

export const actions: Actions = {
    // Action for adding a new user
    add: async (event) => {
        const form = await superValidate(event, zod4(userFormSchema));
        if (!form.valid) {
            return fail(400, {
                addForm: form,
            });
        }

        // Check if email already exists
        const existingUser = await db.user.findFirst({
            where: {
                email: form.data.email,
            },
        });

        if (existingUser) {
            return setError(form, "email", "Cet email est déjà utilisé");
        }

        try {
            // Create new user
            const result = await auth.api.createUser({
                body: {
                    email: form.data.email,
                    password: form.data.password || "", // Ensure password is not undefined
                    name: form.data.name,
                    role: form.data.role as "user" | "admin", // Cast to expected type
                },
                headers: event.request.headers,
            });

            await db.user.update({
                where: {
                    id: result.user.id,
                },
                data: {
                    username: form.data.username,
                },
            });

            return { form };
        } catch (error) {
            logger.error(error);
            if (error instanceof APIError) {
                if (error.body?.message) return setError(form, "", error.body.message);
                else return setError(form, "", "Une erreur est survenue lors de la création de l'utilisateur");
            }
            throw error;
        }
    },

    // Action for updating an existing user
    update: async (event) => {
        const form = await superValidate(event, zod4(editUserFormSchema));
        if (!form.valid) {
            return fail(400, {
                editForm: form,
            });
        }

        try {
            // Prepare the update data
            const updateData = {
                id: form.data.id,
                name: form.data.name,
                role: form.data.role,
                // Only include password if it's provided and not empty
                ...(form.data.password ? { password: form.data.password } : {}),
            };
            const ctx = await auth.$context;

            if (updateData.id) {
                if (updateData.password) {
                    const hash = await ctx.password.hash(updateData.password);
                    await ctx.internalAdapter.updatePassword(updateData.id, hash);
                }

                // Call the API with the correct parameters
                // Use the auth.api.updateUser method with the user ID
                await ctx.internalAdapter.updateUser(updateData.id, updateData);
            }

            return { form };
        } catch (error) {
            logger.error(error);
            if (error instanceof APIError) {
                if (error.body?.message) return setError(form, "", error.body.message);
                else return setError(form, "", "Une erreur est survenue lors de la mise à jour de l'utilisateur");
            }
            throw error;
        }
    },
};
