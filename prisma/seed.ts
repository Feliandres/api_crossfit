import { Gender, Nacionality, PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {

    const born_date = "1999/12/12"

    const password_admin = await bcrypt.hash('S3cureP@assword', 10);
    const user_admin = await prisma.user.upsert({
        where: { email: 'admin@admin.com' },
        update: {},
        create: {
            identification: "9999999991",
            email: 'admin@admin.com',
            name: 'Admin',
            lastname: "User",
            password: password_admin,
            role: Role.ADMIN,
            emailVerified: new Date(),
            phone: "9999999999",
            emergencyPhone: "9999999999",
            direction: "Administacion Central",
            gender: Gender.M,
            nacionality: Nacionality.Ecuatoriano,
            bornDate: new Date(born_date)
        },
    });

    console.log("Usuario Admin creado con exito");
    console.log({ user_admin });

    const password_trainer = await bcrypt.hash('S3cureP@assword', 10);
    const user_trainer = await prisma.user.upsert({
        where: { email: 'trainer@trainer.com' },
        update: {},
        create: {
            identification: "9999999992",
            email: 'trainer@trainer.com',
            name: 'Trainer',
            lastname: "User",
            password: password_trainer,
            role: Role.TRAINER,
            emailVerified: new Date(),
            phone: "9999999999",
            emergencyPhone: "9999999999",
            direction: "Administacion Central",
            gender: Gender.M,
            nacionality: Nacionality.Ecuatoriano,
            bornDate: new Date(born_date)
        },
    });

    console.log("Usuario Entrenador creado con exito");
    console.log({ user_trainer });

    const password_customer = await bcrypt.hash('S3cureP@assword', 10);
    const user_customer = await prisma.user.upsert({
        where: { email: 'customer@customer.com' },
        update: {},
        create: {
            identification: "9999999993",
            email: 'customer@customer.com',
            name: 'Customer',
            lastname: "User",
            password: password_customer,
            role: Role.CUSTOMER,
            emailVerified: new Date(),
            phone: "9999999999",
            emergencyPhone: "9999999999",
            direction: "Administacion Central",
            gender: Gender.M,
            nacionality: Nacionality.Ecuatoriano,
            bornDate: new Date(born_date)
        },
    });

    console.log("Usuario Cliente creado con exito");
    console.log({ user_customer});

    const plan_basico = await prisma.plan.upsert({
        where: { name: 'Plan Basico' },
        update: {},
        create: {
            name: 'Plan Basico',
            description: "Este plan tiene una duracion de 30 dias",
            price: 30.00,
            duration: 30,
        }
    })

    console.log("Plan Basico creado con exito");
    console.log({ plan_basico });

    const plan_normal = await prisma.plan.upsert({
        where: { name: 'Plan Normal' },
        update: {},
        create: {
            name: 'Plan Normal',
            description: "Este plan tiene una duracion de 60 dias",
            price: 60.00,
            duration: 60,
        }
    })

    console.log("Plan Normal creado con exito");
    console.log({ plan_normal });

    const plan_premium = await prisma.plan.upsert({
        where: { name: 'Plan Premium' },
        update: {},
        create: {
            name: 'Plan Premium',
            description: "Este plan tiene una duracion de 120 dias",
            price: 120.00,
            duration: 120,
        }
    })

    console.log("Plan Premium creado con exito");
    console.log({ plan_premium });

    }
    main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
});
