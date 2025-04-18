/**
 * Discord Webhook Utilities
 *
 * Ce fichier contient des fonctions utilitaires pour envoyer des notifications
 * via des webhooks Discord.
 */

// Webhook URL pour les logs de modifications d'armes
const WEAPON_LOGS_WEBHOOK_URL =
  'https://discordapp.com/api/webhooks/1358560402925162617/9AjQcFgVWsX3f4CxBhMDSTZ9Ys0b8yIuFfoxUwgBhzKvXUjp7PaXqfTZRyFb5lNO_zhJ';

/**
 * Envoie une notification de validation de commande via l'API
 *
 * @param commandData Les données de la commande
 * @param username Le nom d'utilisateur qui a validé la commande
 * @returns Promise<boolean> Indique si l'envoi a réussi
 */
export async function notifyOrderValidation(commandData: any, username: string): Promise<boolean> {
  try {
    const response = await fetch('/api/discord/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderData: commandData,
        username,
      }),
    });

    if (!response.ok) {
      console.error("Erreur lors de l'envoi du webhook Discord:", await response.text());
      return false;
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Exception lors de l'envoi du webhook Discord:", error);
    return false;
  }
}

/**
 * Envoie une notification de modification d'arme directement vers Discord
 *
 * @param weaponData Les données de l'arme modifiée
 * @param username Le nom d'utilisateur qui a effectué la modification
 * @param action Le type d'action effectuée ('create', 'update' ou 'delete')
 * @param previousData Les données précédentes de l'arme (pour les mises à jour)
 * @returns Promise<boolean> Indique si l'envoi a réussi
 */
export async function logWeaponModification(
  weaponData: any,
  username: string,
  action: 'create' | 'update' | 'delete',
  previousData?: any
): Promise<boolean> {
  try {
    // Déterminer la couleur en fonction de l'action
    const colorMap = {
      create: 3_066_993, // Vert
      update: 15_970_322, // Orange
      delete: 15_158_332, // Rouge
    };

    // Créer le titre en fonction de l'action
    const titleMap = {
      create: 'Nouvelle arme créée',
      update: 'Arme modifiée',
      delete: 'Arme supprimée',
    };

    // Fonction d'aide pour formater les prix de centimes en dollars
    const formatPrice = (priceInCents: number | undefined): string => {
      if (priceInCents === undefined) return 'Non spécifié';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(priceInCents / 100);
    };

    // Préparer les champs pour l'embed
    const fields = [
      {
        name: 'Nom',
        value: weaponData.name || 'Non spécifié',
        inline: true,
      },
      {
        name: 'Modèle',
        value: weaponData.model || 'Non spécifié',
        inline: true,
      },
    ];

    // Ajouter des champs de prix et de bénéfice si disponibles
    if (weaponData.price !== undefined) {
      fields.push({
        name: 'Prix',
        value: formatPrice(weaponData.price),
        inline: true,
      });
    }

    if (weaponData.cost !== undefined && weaponData.price !== undefined) {
      const profit = weaponData.price - weaponData.cost;
      fields.push({
        name: 'Bénéfice',
        value: formatPrice(profit),
        inline: true,
      });
    }

    // Pour les mises à jour, ajouter un résumé des changements
    if (action === 'update' && previousData) {
      const changes = [];

      // Comparer les champs importants et noter les différences
      const fieldsToCompare = ['name', 'model', 'description'];
      for (const field of fieldsToCompare) {
        if (weaponData[field] !== previousData[field]) {
          changes.push(
            `**${field}**: ${previousData[field] || 'Non défini'} → ${weaponData[field] || 'Non défini'}`
          );
        }
      }

      // Traitement spécial pour les champs numériques (prix, coût)
      if (weaponData.price !== previousData.price) {
        changes.push(
          `**price**: ${formatPrice(previousData.price)} → ${formatPrice(weaponData.price)}`
        );
      }

      if (weaponData.cost !== previousData.cost) {
        changes.push(
          `**cost**: ${formatPrice(previousData.cost)} → ${formatPrice(weaponData.cost)}`
        );
      }

      if (changes.length > 0) {
        fields.push({
          name: 'Modifications',
          value: changes.join('\n'),
          inline: false,
        });
      }
    }

    // Créer les données pour le webhook Discord
    const webhookData = {
      username: "Système d'Armurerie",
      embeds: [
        {
          title: titleMap[action],
          description: `Action effectuée par ${username}`,
          color: colorMap[action],
          timestamp: new Date().toISOString(),
          fields,
          footer: {
            text: "Système de logs d'armes",
          },
        },
      ],
    };

    // Envoyer la requête directement au webhook Discord
    const response = await fetch(WEAPON_LOGS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    });

    // Vérifier la réponse
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur lors de l'envoi du log d'arme:", errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception lors de l'envoi du log d'arme:", error);
    return false;
  }
}
