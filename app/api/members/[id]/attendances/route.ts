import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { ZodError } from "zod";
import { AttendanceSchema } from "@/schemas";
import { getUserSession } from "@/data/session";

export async function GET(req: Request,{ params }: { params: { id: string }}) {
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

        // Retorna todos los planes de la base de datos con o sin paginación
        const getAttendance = await prisma.attendance.findMany({
            //skip: skip,
            //take: take,
            where: {
                memberId: Number(params.id)
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
            success: "Return attendances successfully",
            attendance: {
                ...getAttendance
            },
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: "Unexpected error"}, { status: 500 });
    }
}

//

export async function POST(req: Request,{ params }: { params: { id: string }}) {
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
        const validatedAttendance = AttendanceSchema.parse(await req.json());

        // Obtener información del miembro
        const member = await prisma.member.findUnique({
            where: {
                id: Number(params.id),
            },
        });

        if (!member) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        // Validar la fecha de la asistencia
        const currentDate = new Date();
        const attendanceDate = new Date(validatedAttendance.date);

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

        // Crear Asistencia
        const createdAttendance = await prisma.attendance.create({
            data: {
                ...validatedAttendance,
                memberId: Number(params.id),
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
            success: "Attendance created successfully",
            attendance: createdAttendance,
        }, { status: 200 });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: "Invalid fields", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Unexpected error"}, { status: 500 });
    }
}