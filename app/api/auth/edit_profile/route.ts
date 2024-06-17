import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verify } from 'jsonwebtoken';
import { SettingsSchema } from "@/schemas";
import { ZodError } from "zod";
import cloudinary from "cloudinary";

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function PUT(req: Request) {
    try {
        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined');
        }

        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: "Token not provided" }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];

        let decodedToken;
        try {
            decodedToken = verify(token, jwtSecret);
        } catch (error) {
            return NextResponse.json({ error: "Invalid token"}, { status: 401 });
        }

        if (!decodedToken || typeof decodedToken !== 'object' || !decodedToken.userId) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const userId = decodedToken.userId;

        // Validar datos con zod
        const editProfile = SettingsSchema.parse(await req.json());

        let imageUrl = editProfile.image;
        if (editProfile.image) {
            // Verificar si la imagen existe en Cloudinary
            try {
                const uploadResponse = await cloudinary.v2.uploader.upload(editProfile.image, {
                    folder: "profile_pictures",
                });
                imageUrl = uploadResponse.secure_url;
            } catch (error) {
                return NextResponse.json({ error: "Image upload failed" }, { status: 400 });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name: editProfile.name,
                email: editProfile.email,
                image: imageUrl
            },
        });

        return NextResponse.json({
            success: "Profile updated successfully",
            user: {
                ...updatedUser
            },
        }, { status: 200 });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: "Invalid fields", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Unexpected error"}, { status: 500 });
    }
}