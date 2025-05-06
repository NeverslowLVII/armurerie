import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { type NextRequest, NextResponse } from 'next/server';

// Define an interface for the expected request body shape
interface WeaponPostBody {
  user_id: string | number;
  nom_arme: string;
  serigraphie: string;
  horodateur?: string;
  detenteur?: string;
  bp?: string;
  prix?: number;
  cout_production?: number;
}

export async function GET(request: NextRequest) {
  // Get page and pageSize from query parameters, with defaults
  const searchParams = request.nextUrl.searchParams;
  const page = Number.parseInt(searchParams.get('page') || '1');
  const pageSize = Number.parseInt(searchParams.get('pageSize') || '10'); // Default to 10 items per page

  // Validate parameters
  if (Number.isNaN(page) || page < 1) {
    return NextResponse.json({ error: 'Invalid page number' }, { status: 400 });
  }
  if (Number.isNaN(pageSize) || pageSize < 1 || pageSize > 1000) {
    return NextResponse.json(
      { error: 'Invalid page size (must be between 1 and 1000)' },
      { status: 400 }
    );
  }

  // Calculate skip and take for Prisma
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  try {
    // Use a transaction to get both paginated data and total count
    const [weapons, totalCount] = await prisma.$transaction([
      prisma.weapon.findMany({
        select: {
          id: true,
          horodateur: true,
          detenteur: true,
          bp: true,
          serigraphie: true,
          prix: true,
          cout_production: true,
          user_id: true,
          user: {
            select: {
              name: true,
              color: true,
              role: true,
            },
          },
          base_weapon: {
            select: {
              nom: true,
      },
          },
        },
        orderBy: {
          horodateur: 'desc',
        },
        skip: skip,
        take: take,
      }),
      prisma.weapon.count(), // Get the total count of weapons
    ]);

    // Mapper base_weapon.nom vers nom_arme pour correspondre au frontend
    const weaponsWithNomArme = weapons.map((weapon) => ({
      ...weapon,
      nom_arme: weapon.base_weapon?.nom || 'N/A', // Fournir une valeur par défaut si base_weapon est null
      base_weapon: undefined,
    }));

    // Return paginated data along with total count
    return NextResponse.json({
      weapons: weaponsWithNomArme,
      totalCount: totalCount,
      page: page,
      pageSize: pageSize,
    });
  } catch (error) {
    console.error('Get weapons error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weapons' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let data: WeaponPostBody;
  let userId: number;
  let baseWeapon: {
    prix_defaut: number;
    cout_production_defaut: number;
  } | null;
  // Initialize createWeaponData to null to satisfy linter
  let createWeaponData: Prisma.WeaponCreateInput | null = null;

  try {
    data = await request.json();
    console.info('Creating weapon with data:', JSON.stringify(data, null, 2));

    // Validate required fields
    if (!data.user_id || !data.nom_arme || !data.serigraphie) {
      const missing = [];
      if (!data.user_id) missing.push('user_id');
      if (!data.nom_arme) missing.push('nom_arme');
      if (!data.serigraphie) missing.push('serigraphie');

      console.error('Missing required fields:', missing);
      return NextResponse.json(
        { error: 'Missing required fields', missing, data },
        { status: 400 }
      );
    }

    // Parse user ID (ensure it's a string first)
    const userIdString = String(data.user_id);
    userId = Number.parseInt(userIdString);
    if (Number.isNaN(userId)) {
      console.error('Invalid user ID:', data.user_id);
      return NextResponse.json(
        { error: 'Invalid user ID', user_id: data.user_id },
        { status: 400 }
      );
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      console.error('User not found:', userId);
      return NextResponse.json(
        { error: 'User not found', user_id: userId },
        { status: 404 }
      );
    }

    // Find base weapon by name
    baseWeapon = await prisma.baseWeapon.findUnique({
      where: { nom: data.nom_arme },
    });
    if (!baseWeapon) {
      console.error('Base weapon not found:', data.nom_arme);
      return NextResponse.json(
        { error: 'Base weapon not found', nom_arme: data.nom_arme },
        { status: 404 }
      );
    }

    createWeaponData = {
      horodateur: data.horodateur ? new Date(data.horodateur) : new Date(),
      user: { connect: { id: userId } },
      detenteur: data.detenteur || '',
      bp: data.bp || null,
      // Connect base weapon by name
      base_weapon: { connect: { nom: data.nom_arme } },
      serigraphie: data.serigraphie,
      prix: data.prix ?? baseWeapon.prix_defaut,
      cout_production:
        data.cout_production ?? baseWeapon.cout_production_defaut,
    };

    // Create weapon
    const weapon = await prisma.weapon.create({
      data: createWeaponData,
      include: {
        user: true,
        base_weapon: true,
      },
    });

    console.info(
      'Weapon created successfully:',
      JSON.stringify(weapon, null, 2)
    );
    return NextResponse.json(weapon);
  } catch (error) {
    console.error('Create weapon error:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });

      // Handle ID sequence error
      if (
        error.message.includes(
          'Unique constraint failed on the fields: (`id`)'
        ) &&
        createWeaponData
      ) {
        try {
          // Get the maximum ID
          const maxId = await prisma.weapon.findFirst({
            orderBy: { id: 'desc' },
            select: { id: true },
          });

          // Reset the sequence to max + 1
          await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Weapon"', 'id'), ${maxId ? maxId.id + 1 : 1}, false);`;

          // Ensure createWeaponData is defined before retry
          if (!createWeaponData) {
            throw new Error(
              'Create weapon data is undefined after sequence reset'
            );
          }

          // Retry the creation
          const weapon = await prisma.weapon.create({
            data: createWeaponData,
            include: {
              user: true,
              base_weapon: true,
            },
          });
          return NextResponse.json(weapon);
        } catch (retryError) {
          console.error('Failed to reset sequence and retry:', retryError);
        }
      }
    }
    return NextResponse.json(
      {
        error: 'Failed to create weapon',
        details: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.name : typeof error,
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}
