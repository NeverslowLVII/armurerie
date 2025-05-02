import type { NextApiRequest, NextApiResponse } from 'next';

interface RequestData {
  orderName: string;
}

// Define a basic interface for the expected message structure
interface DiscordMessage {
  id: string;
  content: string;
  embeds: Array<{ title?: string; description?: string }>;
  author: { bot?: boolean };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderName } = req.body as RequestData;

    if (!orderName) {
      return res.status(400).json({ error: 'Missing orderName' });
    }

    // Récupérer les variables d'environnement nécessaires pour Discord
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const channelId = process.env.DISCORD_CHANNEL_ID;

    if (!webhookUrl) {
      return res
        .status(500)
        .json({ error: 'Discord webhook URL not configured' });
    }

    // Si nous avons un token de bot et un ID de canal, essayer de trouver et supprimer le message de commande
    if (botToken && channelId) {
      try {
        // Récupérer les 100 derniers messages du canal
        const messagesResponse = await fetch(
          `https://discord.com/api/v10/channels/${channelId}/messages?limit=100`,
          {
            headers: {
              Authorization: `Bot ${botToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (messagesResponse.ok) {
          const messages = await messagesResponse.json();

          // Chercher le message contenant "Commande validée" et le nom de la commande
          const targetMessage = messages.find((msg: DiscordMessage) => {
            const content = msg.content.toLowerCase();
            return (
              content.includes('commande validée') &&
              content.includes(orderName.toLowerCase())
            );
          });

          if (targetMessage) {
            // Supprimer le message trouvé
            const deleteResponse = await fetch(
              `https://discord.com/api/v10/channels/${channelId}/messages/${targetMessage.id}`,
              {
                method: 'DELETE',
                headers: {
                  Authorization: `Bot ${botToken}`,
                },
              }
            );

            if (deleteResponse.ok) {
            } else {
              console.error(
                'Erreur lors de la suppression du message:',
                await deleteResponse.text()
              );
            }
          } else {
          }
        } else {
          console.error(
            'Erreur lors de la récupération des messages:',
            await messagesResponse.text()
          );
        }
      } catch (error) {
        console.error(
          'Erreur lors de la recherche/suppression du message Discord:',
          error
        );
      }
    }

    // Envoyer un message de confirmation quelle que soit l'issue de la suppression
    const messageContent = `✅ **Commande traitée**: La commande "${orderName}" a été traitée et ajoutée au système.`;

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: messageContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Discord webhook error:', errorText);
      return res.status(500).json({
        error: 'Failed to send Discord notification',
        details: errorText,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
