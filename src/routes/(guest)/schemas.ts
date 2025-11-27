import { z } from "zod/v4";

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

export const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

export const resetPasswordSchema = z.object({
    password: z.string().min(8).max(50),
    confirmPassword: z.string().min(8).max(50),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type LoginFormSchema = typeof loginFormSchema;
export type SignupFormSchema = typeof signupFormSchema;
export type ForgotPasswordSchema = typeof forgotPasswordSchema;
export type ResetPasswordSchema = typeof resetPasswordSchema;
