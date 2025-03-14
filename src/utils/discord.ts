/**
 * Discord Webhook Utilities
 * 
 * Ce fichier contient des fonctions utilitaires pour envoyer des notifications 
 * via des webhooks Discord.
 */

/**
 * Envoie une notification de validation de commande via l'API
 * 
 * @param commandData Les données de la commande
 * @param username Le nom d'utilisateur qui a validé la commande
 * @returns Promise<boolean> Indique si l'envoi a réussi
 */
export async function notifyOrderValidation(
  commandData: any, 
  username: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/discord/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderData: commandData,
        username
      }),
    });

    if (!response.ok) {
      console.error('Erreur lors de l\'envoi du webhook Discord:', await response.text());
      return false;
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Exception lors de l\'envoi du webhook Discord:', error);
    return false;
  }
} 