import { prisma } from '@/lib/prisma';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Récupérer page et pageSize des paramètres de requête, avec valeurs par défaut
  const searchParams = request.nextUrl.searchParams;
  const page = Number.parseInt(searchParams.get('page') || '1');
  const pageSize = Number.parseInt(searchParams.get('pageSize') || '50'); // Valeur par défaut plus élevée car les armes de base sont généralement moins nombreuses

  // Valider les paramètres
  if (Number.isNaN(page) || page < 1) {
    return NextResponse.json({ error: 'Invalid page number' }, { status: 400 });
  }
  if (Number.isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
    return NextResponse.json(
      { error: 'Invalid page size (must be between 1 and 100)' },
      { status: 400 }
    );
  }

  // Calculer skip et take pour la pagination
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  try {
    // Exécuter la requête paginée et obtenir le compte total en une seule transaction
    const [baseWeapons, totalCount] = await prisma.$transaction([
      prisma.baseWeapon.findMany({
        skip: skip,
        take: take,
        orderBy: {
          nom: 'asc', // Trier par nom pour une expérience utilisateur cohérente
        },
      }),
      prisma.baseWeapon.count(),
    ]);

    // Retourner les données paginées avec le compte total
    return NextResponse.json({
      baseWeapons: baseWeapons,
      totalCount: totalCount,
      page: page,
      pageSize: pageSize,
    });
    // --- TEMPORARY ---
    // console.log("[TEMP] GET /api/base-weapons returning dummy data");
    // return NextResponse.json([{ id: 1, nom: 'Dummy Weapon', prix_defaut: 100, cout_production_defaut: 50 }]);
    // --- END TEMP ---
  } catch (error) {
    console.error('Error fetching base weapons:', error);
    return NextResponse.json(
      { error: 'Error fetching base weapons' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const baseWeapon = await prisma.baseWeapon.create({
      data: {
        nom: body.nom,
        prix_defaut: body.prix_defaut,
        cout_production_defaut: body.cout_production_defaut || 0, // Ensure default cost if not provided
      },
    });
    return NextResponse.json(baseWeapon);
    // --- TEMPORARY ---
    // console.log("[TEMP] POST /api/base-weapons returning dummy data for body:", body);
    // const dummyCreated = {
    //     id: Date.now(), // Simulate unique ID
    //     nom: body.nom || 'Dummy Created',
    //     prix_defaut: body.prix_defaut || 200,
    //     cout_production_defaut: body.cout_production_defaut || 70
    // };
    // return NextResponse.json(dummyCreated);
    // --- END TEMP ---
  } catch (error) {
    console.error('Error creating base weapon:', error);
    return NextResponse.json(
      { error: 'Error creating base weapon' },
      { status: 500 }
    );
  }
}
