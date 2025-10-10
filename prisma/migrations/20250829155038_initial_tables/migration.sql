/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
CREATE SEQUENCE "public".listas_ordem_seq;
ALTER TABLE "public"."listas" ALTER COLUMN "ordem" SET DEFAULT nextval('"public".listas_ordem_seq');
ALTER SEQUENCE "public".listas_ordem_seq OWNED BY "public"."listas"."ordem";

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "public"."usuarios"("email");
