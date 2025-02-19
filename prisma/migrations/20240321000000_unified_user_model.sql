-- Create the new User table
CREATE TABLE "User" (
    "id" SERIAL PRIMARY KEY,
    "email" TEXT UNIQUE,
    "username" TEXT UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "color" TEXT,
    "contractUrl" TEXT,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Migrate existing employees to users
INSERT INTO "User" (
    "email",
    "password",
    "name",
    "role",
    "color",
    "contractUrl",
    "lastLogin",
    "createdAt",
    "updatedAt"
)
SELECT 
    "email",
    "password",
    "name",
    "role",
    "color",
    "contractUrl",
    "lastLogin",
    "createdAt",
    "updatedAt"
FROM "Employee";

-- Migrate existing developers to users
INSERT INTO "User" (
    "username",
    "password",
    "name",
    "role",
    "email",
    "createdAt",
    "updatedAt"
)
SELECT 
    "username",
    "password",
    "name",
    'DEVELOPER',
    CONCAT("username", '@company.com'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Developer";

-- Update foreign key references in Weapon table
ALTER TABLE "Weapon" 
DROP CONSTRAINT "Weapon_employe_id_fkey",
ADD CONSTRAINT "Weapon_employe_id_fkey" 
    FOREIGN KEY ("employe_id") 
    REFERENCES "User"("id") 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE;

-- Update foreign key references in Feedback table
ALTER TABLE "Feedback"
DROP CONSTRAINT "Feedback_submittedBy_fkey",
ADD CONSTRAINT "Feedback_submittedBy_fkey"
    FOREIGN KEY ("submittedBy")
    REFERENCES "User"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- Drop old tables
DROP TABLE "Employee";
DROP TABLE "Developer"; 