/*
 * Tests de la gestion des Employés
 * Ces tests illustrent les cas d'utilisation du module de gestion des employés.
 * Remplacer les appels fictifs par des appels réels aux services une fois implémentés.
 */
import { createEmployee, updateEmployee, deleteEmployee, getEmployee, Role } from "../services/api";
import nock from "nock";

beforeAll(() => { nock.disableNetConnect(); });

beforeEach(() => {
  nock.cleanAll();
});

describe("Gestion des Employés", () => {
    it("doit ajouter un employé", async () => {
         const newEmployee = {
              name: "Dupont",
              color: "bleu",
              role: Role.CO_PATRON
         };
         nock("http://localhost:3000")
           .post("/api/employees", newEmployee)
           .reply(201, { ...newEmployee, id: 1 });
         const createdEmployee = await createEmployee(newEmployee);
         expect(createdEmployee).toHaveProperty("name", "Dupont");
    });

    it("doit modifier un employé", async () => {
         const newEmployee = {
             name: "Dupont",
             color: "bleu",
             role: Role.CO_PATRON
         };
         nock("http://localhost:3000")
           .post("/api/employees", newEmployee)
           .reply(201, { ...newEmployee, id: 1 });
         const createdEmployee = await createEmployee(newEmployee);
         const updatedData = {
             name: createdEmployee.name,
             role: Role.EMPLOYEE,
             ...(createdEmployee.color !== null ? { color: createdEmployee.color } : {})
         };
         nock("http://localhost:3000")
           .put("/api/employees/1", updatedData)
           .reply(200, { ...updatedData, id: 1 });
         const updatedEmployee = await updateEmployee(createdEmployee.id, updatedData);
         expect(updatedEmployee.role).not.toEqual(createdEmployee.role);
    });

    it("doit supprimer un employé", async () => {
         const newEmployee = {
             name: "Dupont",
             color: "bleu",
             role: Role.CO_PATRON
         };
         nock("http://localhost:3000")
           .post("/api/employees", newEmployee)
           .reply(201, { ...newEmployee, id: 1 });
         const createdEmployee = await createEmployee(newEmployee);
         nock("http://localhost:3000")
           .delete("/api/employees/1")
           .reply(204);
         nock("http://localhost:3000")
           .get("/api/employees/1")
           .reply(404);
         await deleteEmployee(createdEmployee.id);
         await expect(getEmployee(createdEmployee.id)).rejects.toMatchObject({ response: { status: 404 } });
    });
}); 