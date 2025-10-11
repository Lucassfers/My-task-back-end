/*
  Warnings:

  - The primary key for the `admins` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `nome` on the `admins` table. The data in that column could be lost. The data in that column will be cast from `VarChar(70)` to `VarChar(60)`.
  - You are about to alter the column `email` on the `admins` table. The data in that column could be lost. The data in that column will be cast from `VarChar(155)` to `VarChar(40)`.
  - You are about to alter the column `usuarioId` on the `logs` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(36)`.
  - Added the required column `updatedAt` to the `admins` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."logs" DROP CONSTRAINT "logs_usuarioId_fkey";

-- AlterTable
ALTER TABLE "admins" DROP CONSTRAINT "admins_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE VARCHAR(36),
ALTER COLUMN "nome" SET DATA TYPE VARCHAR(60),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(40),
ALTER COLUMN "senha" SET DATA TYPE VARCHAR(60),
ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "admins_id_seq";

-- AlterTable
ALTER TABLE "boards" ADD COLUMN     "adminId" VARCHAR(36);

-- AlterTable
ALTER TABLE "logs" ADD COLUMN     "adminId" VARCHAR(36),
ALTER COLUMN "usuarioId" DROP NOT NULL,
ALTER COLUMN "usuarioId" SET DATA TYPE VARCHAR(36);

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "adminId" VARCHAR(36);

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boards" ADD CONSTRAINT "boards_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
