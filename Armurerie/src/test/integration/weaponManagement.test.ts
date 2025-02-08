import { createWeapon, updateWeapon, deleteWeapon, getWeapon } from "../../services/api";
import nock from "nock";

beforeEach(() => {
  nock.cleanAll();
});

/*
 * Tests de la gestion des Armes
 * Ces tests illustrent les cas d'utilisation du module de gestion des armes.
 */
describe("Gestion des Armes", () => {
    it("doit ajouter une arme", async () => {
         const newWeapon = { 
             horodateur: new Date().toISOString(),
             employe_id: 1,
             detenteur: "Test",
             nom_arme: "Fusil",
             serigraphie: "Standard",
             prix: 1000,
             cout_production: 500
         };
         nock("http://localhost:3000")
           .post("/api/weapons", newWeapon)
           .reply(201, { ...newWeapon, id: 1 });
         const createdWeapon = await createWeapon(newWeapon);
         expect(createdWeapon).toHaveProperty("nom_arme", "Fusil");
    });

    it("doit modifier une arme", async () => {
         const newWeapon = { 
             horodateur: new Date().toISOString(),
             employe_id: 1,
             detenteur: "Test",
             nom_arme: "Fusil",
             serigraphie: "Standard",
             prix: 1000,
             cout_production: 500
         };
         nock("http://localhost:3000")
           .post("/api/weapons", newWeapon)
           .reply(201, { ...newWeapon, id: 1 });
         const createdWeapon = await createWeapon(newWeapon);
         const updatedWeaponData = { 
             horodateur: new Date().toISOString(),
             employe_id: createdWeapon.employe_id,
             detenteur: createdWeapon.detenteur,
             nom_arme: createdWeapon.nom_arme,
             serigraphie: createdWeapon.serigraphie,
             prix: 1100,  // nouveau prix
             cout_production: createdWeapon.cout_production
         };
         nock("http://localhost:3000")
           .put("/api/weapons/1", updatedWeaponData)
           .reply(200, { ...updatedWeaponData, id: 1 });
         const updatedWeapon = await updateWeapon(createdWeapon.id, updatedWeaponData);
         expect(updatedWeapon.prix).toBeGreaterThan(createdWeapon.prix);
    });

    it("doit supprimer une arme", async () => {
         const newWeapon = { 
             horodateur: new Date().toISOString(),
             employe_id: 1,
             detenteur: "Test",
             nom_arme: "Fusil",
             serigraphie: "Standard",
             prix: 1000,
             cout_production: 500
         };
         nock("http://localhost:3000")
           .post("/api/weapons", newWeapon)
           .reply(201, { ...newWeapon, id: 1 });
         const createdWeapon = await createWeapon(newWeapon);
         nock("http://localhost:3000")
           .delete("/api/weapons/1")
           .reply(204);
         nock("http://localhost:3000")
           .get("/api/weapons/1")
           .reply(404);
         await deleteWeapon(createdWeapon.id);
         await expect(getWeapon(createdWeapon.id)).rejects.toMatchObject({ response: { status: 404 } });
    });
}); 