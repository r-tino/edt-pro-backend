/*
  Warnings:

  - You are about to drop the column `jour` on the `Seance` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Seance" DROP COLUMN "jour";

-- DropEnum
DROP TYPE "Jour";
