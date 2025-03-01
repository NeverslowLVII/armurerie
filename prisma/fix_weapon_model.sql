-- Supprimer la contrainte de clé étrangère sur employe_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'Weapon_employe_id_fkey'
        AND table_name = 'Weapon'
    ) THEN
        ALTER TABLE "Weapon" DROP CONSTRAINT "Weapon_employe_id_fkey";
    END IF;
END
$$;

-- Supprimer la colonne employe_id si elle existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Weapon'
        AND column_name = 'employe_id'
    ) THEN
        ALTER TABLE "Weapon" DROP COLUMN "employe_id";
    END IF;
END
$$; 