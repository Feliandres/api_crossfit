-- CreateTable
CREATE TABLE "member_payment_info" (
    "id" INTEGER NOT NULL,
    "member_id" INTEGER NOT NULL,
    "member_identification" TEXT NOT NULL,
    "member_name" TEXT NOT NULL,
    "member_lastname" TEXT NOT NULL,
    "member_email" TEXT NOT NULL,
    "member_phone" TEXT NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "plan_name" TEXT NOT NULL,
    "plan_price" DECIMAL(65,30) NOT NULL,
    "plan_duration" INTEGER NOT NULL,
    "first_payment_date" TIMESTAMP(3),
    "last_payment_date" TIMESTAMP(3),
    "next_payment_date" TIMESTAMP(3),
    "days_remaining" INTEGER,

    CONSTRAINT "member_payment_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "total_earnings" (
    "id" INTEGER NOT NULL,
    "total_earnings" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "total_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annual_earnings" (
    "id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "annual_earnings" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "annual_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_earnings" (
    "id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "monthly_earnings" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "monthly_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "earnings_by_plan" (
    "id" INTEGER NOT NULL,
    "plan_name" TEXT NOT NULL,
    "earnings" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "earnings_by_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "total_attendances" (
    "id" INTEGER NOT NULL,
    "total_attendances" INTEGER NOT NULL,

    CONSTRAINT "total_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances_by_gender" (
    "id" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "total_attendances" INTEGER NOT NULL,

    CONSTRAINT "attendances_by_gender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annual_attendances" (
    "id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "annual_attendances" INTEGER NOT NULL,

    CONSTRAINT "annual_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_attendances" (
    "id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "monthly_attendances" INTEGER NOT NULL,

    CONSTRAINT "monthly_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_attendances" (
    "id" INTEGER NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "daily_attendances" INTEGER NOT NULL,

    CONSTRAINT "daily_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "total_memberships" (
    "id" INTEGER NOT NULL,
    "total_memberships" INTEGER NOT NULL,

    CONSTRAINT "total_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "active_memberships" (
    "id" INTEGER NOT NULL,
    "active_memberships" INTEGER NOT NULL,

    CONSTRAINT "active_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inactive_memberships" (
    "id" INTEGER NOT NULL,
    "inactive_memberships" INTEGER NOT NULL,

    CONSTRAINT "inactive_memberships_pkey" PRIMARY KEY ("id")
);
