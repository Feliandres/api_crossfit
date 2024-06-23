import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { ZodError } from "zod";
import { UpdatePaySchema } from "@/schemas";
import { getUserSession } from "@/data/session";

export async function GET(req: Request, { params: { id, payId } }: { params: { id: string; payId: string }}) {
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

        // Retorna el pago por id
        const getPay = await prisma.pay.findFirst({
            where: {
                id: Number(payId),
                memberId: Number(id),
            },
            include: {
                Member: {
                    include: {
                        plan: true,  // Incluir la información del plan del miembro
                    },
                },
            },
        });

        if (!getPay) {
            return NextResponse.json({ error: "Pay not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: "Return pay successfully",
            pay: {
                ...getPay
            },
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: "Unexpected error"}, { status: 500 });
    }
}

//

export async function PUT(req: Request, { params: { id, payId } }: { params: { id: string; payId: string }}) {
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

        // Valida los datos con Zod
        const validatedPay = UpdatePaySchema.parse(await req.json());

        // Actualizar Pago por id
        const updatedPay = await prisma.pay.update({
            where: {
                id: Number(payId),
                memberId: Number(id)
            },
            data: {
                ...validatedPay,
            },
            include: {
                Member: {
                    include: {
                        plan: true,  // Incluir la información del plan del miembro
                    },
                },
            },
        });

        return NextResponse.json({
            success: "Pay updated successfully",
            pay: {
                ...updatedPay
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

export async function DELETE(req: Request, { params: { id, payId } }: { params: { id: string; payId: string }}) {
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

        // Eliminar pago por id
        const deletedPay = await prisma.pay.update({
            where: {
                id: Number(payId),
                memberId: Number(id),
            },
            data: {
                status: false
            },
            include: {
                Member: {
                    include: {
                        plan: true,  // Incluir la información del plan del miembro
                    },
                },
            },
        });

        if (!deletedPay) {
            return NextResponse.json({ error: "Pay not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: "Deleted pay successfully",
            plan: {
                ...deletedPay
            },
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: "Unexpected error"}, { status: 500 });
    }
}