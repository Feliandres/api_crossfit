import { NextResponse } from "next/server";
import { getUserSession } from "@/data/session";

export async function GET(req: Request) {
    try {
        // Verifica la sesion y token de usuario y trae los datos del usuario
        const { user,token, error, status } = await getUserSession(req);

        if (error) {
            return NextResponse.json({ error }, { status });
        }

        return NextResponse.json({
            success: "Profile read successfully",
            user: {
                ...user
            },
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    }
}