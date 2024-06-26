import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { ZodError } from "zod";
import { PlanSchema } from "@/schemas";
import { getPlanByName } from "@/data/plan";
import { getUserSession } from "@/data/session";

export async function GET(req: Request) {
    try {
        // Verifica la sesion y token de usuario y trae los datos del usuario
        const { user, error, status } = await getUserSession(req);

        if (error) {
            return NextResponse.json({ error }, { status });
        }

        // Obtener Id del usuario
        const userId = user?.id;

        // verificar el rol del usuario para acceder a la ruta
        if (!user ) {
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
            plan: createdPlan,
        }, { status: 200 });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: "Invalid fields", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Unexpected error"}, { status: 500 });
    }
}