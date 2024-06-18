import {prisma} from "@/lib/prisma";

export const getPlanByName = async (name: string) => {
    try {
        const plan = await prisma.plan.findUnique({
            where : {name}
        });
        return plan;

    } catch {
        return null;
    }
}

export const getPlanById = async (id: number) => {
    try {
        const plan = await prisma.plan.findFirst({
            where : {id}
        });
        return plan;

    } catch {
        return null;
    }
}
