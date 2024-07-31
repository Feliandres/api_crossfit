import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ZodError } from "zod";
import { UpdateUserSchema } from "@/schemas";
import { Role } from "@prisma/client";
import { getUserSession } from "@/data/session";
import { generateVerificationToken } from "@/data/tokens";
import { sendVerificationEmail } from "@/data/mail";
import { getUserByEmail, getUserById } from "@/data/user";
import bcrypt from "bcryptjs"

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
        // Verifica la sesión y token del usuario y trae los datos del usuario
        const { user, error, status } = await getUserSession(req);

        if (error) {
            return NextResponse.json({ error }, { status });
        }

        // Verificar el rol del usuario para acceder a la ruta
        if (!user || user.role !== Role.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Id del usuario que se va a actualizar
        const idUser = params.id;

        // Validar datos con zod
        const validatedUser = UpdateUserSchema.parse(await req.json());

        // Valida que la cedula no exista
        const existingIdentification = await prisma.user.findUnique({
            where: {
                identification: validatedUser.identification
            }
        })

        if (existingIdentification) {
            return NextResponse.json({ error: "Identification already in use" }, { status: 401 });
        }

        // Verificar si el correo electrónico ya está en uso y actualizar
        let emailChanged = false;
        if (validatedUser.email) {
            const existingUser = await getUserByEmail(validatedUser.email);

            if (existingUser && existingUser.id !== idUser) {
                return NextResponse.json({ error: "Email already in use" }, { status: 401 });
            }

            if (existingUser?.email !== validatedUser.email) {
                emailChanged = true;

                // Actualiza emailVerified a null
                await prisma.user.update({
                    where: { id: idUser },
                    data: { emailVerified: null },
                });

                // Generar y enviar token de verificación
                const verificationToken = await generateVerificationToken(validatedUser.email);
                await sendVerificationEmail(validatedUser.email, verificationToken.token);
            }
        }

        // Verificar y hashear la nueva contraseña si se proporciona
        let hashedPassword: string | undefined;
        if (validatedUser.password) {
            // Comparar la nueva contraseña con la actual
            const existingUser = await getUserById(idUser);
            const isPasswordSame = existingUser?.password && await bcrypt.compare(validatedUser.password, existingUser.password);

            if (isPasswordSame) {
                return NextResponse.json({ error: "New password cannot be the same as the current password" }, { status: 400 });
            }

            // Hashear la nueva contraseña si es diferente
            hashedPassword = await bcrypt.hash(validatedUser.password, 12);
        }

        // Actualizar los datos del usuario en la base de datos
        const updatedUser = await prisma.user.update({
            where: { id: idUser },
            data: {
                password: hashedPassword,
                ...validatedUser,
            }
        });

        return NextResponse.json({
            success: "User updated successfully.",
            ...(emailChanged && { message: "Please verify the new email address." }),
            user: updatedUser,
        }, { status: 200 });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: "Invalid fields", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Unexpected error", errors: error }, { status: 500 });
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