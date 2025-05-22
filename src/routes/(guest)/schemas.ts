import { z } from "zod";

export const loginFormSchema = z.object({
    username: z.string().min(2).max(50),
    password: z.string().min(8).max(50),
});

export const signupFormSchema = z.object({
    username: z.string().min(2).max(50),
    password: z.string().min(8).max(50),
    name: z.string(),
    email: z.string().email(),
});

export type LoginFormSchema = typeof loginFormSchema;
export type SignupFormSchema = typeof signupFormSchema;