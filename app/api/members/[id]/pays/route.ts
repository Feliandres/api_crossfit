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

        // Leer el cuerpo de la solicitud como arrayBuffer
        const buffer = await req.arrayBuffer();

        // Validar datos con Zod
        const validatedPay = PaySchema.parse(JSON.parse(new TextDecoder().decode(buffer)));

        // Subir archivo PDF a Cloudinary
        let pdf_url: string | null = null;
        try {
            const uploadResponse = await new Promise((resolve, reject) => {
                const stream = cloudinary.v2.uploader.upload_stream(
                    {
                        folder: "payments",
                        resource_type: "auto",
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );

                stream.write(Buffer.from(buffer));
                stream.end();
            });

            pdf_url = (uploadResponse as any).secure_url;
        } catch (uploadError) {
            return NextResponse.json({ error: "PDF upload failed" }, { status: 500 });
        }

        // Crear Pago con la URL del PDF
        const createdPay = await prisma.pay.create({
            data: {
                ...validatedPay,
                memberId: Number(params.id),
                pdfUrl: pdf_url, // Guardar la URL del PDF
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