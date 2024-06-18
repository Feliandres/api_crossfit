import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verify } from 'jsonwebtoken';
import { Role } from "@prisma/client";
import { ZodError } from "zod";
import { getUserById } from "@/data/user";
import { UpdatePlanSchema } from "@/schemas";

export async function GET(req: Request, { params }: { params: { id: string } }) {
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

        // id del plan que se va actualizar
        const idPlan = parseInt(params.id);

        // Retorna el plan por id
        const getPlan = await prisma.plan.findFirst({
            where: {id: idPlan}
        });

        if (!getPlan) {
            return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: "Return plan successfully",
            plan: {
                ...getPlan
            },
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: "Unexpected error"}, { status: 500 });
    }
}

//

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

        // id del plan que se va actualizar
        const idPlan = parseInt(params.id);

        // Valida los datos con Zod
        const validatedPlan = UpdatePlanSchema.parse(await req.json());

        // Retorna el plan por id
        const updatedPlan = await prisma.plan.update({
            where: {id: idPlan},
            data: {
                ...validatedPlan,
            }
        });

        return NextResponse.json({
            success: "Plan updated successfully",
            plan: {
                ...updatedPlan
            },
        }, { status: 200 });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: "Invalid fields", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Unexpected error"}, { status: 500 });
    }
}

//

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
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

        // id del plan que se va actualizar
        const idPlan = parseInt(params.id);

        // Eliminar el plan por id
        const plan = await prisma.plan.delete({
            where: {id: idPlan}
        });

        if (!plan) {
            return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: "Deleted plan successfully",
            plan: {
                ...plan
            },
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: "Unexpected error"}, { status: 500 });
    }
}