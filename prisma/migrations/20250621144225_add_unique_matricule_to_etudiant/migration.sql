/*
  Warnings:

  - A unique constraint covering the columns `[matricule]` on the table `Etudiant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Etudiant_matricule_key" ON "Etudiant"("matricule");
