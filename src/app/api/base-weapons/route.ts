import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const baseWeapons = await prisma.baseWeapon.findMany();
    return NextResponse.json(baseWeapons);
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
