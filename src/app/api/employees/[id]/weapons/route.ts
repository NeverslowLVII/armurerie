import { prisma } from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params
    const resolvedParams = await context.params;
    const userId = Number.parseInt(resolvedParams.id);
    if (Number.isNaN(userId)) {
      return NextResponse.json(
        { error: "ID d'utilisateur invalide" },
        { status: 400 }
      );
    }

    const weapons = await prisma.weapon.findMany({
      where: { user_id: userId },
      include: {
        base_weapon: true,
      },
    });

    return NextResponse.json(weapons);
  } catch (error) {
    console.error('Error fetching user weapons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user weapons' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}
