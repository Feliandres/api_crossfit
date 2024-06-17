import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {

    const password_admin = await bcrypt.hash('123456', 10);
    const user_admin = await prisma.user.upsert({
        where: { email: 'admin@admin.com' },
        update: {},
        create: {
        email: 'admin@admin.com',
        name: 'Admin',
        password: password_admin,
        role: Role.ADMIN,
        emailVerified: new Date(),
        },
    });

    console.log("Usuario Admin creado con exito");
    console.log({ user_admin });

    const password_trainer = await bcrypt.hash('123456', 10);
    const user_trainer = await prisma.user.upsert({
        where: { email: 'trainer@trainer.com' },
        update: {},
        create: {
        email: 'trainer@trainer.com',
        name: 'Trainer',
        password: password_trainer,
        role: Role.TRAINER,
        emailVerified: new Date(),
        },
    });

    console.log("Usuario Entrenador creado con exito");
    console.log({ user_trainer });

    }
    main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
});
