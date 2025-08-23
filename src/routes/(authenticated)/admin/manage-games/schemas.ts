import { z } from "zod";

export const addGameFormSchema = z.object({
    title: z.string().min(2).max(50),
    description: z.string().min(2),
    sizeGb: z.coerce.number().positive().default(1),
    startCommand: z.string().min(2).max(500).default("game_start.cmd"),
    isCompressed: z.boolean(),
    maxPlayers: z.number().int().min(1).max(100).optional(),
    genres: z.array(z.string()),
    cover: z.record(z.string()),
    screenshots: z.record(z.string()),
    folderSlug: z
        .string({ required_error: "Veuillez sélectionner un dossier" })
        .min(1, "Veuillez sélectionner un dossier"),
    mainProcessName: z.string().optional(),
    useNotifications: z.boolean().default(true),
    gameModes: z.array(z.string()).min(1, "Veuillez sélectionner au moins un mode de jeu"),
    logo: z.record(z.string()).optional(),
    dateUpdated: z.coerce.date().optional(),
    dateAdded: z.coerce.date().optional(),
    isFeatured: z.boolean().default(false),
});

export type AddGameFormSchema = typeof addGameFormSchema;
