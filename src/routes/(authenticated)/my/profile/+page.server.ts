import type { Actions, PageServerLoad } from './$types';
import { auth } from '$src/lib/auth/server';
import { logger } from '$src/lib/stores/loggerStore';
import { superValidate, fail } from 'sveltekit-superforms';
import { zod4 } from "sveltekit-superforms/adapters";
import { profileFormSchema } from "./schema";

// Helper function to clean form data for serialization
function cleanFormData(form: any) {
    if (form.data) {
        form.data.avatarFile = null;
        form.data.removeAvatar = false;
    }
    return form;
}

export const load: PageServerLoad = async ({ locals }) => {
    const user = locals.user;
    // Initialize the form with current user data - don't include avatarFile in initial data
    const profileForm = await superValidate(
        {
            displayName: user?.name || "",
        },
        zod4(profileFormSchema as any),
        { allowFiles: true },
    );

    return {
        profileForm,
    };
};

export const actions: Actions = {
    updateProfile: async ({ request, locals }) => {
        logger.info("Starting profile update action");
        const formData = await request.formData();
        console.log("Received form data:", formData);
        const form = await superValidate(formData, zod4(profileFormSchema as any));

        logger.info("Form validation result:", {
            valid: form.valid,
            data: form.data,
            errors: form.errors,
        });
        if (!form.valid) {
            logger.error("Form validation failed:", form.errors);
            return fail(400, { form: cleanFormData(form) });
        }

        // Adjusted destructuring to include removeAvatar
        // Ensure profileFormSchema is updated to include `removeAvatar: z.boolean().optional()`
        const { displayName, avatarFile, removeAvatar } = form.data as {
            displayName: string;
            avatarFile?: File;
            removeAvatar?: boolean;
        };

        logger.info("Extracted form data:", {
            displayName,
            avatarFileSize: avatarFile?.size,
            avatarFileName: avatarFile?.name,
            removeAvatar,
        });
        const session = locals.session;
        if (!session || !locals.user) {
            logger.error("Unauthorized access attempt");
            return fail(401, { form: cleanFormData(form) });
        }

        const userId = locals.user.id;

        let avatarUrl = locals.user.image; // Default to current image

        if (removeAvatar) {
            logger.info(`User ${userId} requested avatar removal.`);
            if (locals.user.image) {
                // Only attempt removal if an image is currently set
                const pathModule = await import("path");
                const imagesPath = pathModule.resolve(process.env.PRIVATE_RESOURCES_PATH!);
                const avatarDir = pathModule.join(imagesPath, "avatars");
                const fs = await import("fs/promises");

                try {
                    await fs.mkdir(avatarDir, { recursive: true }); // Ensure directory exists
                    const filesInDir = await fs.readdir(avatarDir);
                    const userAvatarFiles = filesInDir.filter((f) => f.startsWith(`${userId}.`));

                    if (userAvatarFiles.length > 0) {
                        for (const oldFile of userAvatarFiles) {
                            const oldFilePath = pathModule.join(avatarDir, oldFile);
                            await fs.unlink(oldFilePath);
                            logger.info(
                                `Deleted avatar file ${oldFilePath} for user ${userId} due to removal request.`,
                            );
                        }
                        avatarUrl = null; // Set avatarUrl to null after successful deletion
                    } else {
                        logger.info(`No avatar files found for user ${userId} to remove, setting avatarUrl to null.`);
                        avatarUrl = null; // Ensure avatarUrl is null if no files were present
                    }
                } catch (cleanupError) {
                    logger.warn(
                        `Failed to delete avatar files for user ${userId} during removal request:`,
                        cleanupError,
                    );
                    // Set avatarUrl to null to reflect user's intent, even if file deletion failed.
                    avatarUrl = null;
                }
            } else {
                logger.info(
                    `User ${userId} requested avatar removal, but no avatar was set. Setting avatarUrl to null.`,
                );
                avatarUrl = null; // No current image, ensure avatarUrl is null
            }
        } else if (avatarFile && (avatarFile as File).size > 0) {
            const file = avatarFile as File;
            logger.info("Processing avatar upload:", { fileName: file.name, size: file.size });

            // Save avatar to PRIVATE_RESOURCES_PATH/avatars/{userId}.{ext}
            const ext = file.name.split(".").pop() || "png";
            const fileName = `${userId}.${ext}`;
            const pathModule = await import("path");
            const imagesPath = pathModule.resolve(process.env.PRIVATE_RESOURCES_PATH!);
            const avatarDir = pathModule.join(imagesPath, "avatars");
            const filePath = pathModule.join(avatarDir, fileName);
            const publicUrl = `/api/avatars/${userId}`;

            // Clean up old avatar files for this user (different extensions)
            const fs = await import("fs/promises");
            await fs.mkdir(avatarDir, { recursive: true });

            try {
                const files = await fs.readdir(avatarDir);
                const userAvatarFiles = files.filter((file) => file.startsWith(`${userId}.`));
                for (const oldFile of userAvatarFiles) {
                    const oldFilePath = pathModule.join(avatarDir, oldFile);
                    await fs.unlink(oldFilePath);
                    logger.info(`Deleted old avatar: ${oldFilePath}`);
                }
            } catch (cleanupError) {
                logger.warn("Failed to cleanup old avatars:", cleanupError);
            }

            // Read file buffer and save new avatar
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            await fs.writeFile(filePath, buffer);
            avatarUrl = publicUrl;
            logger.info(`Avatar saved to ${filePath}`);
        }

        try {
            logger.info("Attempting to update user:", { userId, displayName, avatarUrl });

            // Use the internal adapter like in the admin manage users code
            const ctx = await auth.$context;
            const updatedUser = await ctx.internalAdapter.updateUser(userId, {
                name: displayName as string,
                image: avatarUrl, // This will be the new URL, null, or the existing URL
            });
            logger.info("Update user response:", updatedUser);
            if (updatedUser) {
                // Important: Update the user data in the session/locals
                locals.user = { ...locals.user, name: updatedUser.name, image: updatedUser.image };
                logger.info("Profile updated successfully");

                // Try returning the form directly without message wrapper
                return { form: cleanFormData(form) };
            }
            logger.error("Update user response was invalid:", updatedUser);
            return fail(500, { form: cleanFormData(form) });
        } catch (error) {
            logger.error("Error updating profile:", error);
            return fail(500, { form: cleanFormData(form) });
        }
    },
};
