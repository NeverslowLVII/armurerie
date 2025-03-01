-- Ajouter la colonne cout_production à la table Weapon s'il n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Weapon'
        AND column_name = 'cout_production'
    ) THEN
        ALTER TABLE "Weapon" ADD COLUMN "cout_production" INTEGER NOT NULL DEFAULT 0;
    END IF;
END
$$; 