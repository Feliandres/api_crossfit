import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verify } from 'jsonwebtoken';
import { getUserSession } from "@/data/session";

export async function POST(req: Request) {
    try {
        // Verifica la sesion y token de usuario y trae los datos del usuario
        const { user,token, error, status } = await getUserSession(req);

        if (error) {
            return NextResponse.json({ error }, { status });
        }

        // Obtener Id del usuario
        const userId = user?.id;

        await prisma.session.delete({
            where: {
                sessionToken: token,
            },
        });

        return NextResponse.json({
            success: "Logged out successfully",
            email: user?.email,
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    }
}