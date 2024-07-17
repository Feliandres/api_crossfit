import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { ZodError } from "zod";
import { UpdatePlanSchema } from "@/schemas";
import { getUserSession } from "@/data/session";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

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
        // Verifica la sesión y token de usuario y trae los datos del usuario
        const { user, error, status } = await getUserSession(req);

        if (error) {
            return NextResponse.json({ error }, { status });
        }

        // verificar el rol del usuario para acceder a la ruta
        if (!user || user.role !== Role.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // id del plan que se va a eliminar
        const idPlan = parseInt(params.id);

        // Intentar eliminar el plan
        try {
            const plan = await prisma.plan.delete({
                where: { id: idPlan }
            });

            return NextResponse.json({
                success: "Deleted plan successfully",
                plan: {
                    ...plan
                },
            }, { status: 200 });

        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                // Prisma error codes
                if (error.code === 'P2003') { // Prisma error code for foreign key constraint failure
                    return NextResponse.json({ error: "Cannot delete plan as it is in use" }, { status: 400 });
                } else if (error.code === 'P2025') { // Prisma error code for record not found
                    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
                }
            }

            return NextResponse.json({ error: "Unexpected error", details: (error as Error).message }, { status: 500 });
        }

    } catch (error) {
        // Type guard for unknown type
        if (error instanceof Error) {
            return NextResponse.json({ error: "Unexpected error", details: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    }
}