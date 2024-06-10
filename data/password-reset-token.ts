import { prisma } from "@/lib/prisma";

export const getPasswordResetTokenByToken = async (token: string) => {
    try {
        const passwordResetToken = await prisma.verificationToken.findUnique({
            where: {token}
        });

        return passwordResetToken;
    } catch {
        return null;
    }
};

export const getPasswordResetTokenByEmail = async (email: string) => {
    try {
        const passwordResetToken = await prisma.verificationToken.findFirst({
            where: {email}
        });

        return passwordResetToken;
    } catch {
        return null;
    }
};