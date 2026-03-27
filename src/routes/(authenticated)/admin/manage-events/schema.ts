import { z } from "zod/v4";

export const eventFormSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, "Le nom est requis").max(255),
    description: z.string().optional(),
    url: z.string().optional(),
    start_time: z.string().min(1, "La date de début est requise"),
    end_time: z.string().optional(),
    image_url: z.string().optional(),
});

export type EventFormSchema = typeof eventFormSchema;
