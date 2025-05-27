import { z } from "zod";

export const profileFormSchema = z.object({
    displayName: z.string()
        .min(2, "Le nom d'affichage doit contenir au moins 2 caractères")
        .max(50, "Le nom d'affichage ne peut pas dépasser 50 caractères")
        .regex(/^[a-zA-Z0-9_-]+$/, "Le nom d'affichage ne peut contenir que des lettres, chiffres, tirets (-) et underscores (_)"), avatarFile: z.instanceof(File).nullable().optional()
            .refine(file => !file || file.size <= 5 * 1024 * 1024, "Le fichier de l'avatar ne doit pas dépasser 5 Mo")
            .refine(file => !file || file.type.startsWith("image/"), "Le fichier de l'avatar doit être une image")
            .refine(file => !file || file.type !== "image/gif", "Les fichiers GIF ne sont pas autorisés pour l'avatar")
            .refine(file => !file || file.type !== "image/jfif", "Les fichiers JFIF ne sont pas autorisés pour l'avatar"),
    removeAvatar: z.boolean().optional().default(false)
});

export type ProfileFormSchema = typeof profileFormSchema;
