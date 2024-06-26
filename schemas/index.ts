import { Gender, Nacionality, Payment_Type, Role } from "@prisma/client";
import * as z from "zod";

// Definición de los enums para la validación
const GenderEnum = z.enum([Gender.M, Gender.F]);
const NacionalityEnum = z.enum([Nacionality.Ecuatoriano, Nacionality.Extranjero]);
const PaymentTypeEnum = z.enum([Payment_Type.Efectivo, Payment_Type.Tarjeta, Payment_Type.Transferencia]);
const RoleEnum = z.enum([Role.ADMIN, Role.TRAINER, Role.USER]);

export const updateMemberSchema = z.object({
    identification: z.string().min(10,{
        message: "Mininum 10 characters"
    }).max(12,{
        message: "Maximum 12 characters"
    }).optional(),
    name: z.string().min(4,{
        message: "Mininum 4 characters"
    }).optional(),
    lastname: z.string().min(4,{
        message: "Mininum 4 characters"
    }).optional(),
    email: z.string().email({
        message: "Email is required",
    }).optional(),
    phone: z.string().min(10, {
        message: "Minimum 10 characters"
    }).regex(/^[0-9]+$/, {
        message: "Phone must contain only numbers"
    }).optional(),
    emergency_phone: z.string().min(7, {
        message: "Minimum 7 characters"
    }).regex(/^[0-9]+$/, {
        message: "Emergency phone must contain only numbers"
    }).optional(),
    born_date: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) {
            return new Date(arg);
        }
        return arg;
    }, z.date({
        message: "Date is required"
    })).optional(),
    direction: z.string().min(12,{
        message: "Mininum 12 characters"
    }).optional(),
    gender: GenderEnum.optional(),
    nacionality: NacionalityEnum.optional(),
    planId: z.number().optional(),
    status: z.boolean().refine((val) => val === true, {
        message: "Status can only be set to true"
    }).optional(),
})

export const MemberSchema = z.object({
    identification: z.string().min(10,{
        message: "Mininum 10 characters"
    }).max(12,{
        message: "Maximum 12 characters"
    }),
    name: z.string().min(4,{
        message: "Mininum 4 characters"
    }),
    lastname: z.string().min(4,{
        message: "Mininum 4 characters"
    }),
    email: z.string().email({
        message: "Email is required",
    }),
    phone: z.string().min(10, {
        message: "Minimum 10 characters"
    }).regex(/^[0-9]+$/, {
        message: "Phone must contain only numbers"
    }),
    emergency_phone: z.string().min(7, {
        message: "Minimum 7 characters"
    }).regex(/^[0-9]+$/, {
        message: "Emergency phone must contain only numbers"
    }),
    born_date: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) {
            return new Date(arg);
        }
        return arg;
    }, z.date({
        message: "Date is required"
    })),
    direction: z.string().min(12,{
        message: "Mininum 12 characters"
    }),
    gender: GenderEnum,
    nacionality: NacionalityEnum,
    planId: z.number().optional()
})

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
    image: z.optional(z.string()),
});

export const UpdateUserSchema = z.object({
    name: z.optional(z.string()),
    email: z.optional(z.string().email({
        message: "Email is required"
    })),
    image: z.optional(z.string()),
    status: z.boolean().refine((val) => val === true, {
        message: "Status can only be set to true"
    }).optional(),
    role: RoleEnum.optional(),
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

export const AttendanceSchema = z.object({
    date: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) {
            return new Date(arg);
        }
        return arg;
    }, z.date({
        message: "Date is required"
    })),
})

export const UpdateAttendanceSchema = z.object({
    date: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) {
            return new Date(arg);
        }
        return arg;
    }, z.date({
        message: "Date is required"
    })).optional(),
    status: z.boolean().refine((val) => val === true, {
        message: "Status can only be set to true"
    }).optional(),
})

export const PaySchema = z.object({
    date: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) {
            return new Date(arg);
        }
        return arg;
    }, z.date({
        message: "Date is required"
    })),
    payment_type: PaymentTypeEnum,
})

export const UpdatePaySchema = z.object({
    date: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) {
            return new Date(arg);
        }
        return arg;
    }, z.date({
        message: "Date is required"
    })).optional(),
    status: z.boolean().refine((val) => val === true, {
        message: "Status can only be set to true"
    }).optional(),
    payment_type: PaymentTypeEnum.optional(),
})