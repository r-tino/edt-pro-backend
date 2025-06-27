/*
  Warnings:

  - You are about to drop the column `matiereId` on the `Enseignant` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Enseignant_matiereId_idx";

-- AlterTable
ALTER TABLE "Enseignant" DROP COLUMN "matiereId";
