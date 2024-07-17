import bcrypt from "bcryptjs"; // Importa bcrypt
import { LoginSchema } from "@/schemas";
import { generateVerificationToken } from "@/data/tokens";
import { getUserByEmail } from "@/data/user";
import { sendVerificationEmail } from "@/data/mail";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { sign } from 'jsonwebtoken';

export async function POST(req: Request) {
    try {

        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined');
        }

        const validatedFields = LoginSchema.parse(await req.json());

        const { email, password } = validatedFields;
        const existingUser = await getUserByEmail(email);

        if (!existingUser || !existingUser.email || !existingUser.password) {
            return NextResponse.json({ error: "Email does not exist" }, { status: 404 });
        }

        // Verificar si el usuario tiene status false
        if (existingUser.status === false || !existingUser.emailVerified) {
            return NextResponse.json({ error: "User is desactivated or not confirmated" }, { status: 401 });
        }

        if (!existingUser.emailVerified) {
            const verificationToken = await generateVerificationToken(existingUser.email);
            await sendVerificationEmail(verificationToken.email, verificationToken.token);
            return NextResponse.json({ success: "Confirmation email sent" }, { status: 200 });
        }

        // Comparar la contraseña ingresada con la almacenada en la base de datos
        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
            return NextResponse.json({ error: "Invalid password" }, { status: 401 });
        }

        // Buscar una sesión existente para el usuario
        const existingSession = await prisma.session.findFirst({
            where: {
                userId: existingUser.id,
                expires: {
                    gt: new Date(), // La sesión no ha expirado
                },
            },
        });

        if (existingSession) {
            return NextResponse.json({
                success: "Login Sucessfully",
                user: {
                    id: existingUser.id,
                    email: existingUser.email,
                    name: existingUser.name,
                    role: existingUser.role,
                    image: existingUser.image,
                },
                token: existingSession.sessionToken,
            }, { status: 200 });
        }

        const token = sign({ userId: existingUser.id }, jwtSecret, { expiresIn: '1h' });

        await prisma.session.create({
            data: {
                userId: existingUser.id,
                sessionToken: token, // Use sessionToken instead of jwt
                expires: new Date(Date.now() + 3600000),
            },
        });

        return NextResponse.json({
            success: "Login Sucessfully",
            user: {
                id: existingUser.id,
                email: existingUser.email,
                name: existingUser.name,
                role: existingUser.role,
                image: existingUser.image,
            },
            token
        }, { status: 200 });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: "Invalid fields", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    }
}
