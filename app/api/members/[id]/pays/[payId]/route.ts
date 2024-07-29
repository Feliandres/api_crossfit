import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { ZodError } from "zod";
import { UpdatePaySchema } from "@/schemas";
import { getUserSession } from "@/data/session";
import cloudinary from "cloudinary";

// Configurar Cloudinary
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
                        user: true,
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

export async function PUT(req: Request, { params: { id, payId } }: { params: { id: string; payId: string } }) {
    try {
        // Verifica la sesión y token de usuario
        const { user, error, status } = await getUserSession(req);

        if (error) {
            return NextResponse.json({ error }, { status });
        }

        // Verificar el rol del usuario para acceder a la ruta
        if (!user || user.role !== Role.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Validar datos con Zod
        const validatedPay = UpdatePaySchema.parse(await req.json());

        // Validar que la fecha del pago esté presente y no sea indefinida
        if (!validatedPay.date) {
            return NextResponse.json({ error: "Payment date is required" }, { status: 400 });
        }

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

        // Verificar si ya existe otro pago para el miembro en la fecha dada
        const existingPayment = await prisma.pay.findFirst({
            where: {
                memberId: Number(id),
                date: normalizedPaymentDate,
                id: { not: Number(payId) }, // Excluir el pago actual
            },
        });

        if (existingPayment) {
            return NextResponse.json({ error: "Another payment for this date already exists" }, { status: 400 });
        }

        // Subir PDF a Cloudinary si se proporciona
        let imageUrl = validatedPay.pdfUrl;
        if (validatedPay.pdfUrl) {
            try {
                const uploadResponse = await cloudinary.v2.uploader.upload(validatedPay.pdfUrl, {
                    folder: "payments",
                });
                imageUrl = uploadResponse.secure_url;
            } catch (error) {
                return NextResponse.json({ error: "PDF upload failed" }, { status: 400 });
            }
        }

        // Actualizar Pago por id
        const updatedPay = await prisma.pay.update({
            where: {
                id: Number(payId),
                memberId: Number(id)
            },
            data: {
                ...validatedPay,
                pdfUrl: imageUrl,
            },
            include: {
                Member: {
                    include: {
                        plan: true, // Incluir la información del plan del miembro
                        user: true, // Incluir la información del usuario del miembro
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
        return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
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

        // Verifica el estado del pago
        const verificationStatus = await prisma.pay.findFirst({
            where: { id: Number(payId), memberId: Number(id) }
        });

        if (!verificationStatus) {
            return NextResponse.json({ error: "Pay not found" }, { status: 404 });
        }

        // Alterna el estado del pago
        const newStatus = !verificationStatus.status;

        // Actualiza el estado del pago por id
        const updatedPay = await prisma.pay.update({
            where: {
                id: Number(payId),
            },
            data: {
                status: newStatus,
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
            success: `Pay ${newStatus ? 'activated' : 'desactivated'} successfully`,
            pay: {
                ...updatedPay
            },
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    }
}
