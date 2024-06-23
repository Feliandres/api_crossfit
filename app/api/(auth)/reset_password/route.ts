import { NextResponse } from "next/server";
import { getUserByEmail } from "@/data/user";
import { generatePasswordResetToken } from "@/data/tokens";
import { sendPasswordResetEmail } from "@/data/mail";
import { ResetSchema } from "@/schemas";
import { ZodError } from "zod";

export async function POST(req: Request) {
    try {
        // Validación con Zod
        const validatedFields = ResetSchema.safeParse(await req.json());

        if (!validatedFields.success) {
            return NextResponse.json({ error: "Invalid email" }, { status: 400 });
        }

        const { email } = validatedFields.data;

        const existingUser = await getUserByEmail(email);

        if (!existingUser) {
            return NextResponse.json({ error: "Email not found" }, { status: 404 });
        }

        const passwordResetToken = await generatePasswordResetToken(email);

        await sendPasswordResetEmail(
            passwordResetToken.email,
            passwordResetToken.token,
        );

        return NextResponse.json({
            success: "Reset email sent!",
            user: {
                token: passwordResetToken.token
            },
        },
        { status: 200 });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: "Invalid fields", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    }
}