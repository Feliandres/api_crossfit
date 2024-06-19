import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { ZodError } from "zod";
import { UpdatePlanSchema } from "@/schemas";
import { getUserSession } from "@/data/session";

export async function GET(req: Request, { params }: { params: { id: string } }) {
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