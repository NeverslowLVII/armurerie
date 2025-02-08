import nock from "nock";
import {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployee,
  createWeapon,
  updateWeapon,
  deleteWeapon,
  getWeapon,
  Role
} from "../services/api";

describe("API Service Coverage", () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe("Employee functions", () => {
    const employee = { name: "Test", color: "red", role: Role.EMPLOYEE };

    it("createEmployee success", async () => {
      nock("http://localhost:3000")
        .post("/api/employees", employee)
        .reply(201, { ...employee, id: 1 });
      const result = await createEmployee(employee);
      expect(result.id).toBe(1);
    });

    it("createEmployee failure", async () => {
      nock("http://localhost:3000")
        .post("/api/employees", employee)
        .reply(500);
      await expect(createEmployee(employee)).rejects.toMatchObject({ response: { status: 500 } });
    });

    it("updateEmployee success", async () => {
      const updated = { name: "Test Updated", color: "blue", role: Role.EMPLOYEE };
      nock("http://localhost:3000")
        .put("/api/employees/1", updated)
        .reply(200, { ...updated, id: 1 });
      const res = await updateEmployee(1, updated);
      expect(res.name).toBe("Test Updated");
    });

    it("updateEmployee failure", async () => {
      const updated = { name: "Test Updated", color: "blue", role: Role.EMPLOYEE };
      nock("http://localhost:3000")
        .put("/api/employees/1", updated)
        .reply(500);
      await expect(updateEmployee(1, updated)).rejects.toMatchObject({ response: { status: 500 } });
    });

    it("deleteEmployee success", async () => {
      nock("http://localhost:3000")
        .delete("/api/employees/1")
        .reply(204);
      const res = await deleteEmployee(1);
      expect(res).toBeUndefined();
    });

    it("getEmployee failure", async () => {
      nock("http://localhost:3000")
        .get("/api/employees/1")
        .reply(404);
      await expect(getEmployee(1)).rejects.toMatchObject({ response: { status: 404 } });
    });
  });

  describe("Weapon functions", () => {
    const weapon = {
      horodateur: new Date().toISOString(),
      employe_id: 1,
      detenteur: "Test",
      nom_arme: "Fusil",
      serigraphie: "Standard",
      prix: 1000,
      cout_production: 500
    };

    it("createWeapon success", async () => {
      nock("http://localhost:3000")
        .post("/api/weapons", weapon)
        .reply(201, { ...weapon, id: 1 });
      const result = await createWeapon(weapon);
      expect(result.id).toBe(1);
    });

    it("createWeapon failure", async () => {
      nock("http://localhost:3000")
        .post("/api/weapons", weapon)
        .reply(400);
      await expect(createWeapon(weapon)).rejects.toThrow(/Données invalides/);
    });

    it("updateWeapon success", async () => {
      const updated = { ...weapon, prix: 1100 };
      nock("http://localhost:3000")
        .put("/api/weapons/1", updated)
        .reply(200, { ...updated, id: 1 });
      const res = await updateWeapon(1, updated);
      expect(res.prix).toBe(1100);
    });

    it("updateWeapon failure", async () => {
      const updated = { ...weapon, prix: 1100 };
      nock("http://localhost:3000")
        .put("/api/weapons/1", updated)
        .reply(500);
      await expect(updateWeapon(1, updated)).rejects.toMatchObject({ response: { status: 500 } });
    });

    it("deleteWeapon success", async () => {
      nock("http://localhost:3000")
        .delete("/api/weapons/1")
        .reply(204);
      const res = await deleteWeapon(1);
      expect(res).toBeUndefined();
    });

    it("getWeapon failure", async () => {
      nock("http://localhost:3000")
        .get("/api/weapons/1")
        .reply(404);
      await expect(getWeapon(1)).rejects.toMatchObject({ response: { status: 404 } });
    });
  });
}); 