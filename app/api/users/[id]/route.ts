import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ZodError } from "zod";
import { UpdateUserSchema } from "@/schemas";
import { Role } from "@prisma/client";
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

        // id del usuario que se va actualizar
        const idUser = params.id;

        // Retorna el usuario por id
        const getUser = await prisma.user.findUnique({
            where: {id: idUser}
        });


        return NextResponse.json({
            success: "Return user successfully",
            user: {
                ...getUser
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
        const idUser = params.id;

        // Validar datos con zod
        const validatedUser = UpdateUserSchema.parse(await req.json());

        // Actualizar el usuario
        const updatedUser = await prisma.user.update({
            where: { id: idUser},
            data: {
                ...validatedUser
            }
        })

        return NextResponse.json({
            success: "User updated successfully",
            user: updatedUser,
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
        const idUser = params.id;

         // Verifica el status del usuario
         const verificationStatus = await prisma.user.findFirst({
            where: { id: idUser }
        });

        if (!verificationStatus) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Alterna el estado del usuario
        const newStatus = !verificationStatus.status;

        const deletedUser = await prisma.user.update({
            where: { id: idUser },
            data: {
                status: newStatus,
            }
        });

        return NextResponse.json({
            success: `User ${newStatus ? 'activated' : 'desactivated'} successfully`,
            user: deletedUser,
        }, { status: 200 });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: "Invalid fields", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    }
}