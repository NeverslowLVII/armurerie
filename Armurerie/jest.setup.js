/* jest.setup.js */

// Utilisation de require pour respecter la syntaxe CommonJS
const axios = require('axios');

// Override global JSON.stringify to handle circular references using a replacer function
const originalStringify = JSON.stringify;
const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return; // Omettre la référence circulaire
      }
      seen.add(value);
    }
    return value;
  };
};
JSON.stringify = (value, replacer, space) =>
  originalStringify(value, replacer || getCircularReplacer(), space);

// Override Error.prototype.toJSON unconditionally to avoid circular references
// Cette simplification ne retourne que le message de l'erreur
Error.prototype.toJSON = function () {
  return { message: this.message };
};

// Ajout d'un interceptor axios pour nettoyer les erreurs et supprimer les références circulaires
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const sanitizedError = new Error(error.message);
      sanitizedError.isAxiosError = true;
      if (error.response) {
        sanitizedError.response = {
          status: error.response.status,
          data: error.response.data,
        };
      }
      return Promise.reject(sanitizedError);
    }
    return Promise.reject(error);
  }
); 