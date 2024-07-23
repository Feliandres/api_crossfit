import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { getSessionAndValidateRole } from "@/data/session";

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

        if (user.role === Role.CUSTOMER) {
            // Lógica específica para usuarios con rol USER
            const member = await prisma.member.findUnique({
                where: {
                    email: user.email,
                },
            });

            if (!member) {
                return NextResponse.json({ error: "No membership found for this user" }, { status: 404 });
            }

            const pay_info = await prisma.memberPaymentInfo.findMany({
                where: {
                    member_id: member.id
                },
            })

            return NextResponse.json({
                success: "Pay info retrieved successfully",
                pay: {
                    ...pay_info,
                },
            }, { status: 200 });

        } else if (user.role === Role.ADMIN || user.role === Role.TRAINER) {
            // Lógica específica para usuarios con rol ADMIN
            const url = new URL(req.url);
            const skip = parseInt(url.searchParams.get("skip") || "0", 10);
            const take = parseInt(url.searchParams.get("take") || "10", 10);

            const pays_info = await prisma.memberPaymentInfo.findMany({
                //
                //
            });

            return NextResponse.json({
                success: "Pays info retrieved successfully",
                pay: pays_info,
            }, { status: 200 });
        } else {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

    } catch (error) {
        return NextResponse.json({ error: "Unexpected error"}, { status: 500 });
    }
}