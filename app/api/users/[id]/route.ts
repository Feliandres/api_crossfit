import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verify } from 'jsonwebtoken';
import { ZodError } from "zod";
import { getUserById } from "@/data/user";
import { SettingsSchema } from "@/schemas";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
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
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
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

        // id del usuario que se va actualizar
        const idUser = params.id;

        // Validar datos con zod
        const validatedUser = SettingsSchema.parse(await req.json());

        // Actualizar el usuario
        const updatedUser = await prisma.user.update({
            where: { id: idUser},
            data: {
                ...validatedUser
            }
        })

        return NextResponse.json({
            success: "User updated successfully",
            user: updatedUser,
        }, { status: 200 });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: "Invalid fields", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    }
}
