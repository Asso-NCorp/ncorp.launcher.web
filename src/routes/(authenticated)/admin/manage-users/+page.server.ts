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

    // Fetch additional user data from database (approvalStatus)
    const usersWithApproval = await Promise.all(
        usersResult.users.map(async (user) => {
            const dbUser = await db.user.findUnique({
                where: { id: user.id },
                select: {
                    approvalStatus: true,
                    approvedBy: true,
                    approvedAt: true,
                    rejectedBy: true,
                    rejectedAt: true,
                },
            });

            // Fetch admin names if approval/rejection info exists
            let approvedByName: string | undefined;
            let rejectedByName: string | undefined;

            if (dbUser?.approvedBy) {
                const approver = await db.user.findUnique({
                    where: { id: dbUser.approvedBy },
                    select: { name: true, username: true },
                });
                approvedByName = approver?.name || approver?.username || undefined;
            }

            if (dbUser?.rejectedBy) {
                const rejecter = await db.user.findUnique({
                    where: { id: dbUser.rejectedBy },
                    select: { name: true, username: true },
                });
                rejectedByName = rejecter?.name || rejecter?.username || undefined;
            }

            return {
                ...user,
                approvalStatus: dbUser?.approvalStatus || "approved",
                approvedBy: dbUser?.approvedBy,
                approvedAt: dbUser?.approvedAt,
                rejectedBy: dbUser?.rejectedBy,
                rejectedAt: dbUser?.rejectedAt,
                approvedByName,
                rejectedByName,
            };
        }),
    );

    // Fetch roles for avatar decorations
    const roles = await db.role.findMany();

    return {
        addForm: await superValidate(zod4(userFormSchema)),
        editForm: await superValidate(zod4(editUserFormSchema)),
        users: usersWithApproval.sort((a, b) => a.name.localeCompare(b.name)),
        roles,
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
            // Prepare the update data for Better Auth
            const authUpdateData = {
                name: form.data.name,
                role: form.data.role,
            };

            // Prepare Prisma update data for approval tracking
            const prismaUpdateData: Record<string, any> = {
                name: form.data.name,
                role: form.data.role,
            };

            // Handle approval status and tracking fields
            if (form.data.approvalStatus) {
                const currentUser = await db.user.findUnique({
                    where: { id: form.data.id },
                    select: { approvalStatus: true },
                });

                if (currentUser?.approvalStatus !== form.data.approvalStatus) {
                    // Status is changing
                    prismaUpdateData["approvalStatus"] = form.data.approvalStatus;

                    if (form.data.approvalStatus === "rejected") {
                        // Setting to rejected
                        prismaUpdateData["rejectedBy"] = event.locals.user.id;
                        prismaUpdateData["rejectedAt"] = new Date();
                        prismaUpdateData["approvedBy"] = null;
                        prismaUpdateData["approvedAt"] = null;
                    } else if (form.data.approvalStatus === "approved") {
                        // Setting to approved, clear rejection info
                        prismaUpdateData["approvedBy"] = event.locals.user.id;
                        prismaUpdateData["approvedAt"] = new Date();
                        prismaUpdateData["rejectedBy"] = null;
                        prismaUpdateData["rejectedAt"] = null;
                    } else if (form.data.approvalStatus === "pending") {
                        // Setting to pending, clear all tracking
                        prismaUpdateData["approvedBy"] = null;
                        prismaUpdateData["approvedAt"] = null;
                        prismaUpdateData["rejectedBy"] = null;
                        prismaUpdateData["rejectedAt"] = null;
                    }
                }
            }

            const ctx = await auth.$context;

            if (form.data.id) {
                if (form.data.password) {
                    const hash = await ctx.password.hash(form.data.password);
                    await ctx.internalAdapter.updatePassword(form.data.id, hash);
                }

                // Update user via Better Auth
                await ctx.internalAdapter.updateUser(form.data.id, authUpdateData);

                // Update approval tracking via Prisma (which Better Auth doesn't handle)
                await db.user.update({
                    where: { id: form.data.id },
                    data: prismaUpdateData,
                });
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
