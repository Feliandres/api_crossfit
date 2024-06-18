import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verify } from 'jsonwebtoken';
import { Role } from "@prisma/client";
import { ZodError } from "zod";
import { getUserById } from "@/data/user";
import { PlanSchema } from "@/schemas";
import { getPlanByName } from "@/data/plan";

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
        if (!existingUserId || existingUserId.role !== Role.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Obtener los parámetros de búsqueda de la URL
        const url = new URL(req.url);
        const skip = parseInt(url.searchParams.get("skip") || "0", 10);
        const take = parseInt(url.searchParams.get("take") || "10", 10);

        // Retorna todos los planes de la base de datos con o sin paginación
        const plans = await prisma.plan.findMany({
            //skip: skip,
            //take: take,
        });


        return NextResponse.json({
            success: "Return plans successfully",
            plan: {
                ...plans
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

        const existingUser = await getUserById(userId)

        if (!existingUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Verifica si la sesion expiro
        const currentTime = new Date();
        if (session.expires < currentTime) {
            return NextResponse.json({ error: "Session expired" }, { status: 401 });
        }

        // verificar el rol del usuario para acceder a la ruta
        if (!existingUser || existingUser.role !== Role.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Validación con Zod
        const validatedPlan = PlanSchema.parse(await req.json());

        // Verifica si el plan ya existe
        const existingPlan = await getPlanByName(validatedPlan.name);

        if (existingPlan) {
            return NextResponse.json({ error: "Plan already exist"}, { status: 401 });
        }

        const createdPlan = await prisma.plan.create({
            data: {
                ...validatedPlan
            }
        });

        return NextResponse.json({
            success: "Plan created successfully",
            user: createdPlan,
        }, { status: 200 });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: "Invalid fields", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Unexpected error"}, { status: 500 });
    }
}