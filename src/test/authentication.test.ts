/// <reference types="jest" />
import axios from "../services/api";
import nock from "nock";

/*
 * Tests pour l'Authentification
 * Ces tests illustrent le processus d'authentification utilisateur.
 * Simule l'authentification d'un utilisateur valide et invalide.
 */
describe("Authentification", () => {
  it("doit authentifier un utilisateur valide", async () => {
    const utilisateur = { email: "user@example.com", motDePasse: "correct_password" };
    nock("http://localhost:3000")
      .post("/api/auth/login", utilisateur)
      .reply(200, { token: "dummy_token" });
    const response = await axios.post("/auth/login", utilisateur);
    const token = response.data.token;
    expect(token).toBeDefined();
  });

  it("ne doit pas authentifier un utilisateur invalide", async () => {
    expect.assertions(1);
    const utilisateur = { email: "user@example.com", motDePasse: "wrong_password" };
    nock("http://localhost:3000")
      .post("/api/auth/login", utilisateur)
      .reply(401);
    try {
      await axios.post("/auth/login", utilisateur);
      throw new Error("Expected request to fail");
    } catch (error) {
      const sanitized = { message: (error as any).message };
      expect(sanitized.message).toContain("401");
    }
  });
}); 