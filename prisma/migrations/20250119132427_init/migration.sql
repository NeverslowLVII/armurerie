-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BaseWeapon" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prix_defaut" INTEGER NOT NULL,
    "cout_production_defaut" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BaseWeapon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Weapon" (
    "id" SERIAL NOT NULL,
    "horodateur" TIMESTAMP(3) NOT NULL,
    "employe_id" INTEGER NOT NULL,
    "detenteur" TEXT NOT NULL,
    "nom_arme" TEXT NOT NULL,
    "serigraphie" TEXT NOT NULL,
    "prix" INTEGER NOT NULL,

    CONSTRAINT "Weapon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BaseWeapon_nom_key" ON "BaseWeapon"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Weapon_serigraphie_key" ON "Weapon"("serigraphie");

-- AddForeignKey
ALTER TABLE "Weapon" ADD CONSTRAINT "Weapon_employe_id_fkey" FOREIGN KEY ("employe_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Weapon" ADD CONSTRAINT "Weapon_nom_arme_fkey" FOREIGN KEY ("nom_arme") REFERENCES "BaseWeapon"("nom") ON DELETE RESTRICT ON UPDATE CASCADE;
