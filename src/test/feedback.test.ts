import axios from "../services/api";
import nock from "nock";

/*
 * Tests pour le système de Feedback
 * Ces tests illustrent le processus de soumission et de gestion des retours d'information.
 */
describe("Feedback", () => {
  it("devrait soumettre un feedback valide", async () => {
    const validFeedback = { 
      utilisateur: "user@example.com", 
      commentaire: "Super application!", 
      note: 5 
    };
    nock("http://localhost:3000")
      .post("/api/feedback", validFeedback)
      .reply(200, validFeedback);
    const response = await axios.post("/feedback", validFeedback);
    const createdFeedback = response.data;
    expect(createdFeedback.commentaire).toBeTruthy();
    expect(createdFeedback.note).toBeGreaterThanOrEqual(1);
    expect(createdFeedback.note).toBeLessThanOrEqual(5);
  });

  it("ne devrait pas soumettre un feedback vide", async () => {
    const invalidFeedback = { 
      utilisateur: "user@example.com", 
      commentaire: "", 
      note: 3 
    };
    nock("http://localhost:3000")
      .post("/api/feedback", invalidFeedback)
      .reply(400);
    
    try {
      await axios.post("/feedback", invalidFeedback);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        expect(error.response?.status).toBe(400);
      } else {
        throw new Error('Expected Axios error');
      }
    }
  });
}); 