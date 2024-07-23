import { Gender, Nacionality, Payment_Type, Role } from "@prisma/client";
import * as z from "zod";

// Definición de los enums para la validación
const GenderEnum = z.enum([Gender.M, Gender.F]);
const NacionalityEnum = z.enum([Nacionality.Ecuatoriano, Nacionality.Extranjero]);
const PaymentTypeEnum = z.enum([Payment_Type.Efectivo, Payment_Type.Transferencia]);
const RoleEnum = z.enum([Role.ADMIN, Role.TRAINER, Role.CUSTOMER]);

export const RegisterSchema = z.object({
    identification: z.string().min(10, {
        message: "Identification must be at least 10 characters long",
    }).max(13, {
        message: "Identification must be at most 13 characters long",
    }).regex(/^[0-9]+$/, {
        message: "Identification must contain only numbers"
    }),
    name: z.string().min(5, {
        message: "Name is required",
    }),
    lastname: z.string().min(5, {
        message: "Lastname is required",
    }),
    email: z.string().email({
        message: "Valid email is required",
    }),
    password: z.string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" })
        .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),
    phone: z.string().min(9, {
        message: "Phone is required",
    }),
    emergency_phone: z.string().min(9, {
        message: "Emergency phone is required",
    }),
    born_date: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) {
            return new Date(arg);
        }
        return arg;
    }, z.date({
        message: "Date is required"
    })),
    direction: z.string().min(1, {
        message: "Direction is required",
    }),
    gender: GenderEnum,
    nacionality: NacionalityEnum,
});

export const updateMemberSchema = z.object({
    email: z.string().email({
        message: "Valid email is required",
    }).optional(),
    planId: z.number().optional(),
})

export const MemberSchema = z.object({
    email: z.string().email({
        message: "Valid email is required",
    }),
    planId: z.number()
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
    name: z.string().min(5, {
        message: "Name is required",
    }).optional(),
    lastname: z.string().min(5, {
        message: "Lastname is required",
    }).optional(),
    email: z.string().email({
        message: "Valid email is required",
    }).optional(),
    password: z.string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" })
        .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" })
        .optional(),
    phone: z.string().min(9, {
        message: "Phone is required",
    }).optional(),
    emergency_phone: z.string().min(9, {
        message: "Emergency phone is required",
    }).optional(),
    direction: z.string().min(1, {
        message: "Direction is required",
    }).optional(),
    image: z.string().optional(),
});

// cambiar
export const UpdateUserSchema = z.object({
    identification: z.string().min(10, {
        message: "Identification must be at least 10 characters long",
    }).max(13, {
        message: "Identification must be at most 13 characters long",
    }).regex(/^[0-9]+$/, {
        message: "Identification must contain only numbers"
    }).optional(),
    name: z.string().min(5, {
        message: "Name is required",
    }).optional(),
    lastname: z.string().min(5, {
        message: "Lastname is required",
    }).optional(),
    email: z.string().email({
        message: "Valid email is required",
    }).optional(),
    password: z.string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" })
        .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" })
        .optional(),
    phone: z.string().min(9, {
        message: "Phone is required",
    }).optional(),
    emergency_phone: z.string().min(9, {
        message: "Emergency phone is required",
    }).optional(),
    born_date: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) {
            return new Date(arg);
        }
        return arg;
    }, z.date({
        message: "Date is required"
    })).optional(),
    direction: z.string().min(1, {
        message: "Direction is required",
    }).optional(),
    gender: GenderEnum.optional(),
    nacionality: NacionalityEnum.optional(),
    role: RoleEnum.optional(),
    image: z.string().optional(),
});

export const CreateUserSchema = z.object({
    identification: z.string().min(10, {
        message: "Identification must be at least 10 characters long",
    }).max(13, {
        message: "Identification must be at most 13 characters long",
    }).regex(/^[0-9]+$/, {
        message: "Identification must contain only numbers"
    }),
    name: z.string().min(5, {
        message: "Name is required",
    }),
    lastname: z.string().min(5, {
        message: "Lastname is required",
    }),
    email: z.string().email({
        message: "Valid email is required",
    }),
    password: z.string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" })
        .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),
    phone: z.string().min(9, {
        message: "Phone is required",
    }),
    emergency_phone: z.string().min(9, {
        message: "Emergency phone is required",
    }),
    born_date: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) {
            return new Date(arg);
        }
        return arg;
    }, z.date({
        message: "Date is required"
    })),
    direction: z.string().min(1, {
        message: "Direction is required",
    }),
    gender: GenderEnum,
    nacionality: NacionalityEnum,
    role: RoleEnum,
});

export const ResetSchema = z.object({
    email: z.string().email({
        message: "Email is required",
    }),
});

export const NewPasswordSchema = z.object({
    password: z.string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" })
        .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),
});

export const LoginSchema = z.object({
    email: z.string().email({
        message: "Email is required",
    }),
    password: z.string().min(1, {
        message: "Password is required",
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
        return undefined; // Devolver undefined si no es una fecha válida
    }, z.date({
        message: "Date is required"
    }).optional()), // Hacer el campo opcional solo si es necesario
    status: z.boolean().optional(),
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
    payment_type: PaymentTypeEnum.optional(),
    pdf_url: z.string().optional(),
})