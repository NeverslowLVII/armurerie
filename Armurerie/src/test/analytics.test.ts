import axios from "../services/api";
import nock from "nock";

beforeEach(() => {
  nock.cleanAll();
});

/*
 * Tests pour les Statistiques et Analytics
 * Ces tests illustrent la récupération des données statistiques importantes pour l'analyse des ventes et des performances.
 */
describe("Statistiques et Analytics", () => {
  it("doit récupérer les statistiques globales", async () => {
    nock("http://localhost:3000")
      .get("/api/analytics")
      .reply(200, { ventes: 150, rentabilite: 80, clients: 50 });
    const response = await axios.get("/analytics");
    const stats = response.data;
    expect(stats).toHaveProperty("ventes");
    expect(stats.ventes).toBeGreaterThan(0);
  });

  it("doit générer un rapport des ventes", async () => {
    nock("http://localhost:3000")
      .get("/api/analytics/report")
      .reply(200, { periode: "2023-Q4", ventes: 123, details: [] });
    const response = await axios.get("/analytics/report");
    const rapport = response.data;
    expect(rapport).toHaveProperty("periode");
    expect(rapport.details).toBeInstanceOf(Array);
  });

  it("doit gérer une erreur lors de la récupération des statistiques globales", async () => {
    nock("http://localhost:3000")
      .get("/api/analytics")
      .reply(500);
    await expect(axios.get("/analytics")).rejects.toMatchObject({ response: { status: 500 } });
  });

  it("doit gérer une erreur lors de la génération du rapport des ventes", async () => {
    nock("http://localhost:3000")
      .get("/api/analytics/report")
      .reply(500);
    await expect(axios.get("/analytics/report")).rejects.toMatchObject({ response: { status: 500 } });
  });
}); 