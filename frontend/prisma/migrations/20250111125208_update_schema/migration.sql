/*
  Warnings:

  - You are about to drop the column `prix` on the `BaseWeapon` table. All the data in the column will be lost.
  - You are about to drop the column `nom` on the `Employee` table. All the data in the column will be lost.
  - Added the required column `prix_defaut` to the `BaseWeapon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Employee` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BaseWeapon" DROP COLUMN "prix",
ADD COLUMN     "prix_defaut" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "nom",
ADD COLUMN     "color" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE';
