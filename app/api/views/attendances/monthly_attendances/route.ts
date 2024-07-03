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

        if (user.role === Role.ADMIN) {

            const monthly_attendances = await prisma.monthlyAttendances.findMany({

            })

            return NextResponse.json({
                success: "Pay info retrieved successfully",
                monthly_attendance: {
                    ...monthly_attendances,
                },
            }, { status: 200 });
        }

    } catch (error) {
        return NextResponse.json({ error: "Unexpected error"}, { status: 500 });
    }
}