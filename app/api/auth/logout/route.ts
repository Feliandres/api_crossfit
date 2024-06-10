import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verify } from 'jsonwebtoken';

export async function POST(req: Request) {
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

        const session = await prisma.session.findFirst({
            where: {
                sessionToken: token,
            },
        });

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: decodedToken.userId,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        await prisma.session.delete({
            where: {
                sessionToken: token,
            },
        });

        return NextResponse.json({
            success: "Logged out successfully",
            email: user.email,
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    }
}