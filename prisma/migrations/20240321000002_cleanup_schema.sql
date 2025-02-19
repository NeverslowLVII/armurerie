-- Drop old auth-related tables
DROP TABLE IF EXISTS "Developer";
DROP TABLE IF EXISTS "Employee";

-- Update the Role enum
ALTER TYPE "Role" ADD VALUE 'DEVELOPER' AFTER 'EMPLOYEE';

-- Rename columns to match new schema
ALTER TABLE "Weapon" RENAME COLUMN employe_id TO user_id;
ALTER TABLE "Feedback" RENAME COLUMN submittedBy TO user_id;

-- Update foreign key constraints
ALTER TABLE "Weapon" 
DROP CONSTRAINT IF EXISTS "Weapon_employe_id_fkey",
ADD CONSTRAINT "Weapon_user_id_fkey" 
    FOREIGN KEY ("user_id") 
    REFERENCES "User"("id") 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE;

ALTER TABLE "Feedback"
DROP CONSTRAINT IF EXISTS "Feedback_submittedBy_fkey",
ADD CONSTRAINT "Feedback_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "User"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE; 