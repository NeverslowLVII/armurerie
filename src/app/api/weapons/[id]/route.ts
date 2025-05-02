import { prisma } from '@/lib/prisma';
import {
  createCorsOptionsResponse,
  handleGetById,
  parseRequestBody,
  validateId,
  withErrorHandling,
} from '@/utils/api/crud-handlers';
import { type NextRequest, NextResponse } from 'next/server';

// Define interface for PUT request body
interface WeaponUpdateBody {
  nom_arme: string;
  horodateur?: string;
  detenteur?: string;
  bp?: string | null;
  serigraphie?: string;
  prix?: number;
  user_id?: string | number;
}

// Define interface for DELETE request body
interface WeaponDeleteBody {
  username?: string;
  weaponData?: WeaponUpdateBody; // Can reuse or define a specific one
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const [isValid, idOrNull, errorResponse] = validateId(resolvedParams.id);

    // Explicitly check for errorResponse and return it if present
    if (!isValid || idOrNull === null) {
      // If errorResponse is null (shouldn't happen if !isValid), return a generic error
      return errorResponse ?? NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const id = idOrNull; // id is guaranteed to be a number here

    const weapon = await prisma.weapon.findUnique({
      where: { id },
      include: {
        user: true,
        base_weapon: true,
      },
    });

    if (!weapon) {
      return NextResponse.json({ error: 'Weapon not found' }, { status: 404 });
    }

    return NextResponse.json(weapon);

  } catch (error) {
    console.error('GET /api/weapons/[id] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weapon' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const result = await withErrorHandling(async () => {
    // Await params before using it
    const resolvedParams = await context.params;
    const [isValid, idOrNull, errorResponse] = validateId(resolvedParams.id);
    if (!isValid || idOrNull === null) {
      // If errorResponse is null, return a generic error
      return errorResponse ?? NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const id = idOrNull; // Now TypeScript knows id is not null

    // Use defined interface for parsing request body
    const [data, parseError] =
      await parseRequestBody<WeaponUpdateBody>(request);
    if (parseError) return parseError;
    // Assert data is not null after checking parseError
    if (!data) {
      return NextResponse.json(
        { error: 'Invalid request body data' },
        { status: 400 }
      );
    }

    console.info('Update weapon data received:', data);

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
              connect: { id: Number.parseInt(String(data.user_id)) },
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
  return (
    result ||
    NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 })
  );
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const result = await withErrorHandling(async () => {
    // Await params before using it
    const resolvedParams = await context.params;
    const [isValid, idOrNull, errorResponse] = validateId(resolvedParams.id);
    if (!isValid || idOrNull === null) {
      // If errorResponse is null, return a generic error
      return errorResponse ?? NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const id = idOrNull; // Now TypeScript knows id is not null

    console.info('Deleting weapon with ID:', id);

    // Use defined interface for request body
    let bodyData: WeaponDeleteBody = {};
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
      return NextResponse.json(
        { error: 'Weapon not found', id },
        { status: 404 }
      );
    }

    // Supprimer l'arme de la base de données
    await prisma.weapon.delete({
      where: { id },
    });

    console.info('Weapon deleted successfully:', id);

    // Si des données sont disponibles, envoyer une notification Discord
    if (bodyData.weaponData && bodyData.username) {
      try {
        // Importer la fonction de log Discord
        const { logWeaponModification } = await import('@/utils/discord');

        // Ensure weaponData has necessary fields (adjust as needed)
        const weaponLogData = {
          name: bodyData.weaponData.nom_arme ?? 'Inconnu',
          model: bodyData.weaponData.nom_arme ?? 'Inconnu',
          price: bodyData.weaponData.prix ?? 0,
          cost: 0, // Cost might not be in the delete request body
          description: bodyData.weaponData.serigraphie ?? '',
        };

        // Envoyer la notification
        await logWeaponModification(weaponLogData, bodyData.username, 'delete');

        console.info('Discord notification sent for weapon deletion');
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

        console.info(
          'Discord notification sent for weapon deletion (fallback data)'
        );
      } catch (discordError) {
        console.error(
          'Failed to send Discord notification with fallback data:',
          discordError
        );
      }
    }

    return NextResponse.json({ success: true });
  });

  // Ensure we always return a Response
  return (
    result ||
    NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 })
  );
}

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return createCorsOptionsResponse();
}
