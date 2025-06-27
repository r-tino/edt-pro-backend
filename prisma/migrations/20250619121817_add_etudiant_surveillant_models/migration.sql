-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'ETUDIANT';
ALTER TYPE "Role" ADD VALUE 'SURVEILLANT';

-- CreateTable
CREATE TABLE "Etudiant" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "matricule" TEXT,
    "classeId" TEXT,

    CONSTRAINT "Etudiant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Surveillant" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "specialite" TEXT,

    CONSTRAINT "Surveillant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Etudiant_utilisateurId_key" ON "Etudiant"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "Surveillant_utilisateurId_key" ON "Surveillant"("utilisateurId");

-- AddForeignKey
ALTER TABLE "Etudiant" ADD CONSTRAINT "Etudiant_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Etudiant" ADD CONSTRAINT "Etudiant_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Surveillant" ADD CONSTRAINT "Surveillant_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
