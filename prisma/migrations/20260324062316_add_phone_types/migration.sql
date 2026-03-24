-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "telephoneFixe" TEXT,
ADD COLUMN     "telephonePortable" TEXT;

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "telephoneFixe" TEXT,
ADD COLUMN     "telephonePortable" TEXT;
