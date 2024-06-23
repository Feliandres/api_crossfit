import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { MemberSchema} from "@/schemas";
import { ZodError } from "zod";
import { getMemberByEmail } from "@/data/member";
import { getPlanById } from "@/data/plan";
import { getSessionAndValidateRole, getUserSession } from "@/data/session";

export async function GET(req: Request) {
    try {
        // Obtener y validar la sesión del usuario
        const { user, error, status } = await getSessionAndValidateRole(req);

        if (error) {
            return NextResponse.json({ error }, { status });
        }

        // Verificación adicional para asegurar que user no es null o undefined
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (user.role === Role.USER) {
            // Lógica específica para usuarios con rol USER
            const member = await prisma.member.findUnique({
                where: {
                    email: user.email,
                },
            });

            if (!member) {
                return NextResponse.json({ error: "No membership found for this user" }, { status: 404 });
            }

            return NextResponse.json({
                success: "Member retrieved successfully",
                member: {
                    ...member,
                },
            }, { status: 200 });

        } else if (user.role === Role.ADMIN) {
            // Lógica específica para usuarios con rol ADMIN
            const url = new URL(req.url);
            const skip = parseInt(url.searchParams.get("skip") || "0", 10);
            const take = parseInt(url.searchParams.get("take") || "10", 10);

            const members = await prisma.member.findMany({
                include: {
                    plan: true,
                }
            });

            return NextResponse.json({
                success: "Members retrieved successfully",
                members: members,
            }, { status: 200 });
        } else {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

    } catch (error) {
        return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
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

        // Validar si el id del plan es válido
        if (validatedMember.planId !== undefined) {
            const existingPlan = await getPlanById(validatedMember.planId)

            if (!existingPlan) {
                return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
            }

        }

        // Verifica si el miembro ya existe
        const existingMember = await getMemberByEmail(validatedMember.email);

        if (existingMember) {
            return NextResponse.json({ error: "Member already exist"}, { status: 401 });
        }

        const createdMember = await prisma.member.create({
            data: {
                ...validatedMember,
                //planId: Number(planValidated)
            },
            include: {
                plan: true,
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