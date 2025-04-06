-- Ajouter la colonne bp à la table Weapon s'il n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Weapon'
        AND column_name = 'bp'
    ) THEN
        ALTER TABLE "Weapon" ADD COLUMN "bp" TEXT;
    END IF;
END
$$; 