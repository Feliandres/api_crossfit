import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserByEmail} from "@/data/user";
import { Role } from "@prisma/client";
import { generateVerificationToken } from "@/data/tokens";
import { sendVerificationEmail } from "@/data/mail";
import bcrypt from "bcryptjs";
import { CreateUserSchema, RegisterSchema } from "@/schemas";
import { ZodError } from "zod";
import { getUserSession } from "@/data/session";

export async function GET(req: Request) {
    try {
        // Verifica la sesion y token de usuario y trae los datos del usuario
        const { user, error, status } = await getUserSession(req);

        if (error) {
            return NextResponse.json({ error }, { status });
        }

        // Obtener Id del usuario
        const userId = user?.id;

        // verificar el rol del usuario para acceder a la ruta
        if (!user || user.role !== Role.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Obtener los parámetros de búsqueda de la URL
        const url = new URL(req.url);
        const skip = parseInt(url.searchParams.get("skip") || "0", 10);
        const take = parseInt(url.searchParams.get("take") || "10", 10);

        // Retorna todos los usuarios de la base de datos con o sin paginación
        const users = await prisma.user.findMany({
            where: {
                id: {
                    not: userId
                }
            }
        });


        return NextResponse.json({
            success: "Return users successfully",
            user: {
                ...users
            },
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: "Unexpected error"}, { status: 500 });
    }
}

//

export async function POST(req: Request) {
    try {
        // Verifica la sesion y token de usuario y trae los datos del usuario
        const { user, error, status } = await getUserSession(req);

        if (error) {
            return NextResponse.json({ error }, { status });
        }

        // Obtener Id del usuario
        const userId = user?.id;

        // verificar el rol del usuario para acceder a la ruta
        if (!user || user.role !== Role.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Validación con Zod
        const validatedFields = CreateUserSchema.parse(await req.json());

        const { email, password, ...userData} = validatedFields

        // Valida que la cedula no exista
        const existingIdentification = await prisma.user.findUnique({
            where: {
                identification: validatedFields.identification
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

        // Hash de la contraseña
        const hashed_password = await bcrypt.hash(password, 12);

        // Verifica si existe un usuario
        const existingUser = await getUserByEmail(email);

        if (existingUser) {
            return NextResponse.json({ error: "Email already in use"}, { status: 401 });
        }

        // Crear usuario en la base de datos
        const createdUser = await prisma.user.create({
            data: {
                email: email,
                password: hashed_password,
                identification: userData.identification,
                name: userData.name,
                lastname: userData.lastname,
                bornDate: userData.bornDate,
                phone: userData.phone,
                emergencyPhone: userData.emergencyPhone,
                direction: userData.direction,
                gender: userData.gender,
                nacionality: userData.nacionality,
                role: userData.role
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
            success: "Create User Successfully",
            user: {
                name: createdUser.name,
                email: createdUser.email,
            },
            verificationToken: verificationToken.token, // O cualquier otra información que desees devolver
        }, { status: 201 });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: "Invalid fields", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Unexpected error"}, { status: 500 });
    }
}