import * as z from "zod";

export const UpdatePlanSchema = z.object({
    name: z.optional(z.string().min(5,{
        message: "Mininum 5 characters"
    })),
    description: z.optional(z.string().min(12,{
        message: "Mininum 12 characters"
    })),
    price: z.optional(z.number().nonnegative(
        {message: "Not exist negative price plan"
    })),
    duration: z.optional(z.number().nonnegative(
        {message: "Not exist negative duration plan"
    })),
})

export const PlanSchema = z.object({
    name: z.string().min(5,{
        message: "Mininum 5 characters"
    }),
    description: z.string().min(12,{
        message: "Mininum 12 characters"
    }),
    price: z.number().nonnegative(
        {message: "Not exist negative price plan"
    }),
    duration: z.number().nonnegative(
        {message: "Not exist negative duration plan"
    }),
})

export const SettingsSchema = z.object({
    name: z.optional(z.string()),
    email: z.optional(z.string().email({
        message: "Email is required"
    })),
    image: z.optional(z.string())
});

export const ResetSchema = z.object({
    email: z.string().email({
        message: "Email is required",
    }),
});

export const NewPasswordSchema = z.object({
    password: z.string().min(6, {
        message: "Minimum 6 characters required",
    }),
});

export const LoginSchema = z.object({
    email: z.string().email({
        message: "Email is required",
    }),
    password: z.string().min(1, {
        message: "Password is required",
    }),
});

export const RegisterSchema = z.object({
    email: z.string().email({
        message: "Email is required",
    }),
    password: z.string().min(6, {
        message: "Minium 6 characters required",
    }),
    name: z.string().min(1, {
        message: "Name is required",
    }),
});