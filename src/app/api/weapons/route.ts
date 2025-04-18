import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const weapons = await prisma.weapon.findMany({
      include: {
        user: true,
        base_weapon: true,
      },
    });
    return NextResponse.json(weapons);
  } catch (error) {
    console.error('Get weapons error:', error);
    return NextResponse.json({ error: 'Failed to fetch weapons' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let data: any;
  let userId: number;
  let baseWeapon: { prix_defaut: number; cout_production_defaut: number } | null;
  let createWeaponData: any;

  try {
    data = await request.json();
    console.log('Creating weapon with data:', JSON.stringify(data, null, 2));

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

    // Parse user ID
    userId = Number.parseInt(data.user_id);
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
      return NextResponse.json({ error: 'User not found', user_id: userId }, { status: 404 });
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
      user_id: userId,
      detenteur: data.detenteur || '',
      bp: data.bp || null,
      nom_arme: data.nom_arme,
      serigraphie: data.serigraphie,
      prix: data.prix || baseWeapon.prix_defaut,
      cout_production: data.cout_production || baseWeapon.cout_production_defaut,
    };

    // Create weapon
    const weapon = await prisma.weapon.create({
      data: createWeaponData,
      include: {
        user: true,
        base_weapon: true,
      },
    });

    console.log('Weapon created successfully:', JSON.stringify(weapon, null, 2));
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
        error.message.includes('Unique constraint failed on the fields: (`id`)') &&
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
