/*
  Warnings:

  - Added the required column `payment_type` to the `pays` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Payment_Type" AS ENUM ('Efectivo', 'Tarjeta', 'Transferencia');

-- AlterTable
ALTER TABLE "pays" ADD COLUMN     "payment_type" "Payment_Type" NOT NULL,
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;
