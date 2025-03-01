-- Ajouter DEVELOPER à l'enum Role s'il n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'Role'
        AND e.enumlabel = 'DEVELOPER'
    ) THEN
        ALTER TYPE "Role" ADD VALUE 'DEVELOPER';
    END IF;
END
$$; 