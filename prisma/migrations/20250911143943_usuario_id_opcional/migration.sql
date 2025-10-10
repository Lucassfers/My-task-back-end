/*
  Warnings:

  - You are about to drop the column `ordem` on the `listas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."comentarios" ADD COLUMN     "usuarioId" TEXT;

-- AlterTable
ALTER TABLE "public"."listas" DROP COLUMN "ordem";

-- AddForeignKey
ALTER TABLE "public"."comentarios" ADD CONSTRAINT "comentarios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
