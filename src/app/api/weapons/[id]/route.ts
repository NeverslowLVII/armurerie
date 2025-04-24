import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  handleGetById,
  withErrorHandling,
  validateId,
  parseRequestBody,
  createCorsOptionsResponse,
} from '@/utils/api/crud-handlers';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  return handleGetById(
    params,
    async id => {
      return prisma.weapon.findUnique({
        where: { id },
        include: {
          user: true,
          base_weapon: true,
        },
      });
    },
    'Weapon'
  );
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await withErrorHandling(async () => {
    const [isValid, idOrNull, errorResponse] = validateId(params.id);
    if (!isValid || idOrNull === null) return errorResponse;
    
    const id = idOrNull; // Now TypeScript knows id is not null

    const [data, parseError] = await parseRequestBody<any>(request);
    if (parseError) return parseError;

    console.log('Update weapon data received:', data);

    try {
      const baseWeapon = await prisma.baseWeapon.findUnique({
        where: { nom: data.nom_arme },
      });

      if (!baseWeapon) {
        return NextResponse.json(
          { error: 'Base weapon not found', nom_arme: data.nom_arme },
          { status: 404 }
        );
      }

      const weapon = await prisma.weapon.update({
        where: { id },
        data: {
          ...(data.horodateur && { horodateur: new Date(data.horodateur) }),
          ...(data.detenteur && { detenteur: data.detenteur }),
          ...(data.bp !== undefined && { bp: data.bp }),
          ...(data.serigraphie && { serigraphie: data.serigraphie }),
          ...(data.prix && { prix: data.prix }),
          ...(data.user_id && {
            user: {
              connect: { id: Number.parseInt(data.user_id) },
            },
          }),
          base_weapon: {
            connect: { nom: data.nom_arme },
          },
        },
        include: {
          user: true,
          base_weapon: true,
        },
      });

      return NextResponse.json(weapon);
    } catch (error) {
      console.error('Prisma update error:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      return NextResponse.json(
        {
          error: 'Failed to update weapon',
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  });
  
  // Ensure we always return a Response
  return result || NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await withErrorHandling(async () => {
    const [isValid, idOrNull, errorResponse] = validateId(params.id);
    if (!isValid || idOrNull === null) return errorResponse;
    
    const id = idOrNull; // Now TypeScript knows id is not null

    console.log('Deleting weapon with ID:', id);

    // Récupérer les données envoyées dans le corps de la requête (si disponibles)
    let bodyData: { username?: string; weaponData?: any } = {};
    try {
      bodyData = await request.json();
    } catch {
      // Pas de corps de requête, ce n'est pas grave
    }

    const weapon = await prisma.weapon.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!weapon) {
      return NextResponse.json({ error: 'Weapon not found', id }, { status: 404 });
    }

    // Supprimer l'arme de la base de données
    await prisma.weapon.delete({
      where: { id },
    });

    console.log('Weapon deleted successfully:', id);

    // Si des données sont disponibles, envoyer une notification Discord
    if (bodyData.weaponData && bodyData.username) {
      try {
        // Importer la fonction de log Discord
        const { logWeaponModification } = await import('@/utils/discord');

        // Envoyer la notification
        await logWeaponModification(bodyData.weaponData, bodyData.username, 'delete');

        console.log('Discord notification sent for weapon deletion');
      } catch (discordError) {
        // Logger l'erreur mais ne pas faire échouer la suppression
        console.error('Failed to send Discord notification:', discordError);
      }
    } else if (weapon) {
      // Si pas de données spécifiques mais qu'on a l'arme, utiliser ces données
      try {
        const { logWeaponModification } = await import('@/utils/discord');

        const userName = weapon.user ? weapon.user.name : 'Utilisateur inconnu';

        await logWeaponModification(
          {
            name: weapon.nom_arme,
            model: weapon.nom_arme,
            price: weapon.prix,
            cost: weapon.cout_production,
            description: weapon.serigraphie,
          },
          userName,
          'delete'
        );

        console.log('Discord notification sent for weapon deletion (fallback data)');
      } catch (discordError) {
        console.error('Failed to send Discord notification with fallback data:', discordError);
      }
    }

    return NextResponse.json({ success: true });
  });
  
  // Ensure we always return a Response
  return result || NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
}

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return createCorsOptionsResponse();
}
