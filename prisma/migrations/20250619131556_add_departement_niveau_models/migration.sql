/*
  Warnings:

  - The values [STANDARD,SURVEILLANT] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `classeId` on the `Etudiant` table. All the data in the column will be lost.
  - You are about to drop the column `classeId` on the `Seance` table. All the data in the column will be lost.
  - You are about to drop the `Classe` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Surveillant` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `niveauId` to the `Seance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'ENSEIGNANT', 'ETUDIANT');
ALTER TABLE "Utilisateur" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Etudiant" DROP CONSTRAINT "Etudiant_classeId_fkey";

-- DropForeignKey
ALTER TABLE "Seance" DROP CONSTRAINT "Seance_classeId_fkey";

-- DropForeignKey
ALTER TABLE "Surveillant" DROP CONSTRAINT "Surveillant_utilisateurId_fkey";

-- DropIndex
DROP INDEX "Seance_classeId_idx";

-- AlterTable
ALTER TABLE "Etudiant" DROP COLUMN "classeId",
ADD COLUMN     "niveauId" TEXT;

-- AlterTable
ALTER TABLE "Seance" DROP COLUMN "classeId",
ADD COLUMN     "niveauId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Classe";

-- DropTable
DROP TABLE "Surveillant";

-- CreateTable
CREATE TABLE "Niveau" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "departementId" TEXT NOT NULL,

    CONSTRAINT "Niveau_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Departement" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "Departement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Departement_nom_key" ON "Departement"("nom");

-- CreateIndex
CREATE INDEX "Seance_niveauId_idx" ON "Seance"("niveauId");

-- AddForeignKey
ALTER TABLE "Etudiant" ADD CONSTRAINT "Etudiant_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "Niveau"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Niveau" ADD CONSTRAINT "Niveau_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES "Departement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seance" ADD CONSTRAINT "Seance_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "Niveau"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
