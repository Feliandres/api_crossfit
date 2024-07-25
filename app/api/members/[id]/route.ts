import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ZodError } from "zod";
import {  updateMemberSchema } from "@/schemas";
import { Role } from "@prisma/client";
import { getPlanById } from "@/data/plan";
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
        const idMember = parseInt(params.id);

        // Retorna el plan por id
        const getMember = await prisma.member.findUnique({
            where: {
                id: idMember
            },
            include: {
                plan: true,
                user: true,
            }
        });


        return NextResponse.json({
            success: "Return member successfully",
            member: {
                ...getMember
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

        // id del usuario que se va actualizar
        const idMember = parseInt(params.id);

        // Validar datos con zod
        const validatedMember = updateMemberSchema.parse(await req.json());


        // Validar si el id del plan es válido
        if (validatedMember.planId !== undefined) {
            const existingPlan = await getPlanById(validatedMember.planId)

            if (!existingPlan) {
                return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
            }

        }

        // Verificar si el nuevo correo electrónico existe en la tabla `users`
        if (validatedMember.email) {

            const emailExists = await prisma.user.findUnique({
                where: {
                    email: validatedMember.email,
                }
            })

            if (!emailExists) {
                return NextResponse.json({ error: "Email does not exist in the users table" }, { status: 400 });
            }
        }

        // Actualizar la membresia
        const updatedMember = await prisma.member.update({
            where: { id: idMember},
            data: {
                ...validatedMember,
            },
            include:{
                plan: true,
                user: true,
            }
        })

        return NextResponse.json({
            success: "Member updated successfully",
            member: updatedMember,
        }, { status: 200 });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: "Invalid fields", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
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

        // id del usuario que se va actualizar
        const idMember = parseInt(params.id);

        // Verifica el status del usuario
        const verificationStatus = await prisma.member.findFirst({
            where: { id: idMember}
        })

        if (!verificationStatus) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        // Alterna el estado del usuario
        const newStatus = !verificationStatus.status;

        const deletedMember = await prisma.member.update({
            where: { id: idMember },
            data: {
                status: newStatus,
            },
            include:{
                plan: true,
                user: true,
            },
        })

        return NextResponse.json({
            success: `Member ${newStatus ? 'activated' : 'desactivated'} successfully`,
            member: deletedMember,
        }, { status: 200 });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: "Invalid fields", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    }
}