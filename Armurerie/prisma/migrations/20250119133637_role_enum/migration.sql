/*
  Warnings:

  - The `role` column on the `Employee` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'CO_PATRON', 'PATRON');

-- AlterTable
-- First, create a temporary column for the new enum
ALTER TABLE "Employee" ADD COLUMN "role_new" "Role";

-- Update the temporary column with the corresponding enum values
UPDATE "Employee" 
SET "role_new" = CASE 
    WHEN "role" = 'EMPLOYEE' THEN 'EMPLOYEE'::"Role"
    WHEN "role" = 'CO_PATRON' THEN 'CO_PATRON'::"Role"
    WHEN "role" = 'PATRON' THEN 'PATRON'::"Role"
    ELSE 'EMPLOYEE'::"Role"
END;

-- Drop the old column and rename the new one
ALTER TABLE "Employee" DROP COLUMN "role";
ALTER TABLE "Employee" RENAME COLUMN "role_new" TO "role";

-- Add NOT NULL constraint and default value
ALTER TABLE "Employee" ALTER COLUMN "role" SET NOT NULL;
ALTER TABLE "Employee" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE'::"Role";
