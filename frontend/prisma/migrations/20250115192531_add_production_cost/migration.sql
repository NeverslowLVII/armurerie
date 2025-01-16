/*
  Warnings:

  - You are about to drop the column `cout_production` on the `Weapon` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BaseWeapon" ADD COLUMN     "cout_production_defaut" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Weapon" DROP COLUMN "cout_production";
