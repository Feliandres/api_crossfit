import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verify } from 'jsonwebtoken';
import { SettingsSchema } from "@/schemas";
import { ZodError } from "zod";

export async function PUT(req: Request) {
    try {
        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined');
        }

        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: "Token not provided" }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];

        let decodedToken;
        try {
            decodedToken = verify(token, jwtSecret);
        } catch (err) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        if (!decodedToken || typeof decodedToken !== 'object' || !decodedToken.userId) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const userId = decodedToken.userId;

        // Validar datos con zod
        const editProfile = SettingsSchema.parse(await req.json());

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { ...editProfile },
        });

        return NextResponse.json({
            success: "Profile updated successfully",
            user: {
                ...editProfile
            },
        }, { status: 200 });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: "Invalid fields", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    }
}