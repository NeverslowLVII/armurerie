import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const baseWeapons = await prisma.baseWeapon.findMany();
    return NextResponse.json(baseWeapons);
  } catch (error) {
    console.error('Error fetching base weapons:', error);
    return NextResponse.json({ error: 'Error fetching base weapons' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const baseWeapon = await prisma.baseWeapon.create({
      data: {
        nom: body.nom,
        prix_defaut: body.prix_defaut,
        cout_production_defaut: body.cout_production_defaut || 0,
      },
    });
    return NextResponse.json(baseWeapon);
  } catch (error) {
    console.error('Error creating base weapon:', error);
    return NextResponse.json({ error: 'Error creating base weapon' }, { status: 500 });
  }
}
