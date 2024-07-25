import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { ZodError } from "zod";
import { UpdateAttendanceSchema } from "@/schemas";
import { getUserSession } from "@/data/session";

export async function GET(req: Request, { params: { id, attendanceId } }: { params: { id: string; attendanceId: string }}) {
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

        // Retorna la asistencia por id
        const getAttendance = await prisma.attendance.findFirst({
            where: {
                id: Number(attendanceId),
                memberId: Number(id),
            },
            include: {
                Member: {
                    include: {
                        plan: true,  // Incluir la información del plan del miembro
                        user: true,
                    },
                },
            },
        });

        if (!getAttendance) {
            return NextResponse.json({ error: "Attendance not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: "Return attendance successfully",
            attendance: {
                ...getAttendance
            },
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: "Unexpected error"}, { status: 500 });
    }
}

//

export async function PUT(req: Request, { params: { id, attendanceId } }: { params: { id: string; attendanceId: string } }) {
    try {
        // Verifica la sesión y token de usuario y trae los datos del usuario
        const { user, error, status } = await getUserSession(req);

        if (error) {
            return NextResponse.json({ error }, { status });
        }

        // Obtener Id del usuario
        const userId = user?.id;

        // Verificar el rol del usuario para acceder a la ruta
        if (!user || user.role !== Role.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Valida los datos con Zod
        const validatedAttendance = UpdateAttendanceSchema.parse(await req.json());

        // Obtener información del miembro
        const member = await prisma.member.findUnique({
            where: {
                id: Number(id),
            },
        });

        if (!member) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        // Obtener la asistencia a actualizar
        const existingAttendance = await prisma.attendance.findUnique({
            where: {
                id: Number(attendanceId),
            },
        });

        if (!existingAttendance) {
            return NextResponse.json({ error: "Attendance not found" }, { status: 404 });
        }

        // Validar la fecha de la asistencia
        const currentDate = new Date();
        const attendanceDate = validatedAttendance.date;

        if (!attendanceDate) {
            return NextResponse.json({ error: "Date is required" }, { status: 400 });
        }

        // Función para normalizar una fecha a medianoche
        const normalizeDate = (date: Date) => {
            return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        };

        // Normalizar las fechas
        const normalizedCurrentDate = normalizeDate(currentDate);
        const normalizedAttendanceDate = normalizeDate(attendanceDate);
        const normalizedInscriptionDate = normalizeDate(member.inscriptionDate);

        if (normalizedAttendanceDate > normalizedCurrentDate) {
            return NextResponse.json({ error: "Attendance date cannot be in the future" }, { status: 400 });
        }

        if (normalizedAttendanceDate < normalizedInscriptionDate) {
            return NextResponse.json({ error: "Attendance date cannot be before the member's inscription date" }, { status: 400 });
        }

        // Actualizar Asistencia
        const updatedAttendance = await prisma.attendance.update({
            where: {
                id: Number(attendanceId),
            },
            data: {
                ...validatedAttendance,
            },
            include: {
                Member: {
                    include: {
                        plan: true,  // Incluir la información del plan del miembro
                        user: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: "Attendance updated successfully",
            attendance: {
                ...updatedAttendance,
            },
        }, { status: 200 });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: "Invalid fields", details: error.errors }, { status: 400 });
        }
        if (error instanceof Error) {
            return NextResponse.json({ error: "Unexpected error", details: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    }
}

//

export async function DELETE(req: Request, { params: { id, attendanceId } }: { params: { id: string; attendanceId: string }}) {
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

        // Eliminar la asistencia por id
        const deletedAttendance = await prisma.attendance.delete({
            where: {
                id: Number(attendanceId),
                memberId: Number(id),
            },
            include: {
                Member: {
                    include: {
                        plan: true,  // Incluir la información del plan del miembro
                        user: true,
                    },
                },
            },
        });

        if (!deletedAttendance) {
            return NextResponse.json({ error: "Attendance not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: "Deleted attendance successfully",
            attendance: {
                ...deletedAttendance
            },
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: "Unexpected error"}, { status: 500 });
    }
}