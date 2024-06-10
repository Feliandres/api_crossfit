import { prisma } from "@/lib/prisma";
import { NextResponse} from "next/server";

export async function POST(req: Request) {

    const { token } = await req.json();

    console.log("Received token in API endpoint:", token); // Debugging

    const existingToken = await prisma.verificationToken.findUnique({
        where: {token: token}
    });

    if (!existingToken) {
        console.log("Token not found in database:", token); // Debugging
        return NextResponse.json({ error: "Token does not exist" }, { status: 400 });
    }

    console.log("Found token in database:", existingToken);

    const hasExpired = new Date(existingToken.expires) < new Date();

    if (hasExpired) {
        console.log("Token has expired:", token); // Debugging
        return NextResponse.json({ error: "Token has expired" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
        where: {email: existingToken.email}
    });

    if (!existingUser) {
        console.log("Email not found:", existingToken.email); // Debugging
        return NextResponse.json({ error: "Email does not exist" }, { status: 400 });
    }

    await prisma.user.update({
        where: { id: existingUser.id },
        data: {
            emailVerified: new Date(),
            email: existingToken.email,
        }
    });

    await prisma.verificationToken.delete({
        where: { id: existingToken.id }
    });

    console.log("Email verified successfully for:", existingToken.email);

    return NextResponse.json({
        success: "Email verified",
        user: {
            email: existingToken.email
        }
        },
        { status: 200 }
    );
}