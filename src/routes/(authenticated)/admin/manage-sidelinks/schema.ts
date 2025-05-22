import { z } from "zod";

export const sidelinkFormSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(2, "Le nom est requis").max(100),
    url: z.string().min(2, "L'URL est requise").max(100).url("L'URL doit être valide"),
    hidden: z.boolean(),
});

export type SidelinkFormSchema = typeof sidelinkFormSchema;
