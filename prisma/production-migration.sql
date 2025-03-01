-- Script de migration pour adapter les données de la production à la nouvelle structure
-- À exécuter sur la base de données de production

-- 1. Ajout des colonnes manquantes à la table User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "commission" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- 2. Vérification des contraintes et des index
-- S'assurer que tous les index nécessaires sont présents
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "BaseWeapon_nom_key" ON "BaseWeapon"("nom");
CREATE UNIQUE INDEX IF NOT EXISTS "Weapon_serigraphie_key" ON "Weapon"("serigraphie");

-- 3. Vérification des clés étrangères
-- S'assurer que toutes les clés étrangères sont correctement configurées
-- Note: Ces commandes ne feront rien si les contraintes existent déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Weapon_user_id_fkey' AND conrelid = 'Weapon'::regclass
    ) THEN
        ALTER TABLE "Weapon" ADD CONSTRAINT "Weapon_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Weapon_nom_arme_fkey' AND conrelid = 'Weapon'::regclass
    ) THEN
        ALTER TABLE "Weapon" ADD CONSTRAINT "Weapon_nom_arme_fkey" 
        FOREIGN KEY ("nom_arme") REFERENCES "BaseWeapon"("nom") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Feedback_user_id_fkey' AND conrelid = 'Feedback'::regclass
    ) THEN
        ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

-- 4. Mise à jour des données existantes si nécessaire
-- Par exemple, définir des valeurs par défaut pour les nouveaux champs
UPDATE "User" SET "commission" = 0 WHERE "commission" IS NULL; 