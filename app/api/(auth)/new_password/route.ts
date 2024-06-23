import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { NewPasswordSchema } from "@/schemas";

export async function POST(req: Request) {

    const { token, password } = await req.json();

    // Validar el token por separado
    if (!token) {
        console.log("Token not provided");
        return NextResponse.json({ error: "Missing token!" }, { status: 400 });
    }

    // Valida el campo de contraseña usando zod
    const validatedFields = NewPasswordSchema.safeParse({ password });
    if (!validatedFields.success) {
        console.log("Invalid fields provided", validatedFields.error.issues); // Mostrar errores específicos
        return NextResponse.json({ error: validatedFields.error.errors }, { status: 400 });
    }

    const { password: validPassword } = validatedFields.data;

    // Buscar el token en la base de datos
    const existingToken = await prisma.verificationToken.findUnique({
        where: { token: token },
    });
    if (!existingToken) {
        console.log("Token not found in database:", token);
        return NextResponse.json({ error: "Invalid Token" }, { status: 400 });
    }

    // Verificar si el token ha expirado
    const hasExpired = new Date(existingToken.expires) < new Date();
    if (hasExpired) {
        console.log("Token has expired:", token);
        return NextResponse.json({ error: "Token has expired" }, { status: 400 });
    }

    // Buscar el usuario asociado al token
    const existingUser = await prisma.user.findUnique({
        where: { email: existingToken.email },
    });
    if (!existingUser) {
        console.log("Email not found:", existingToken.email);
        return NextResponse.json({ error: "Email does not exist" }, { status: 400 });
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(validPassword, 10);

    // Actualizar la contraseña del usuario
    await prisma.user.update({
        where: { id: existingUser.id },
        data: { password: hashedPassword },
    });

    // Eliminar el token de reseteo de contraseña usado
    await prisma.verificationToken.delete({
        where: { id: existingToken.id },
    });

    console.log("Password updated successfully for:", existingToken.email);

    return NextResponse.json({
        success: "Password updated!",
        user: {
            email: existingToken.email
        }
    },
    { status: 200 });
}