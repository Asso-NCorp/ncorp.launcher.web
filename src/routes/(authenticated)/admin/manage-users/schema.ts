import { z } from "zod";

// Schema for adding a new user - all fields required
export const userFormSchema = z.object({
    id: z.string().optional(),
    username: z.string().min(2, "Le nom d'utilisateur est requis").max(50),
    role: z.string().min(1, "Le rôle est requis").max(50),
    email: z.string().email("L'email est requis et doit être valide"),
    name: z.string().min(2, "Le pseudo est requis").max(50),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").max(50),
});

// Schema for editing a user - password is optional
export const editUserFormSchema = z.object({
    id: z.string().optional(),
    username: z.string().min(2, "Le nom d'utilisateur est requis").max(50),
    role: z.string().min(1, "Le rôle est requis").max(50),
    email: z.string().email("L'email est requis et doit être valide"),
    name: z.string().min(2, "Le pseudo est requis").max(50),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").max(50).optional().or(z.literal("")),
});

export type UserFormSchema = typeof userFormSchema;
export type EditUserFormSchema = typeof editUserFormSchema;