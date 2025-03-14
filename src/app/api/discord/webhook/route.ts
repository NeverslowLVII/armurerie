import { NextResponse } from 'next/server';

/**
 * Configuration pour le webhook Discord
 */
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

/**
 * POST /api/discord/webhook
 * 
 * Endpoint pour envoyer une notification Discord via webhook
 */
export async function POST(request: Request) {
  // Vérifier que l'URL du webhook est configurée
  if (!DISCORD_WEBHOOK_URL) {
    console.error('DISCORD_WEBHOOK_URL n\'est pas configuré dans les variables d\'environnement');
    return NextResponse.json({ success: false, error: 'Webhook URL not configured' }, { status: 500 });
  }

  try {
    // Récupérer les données du corps de la requête
    const data = await request.json();
    
    // Valider que les données nécessaires sont présentes
    if (!data.orderData || !data.username) {
      return NextResponse.json({ success: false, error: 'Missing required data' }, { status: 400 });
    }
    
    const { orderData, username } = data;
    
    // Créer un résumé de la commande
    let orderSummary = '';
    if (orderData.items && Array.isArray(orderData.items)) {
      orderSummary = orderData.items
        .map((item: any) => `- ${item.quantity}x ${item.name}`)
        .join('\n');
    }
    
    // Créer les données pour le webhook Discord
    const webhookData = {
      username: "Armurerie Bot",
      avatar_url: "https://i.imgur.com/4M34hi2.png",
      embeds: [
        {
          title: "Nouvelle commande validée",
          description: `Une commande a été validée par ${username}`,
          // La couleur verte (en décimal)
          color: Number.parseInt("2ECC71", 16),
          timestamp: new Date().toISOString(),
          fields: [
            {
              name: "Détails de la commande",
              value: orderSummary || "Aucun détail disponible",
            },
            {
              name: "Total",
              value: `${orderData.total || 0}$`,
              inline: true,
            },
            {
              name: "Profit",
              value: `${orderData.profit || 0}$`,
              inline: true,
            }
          ],
          footer: {
            text: "Système d'Armurerie",
          }
        }
      ]
    };
    
    // Envoyer la requête au webhook Discord
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    });
    
    // Vérifier la réponse
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur lors de l\'envoi du webhook Discord:', errorText);
      return NextResponse.json({ success: false, error: errorText }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Exception lors de l\'envoi du webhook Discord:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
} 