import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SettingsSchema } from "@/schemas";
import { ZodError } from "zod";
import cloudinary from "cloudinary";
import { getUserSession } from "@/data/session";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken} from "@/data/tokens";
import { sendVerificationEmail } from "@/data/mail";

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function PUT(req: Request) {
    try {
        // Verifica la sesión y token del usuario y trae los datos del usuario
        const { user, token, error, status } = await getUserSession(req);

        if (error) {
            return NextResponse.json({ error }, { status });
        }

        // Obtener Id del usuario
        const userId = user?.id;
        const userEmail = user?.email;
        const userPassword = user?.password;

        // Validar datos con zod
        const editProfile = SettingsSchema.parse(await req.json());

        const { email, password, ...userData } = editProfile;

        // Verifica si el correo electrónico ya está en uso
        let emailChanged = null;
        if (email && email !== userEmail) {
            const existingUser = await getUserByEmail(email);

            if (existingUser) {
                return NextResponse.json({ error: "Email already in use" }, { status: 401 });
            }

            // Si el correo electrónico ha cambiado, actualiza emailVerified a false
            await prisma.user.update({
                where: { id: userId },
                data: { emailVerified: null },
            });

            // Generar y enviar token de verificación
            const verificationToken = await generateVerificationToken(email);
            await sendVerificationEmail(email, verificationToken.token);

            emailChanged = null;
        }

        // Verificar y hashear la nueva contraseña si se proporciona
        let hashedPassword: string | undefined;
        if (password) {
    
            // Comparar la nueva contraseña con la actual
            const isPasswordSame = userPassword && await bcrypt.compare(password, userPassword);

            if (isPasswordSame) {
                return NextResponse.json({ error: "New password cannot be the same as the current password" }, { status: 400 });
            }

            // Hashear la nueva contraseña si es diferente
            hashedPassword = await bcrypt.hash(password, 12);
        }

        // Subir imagen a Cloudinary si se proporciona
        let imageUrl = editProfile.image;
        if (editProfile.image) {
            try {
                const uploadResponse = await cloudinary.v2.uploader.upload(editProfile.image, {
                    folder: "profile_pictures",
                });
                imageUrl = uploadResponse.secure_url;
            } catch (error) {
                return NextResponse.json({ error: "Image upload failed" }, { status: 400 });
            }
        }

        // Actualizar los datos del usuario en la base de datos
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                email: email ?? userEmail, // Solo actualizar si el email ha cambiado
                password: hashedPassword ?? undefined, // Solo actualizar si se ha proporcionado una nueva contraseña
                image: imageUrl ?? undefined, // Solo actualizar si se ha proporcionado una nueva imagen
                ...userData // Actualizar otros datos del usuario
            },
        });

        // Cerrar la sesión si el correo electrónico ha cambiado
        if (emailChanged) {
            await prisma.session.delete({
                where: {
                    sessionToken: token,
                },
            });
        }

        return NextResponse.json({
            success: "Profile updated successfully. Please verify your new email address.",
            user: {
                ...updatedUser
            },
        }, { status: 200 });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: "Invalid fields", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    }
}
