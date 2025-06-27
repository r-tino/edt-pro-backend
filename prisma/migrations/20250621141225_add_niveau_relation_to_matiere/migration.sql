/*
  Warnings:

  - A unique constraint covering the columns `[nom,niveauId]` on the table `Matiere` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nom,departementId]` on the table `Niveau` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `niveauId` to the `Matiere` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Matiere_nom_key";

-- AlterTable
ALTER TABLE "Matiere" ADD COLUMN     "niveauId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Matiere_nom_niveauId_key" ON "Matiere"("nom", "niveauId");

-- CreateIndex
CREATE UNIQUE INDEX "Niveau_nom_departementId_key" ON "Niveau"("nom", "departementId");

-- AddForeignKey
ALTER TABLE "Matiere" ADD CONSTRAINT "Matiere_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "Niveau"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
