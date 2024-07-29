import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { ZodError } from "zod";
import { PaySchema } from "@/schemas";
import { getUserSession } from "@/data/session";
import cloudinary from "cloudinary";

// Configurar Cloudinary
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

        // Retorna todos los pagos de la base de datos con o sin paginación
        const getPays = await prisma.pay.findMany({
            //skip: skip,
            //take: take,
            where: {
                memberId: Number(params.id)
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
            success: "Return pays successfully",
            pay: {
                ...getPays
            },
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: "Unexpected error"}, { status: 500 });
    }
}

//

export async function POST(req: Request, { params }: { params: { id: string }}) {
    try {
        // Verificar la sesión y token del usuario
        const { user, error, status } = await getUserSession(req);

        if (error) {
            return NextResponse.json({ error }, { status });
        }

        // Verificar el rol del usuario para acceder a la ruta
        if (!user || user.role !== Role.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Validar datos con Zod
        const validatedPay = PaySchema.parse(await req.json());

         // Validar la fecha del pago
        const currentDate = new Date();
        const paymentDate = new Date(validatedPay.date);

        // Función para normalizar una fecha a medianoche
        const normalizeDate = (date: Date) => {
            return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        };

        // Normalizar las fechas
        const normalizedCurrentDate = normalizeDate(currentDate);
        const normalizedPaymentDate = normalizeDate(paymentDate);

        if (normalizedPaymentDate > normalizedCurrentDate) {
            return NextResponse.json({ error: "Payment date cannot be in the future" }, { status: 400 });
        }

        // Verificar si ya existe un pago para el miembro en la fecha dada
        const existingPayment = await prisma.pay.findFirst({
            where: {
                memberId: Number(params.id),
                date: normalizedPaymentDate,
            },
        });

        if (existingPayment) {
            return NextResponse.json({ error: "Payment for this date already exists" }, { status: 400 });
        }

        // Subir PDF a Cloudinary si se proporciona
        let imageUrl = validatedPay.pdfUrl;
        if (validatedPay.pdfUrl) {
            try {
                const uploadResponse = await cloudinary.v2.uploader.upload(validatedPay.pdfUrl, {
                    folder: "payments",
                    resource_type: "raw",
                });
                imageUrl = uploadResponse.secure_url;
            } catch (error) {
                return NextResponse.json({ error: "PDF upload failed" }, { status: 400 });
            }
        }

        // Crear Pago con la URL del PDF
        const createdPay = await prisma.pay.create({
            data: {
                ...validatedPay,
                memberId: Number(params.id),
                pdfUrl: imageUrl, // Guardar la URL del PDF
            },
            include: {
                Member: {
                    include: {
                        plan: true, // Incluir la información del plan del miembro
                        user: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: "Pay created successfully",
            pay: createdPay,
        }, { status: 200 });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: "Invalid fields", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    }
}