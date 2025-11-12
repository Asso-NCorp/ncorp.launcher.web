import { z } from "zod/v4";

export const gameServerFormSchema = z.object({
    id: z.number().optional(),
    game_slug: z.string().min(1, "Le slug du jeu est requis").max(100),
    game_title: z.string().min(2, "Le titre du jeu est requis").max(255),
    type: z.enum(["tcp", "udp"], { message: "Le type doit être TCP ou UDP" }),
    port: z.number().int().min(1, "Le port doit être supérieur à 0").max(65535, "Le port doit être inférieur à 65536"),
    description: z.string().max(1000).optional(),
    name: z.string().min(2, "Le nom est requis").max(255),
    monitor: z.boolean().default(false),
});

export type GameServerFormSchema = typeof gameServerFormSchema;
