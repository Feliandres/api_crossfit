import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { MemberSchema} from "@/schemas";
import { ZodError } from "zod";
import { getMemberByEmail } from "@/data/member";
import { getPlanById } from "@/data/plan";
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
        if (!user || user.role !== Role.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Obtener los parámetros de búsqueda de la URL
        const url = new URL(req.url);
        const skip = parseInt(url.searchParams.get("skip") || "0", 10);
        const take = parseInt(url.searchParams.get("take") || "10", 10);

        // Retorna todas las membresias de la base de datos con o sin paginación
        const members = await prisma.member.findMany({
            //skip: skip,
            //take: take,
        });


        return NextResponse.json({
            success: "Return members successfully",
            member: {
                ...members
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
        const validatedMember = MemberSchema.parse(await req.json());

        let planValidated;

        if (validatedMember.plan !== undefined) {
            const existingPlan = await getPlanById(validatedMember.plan)

            if (!existingPlan) {
                return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
            }

            planValidated = { connect: { id: validatedMember.plan } };
        }

        // Verifica si el miembro ya existe
        const existingMember = await getMemberByEmail(validatedMember.email);

        if (existingMember) {
            return NextResponse.json({ error: "Member already exist"}, { status: 401 });
        }

        const createdMember = await prisma.member.create({
            data: {
                ...validatedMember,
                plan: planValidated
            }
        });

        return NextResponse.json({
            success: "Member created successfully",
            member: createdMember,
        }, { status: 200 });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: "Invalid fields", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Unexpected error"}, { status: 500 });
    }
}