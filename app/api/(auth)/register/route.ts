import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken } from "@/data/tokens";
import { ZodError } from "zod";
import { getUserByEmail } from "@/data/user";
import { sendVerificationEmail } from "@/data/mail";
import { RegisterSchema } from "@/schemas";


export async function POST(req: Request) {
    try {
        // Validación con Zod
        const { name, email, password } = RegisterSchema.parse(await req.json());

        // Hash de la contraseña
        const hashed_password = await bcrypt.hash(password, 12);

        // Verifica si existe un usuario
        const existingUser = await getUserByEmail(email);

        if (existingUser) {
            return NextResponse.json({ error: "Email already in use"}, { status: 401 });
        }

        // Crear usuario en la base de datos
        const user = await prisma.user.create({
            data: {
                name,
                email: email,
                password: hashed_password,
            },
        });

        // Generar token de verificación
        const verificationToken = await generateVerificationToken(email);

        // Implementar verificacion de email

        await sendVerificationEmail(
            verificationToken.email,
            verificationToken.token,
        );

        // Devuelve la respuesta con los datos del usuario y el token de verificación
        return NextResponse.json({
            success: "Successfully Register",
            user: {
                name: user.name,
                email: user.email,
            },
            verificationToken: verificationToken.token, // O cualquier otra información que desees devolver
        }, { status: 201 });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: "Invalid fields", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    }
}