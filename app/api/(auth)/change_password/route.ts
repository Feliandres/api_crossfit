import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ChangePasswordSchema } from "@/schemas"; // Define este schema para validar las contraseñas
import { ZodError } from "zod";
import { getUserSession } from "@/data/session";

export async function PUT(req: Request) {
    try {
        // Verifica la sesión y token del usuario y trae los datos del usuario
        const { user, error, status } = await getUserSession(req);

        if (error) {
            return NextResponse.json({ error }, { status });
        }

        // Obtener Id del usuario y su contraseña actual
        const userId = user?.id;
        const userPassword = user?.password;

        // Verificar que userPassword no sea null o undefined
        if (!userPassword) {
            return NextResponse.json({ error: "User password not found" }, { status: 500 });
        }

        // Leer y validar los datos de la solicitud
        const editPassword = ChangePasswordSchema.parse(await req.json())


        // Verificar que la contraseña actual sea correcta
        const isPasswordValid = await bcrypt.compare(editPassword.password, userPassword);
        if (!isPasswordValid) {
            return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
        }

        // Verificar que la nueva contraseña no sea igual a la actual
        const isSamePassword = await bcrypt.compare(editPassword.newPassword, userPassword);
        if (isSamePassword) {
            return NextResponse.json({ error: "New password cannot be the same as the current password" }, { status: 400 });
        }

        // Encriptar la nueva contraseña
        const hashedNewPassword = await bcrypt.hash(editPassword.newPassword, 12);

        // Actualizar la contraseña en la base de datos
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });

        return NextResponse.json({ success: "Password updated successfully" }, { status: 200 });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: "Invalid fields", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Unexpected error", details: error }, { status: 500 });
    }
}