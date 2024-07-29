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
        const validatedFields = RegisterSchema.parse(await req.json());

        const { identification, email, password, ...userData } = validatedFields;

        // Valida que la cedula no exista
        const existingIdentification = await prisma.user.findUnique({
            where: {
                identification: identification
            }
        })

        if (existingIdentification) {
            return NextResponse.json({ error: "Identification already in use" }, { status: 401 });
        }

        // Validar que el usuario tenga al menos 15 años
        const parsedBornDate = new Date(validatedFields.bornDate);
        const today = new Date();
        const age = today.getFullYear() - parsedBornDate.getFullYear();
        const monthDifference = today.getMonth() - parsedBornDate.getMonth();
        const dayDifference = today.getDate() - parsedBornDate.getDate();

        if (
            age < 15 ||
            (age === 15 && monthDifference < 0) ||
            (age === 15 && monthDifference === 0 && dayDifference < 0)
        ) {
            return NextResponse.json({ error: "User must be at least 15 years old" }, { status: 400 });
        }

        // Verificar si el email ya está en uso
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return NextResponse.json({ error: "Email already in use" }, { status: 401 });
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear el usuario
        const user = await prisma.user.create({
            data: {
                email: email,
                password: hashedPassword,
                identification: identification,
                name: userData.name,
                lastname: userData.lastname,
                bornDate: userData.bornDate,
                phone: userData.phone,
                emergencyPhone: userData.emergencyPhone,
                direction: userData.direction,
                gender: userData.gender,
                nacionality: userData.nacionality
                // Asegúrate de que todos los campos necesarios se están manejando correctamente
                // Incluye solo los campos que están definidos en el modelo User
            },
        });

        // Generar token de verificación
        const verificationToken = await generateVerificationToken(email);

        // Implementar verificación de email
        await sendVerificationEmail(
            verificationToken.email,
            verificationToken.token,
        );

        // Devuelve la respuesta con los datos del usuario y el token de verificación
        return NextResponse.json({
            success: "Successfully Registered",
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
