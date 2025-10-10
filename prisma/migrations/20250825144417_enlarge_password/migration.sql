-- DropIndex
DROP INDEX "usuarios_email_key";

-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "senha" SET DATA TYPE VARCHAR(60);
