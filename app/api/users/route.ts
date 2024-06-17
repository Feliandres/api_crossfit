import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verify } from 'jsonwebtoken';
import { getUserByEmail, getUserById } from "@/data/user";
import { Role } from "@prisma/client";
import { generateVerificationToken } from "@/data/tokens";
import { sendVerificationEmail } from "@/data/mail";
import bcrypt from "bcryptjs";
import { RegisterSchema } from "@/schemas";
import { ZodError } from "zod";

export async function GET(req: Request) {
    try {
        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined');
        }

        // Obtiene el token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: "Token not provided" }, { status: 401 });
        }

        // Decodifica el token
        const token = authHeader.split(' ')[1];

        let decodedToken;
        try {
            decodedToken = verify(token, jwtSecret);
        } catch (error) {
            return NextResponse.json({ error: "Invalid token"}, { status: 401 });
        }

        if (!decodedToken || typeof decodedToken !== 'object' || !decodedToken.userId) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // Obtener ID del usuario
        const userId = decodedToken.userId;

        // Verificar la sesion del usuario
        const session = await prisma.session.findFirst({
            where: {
                sessionToken: token,
            },
        });

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const existingUserId = await getUserById(userId)

        if (!existingUserId) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Verifica si la sesion expiro
        const currentTime = new Date();
        if (session.expires < currentTime) {
            return NextResponse.json({ error: "Session expired" }, { status: 401 });
        }

        // verificar el rol del usuario para acceder a la ruta
        const verifyRole = await getUserById(userId);

        if (!verifyRole || verifyRole.role !== Role.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Obtener los parámetros de búsqueda de la URL
        const url = new URL(req.url);
        const skip = parseInt(url.searchParams.get("skip") || "0", 10);
        const take = parseInt(url.searchParams.get("take") || "10", 10);

        // Retorna todos los usuarios de la base de datos con o sin paginación
        const users = await prisma.user.findMany({
            //skip: skip,
            //take: take,
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
        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined');
        }

        // Obtiene el token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: "Token not provided" }, { status: 401 });
        }

        // Decodifica el token
        const token = authHeader.split(' ')[1];

        let decodedToken;
        try {
            decodedToken = verify(token, jwtSecret);
        } catch (error) {
            return NextResponse.json({ error: "Invalid token"}, { status: 401 });
        }

        if (!decodedToken || typeof decodedToken !== 'object' || !decodedToken.userId) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // Obtener ID del usuario
        const userId = decodedToken.userId;

        // Verificar la sesion del usuario
        const session = await prisma.session.findFirst({
            where: {
                sessionToken: token,
            },
        });

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const existingUserId = await getUserById(userId)

        if (!existingUserId) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Verifica si la sesion expiro
        const currentTime = new Date();
        if (session.expires < currentTime) {
            return NextResponse.json({ error: "Session expired" }, { status: 401 });
        }

        // verificar el rol del usuario para acceder a la ruta
        const verifyRole = await getUserById(userId);

        if (!verifyRole || verifyRole.role !== Role.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

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
        return NextResponse.json({ error: "Unexpected error"}, { status: 500 });
    }
}