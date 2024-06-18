import {prisma} from "@/lib/prisma";

export const getMemberByEmail = async (email: string) => {
    try {
        const member = await prisma.member.findUnique({
            where : {email}
        });
        return member;

    } catch {
        return null;
    }
}