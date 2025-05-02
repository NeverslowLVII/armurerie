import { prisma } from '@/lib/prisma';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params
    const resolvedParams = await context.params;
    const paramId = resolvedParams.id;

    // Try to find by ID first
    const numericId = Number.parseInt(paramId, 10);
    if (!Number.isNaN(numericId)) {
      const baseWeapon = await prisma.baseWeapon.findUnique({
        where: { id: numericId },
      });
      if (baseWeapon) {
        return NextResponse.json(baseWeapon);
      }
    }

    // If not found by ID, try to find by name
    const baseWeaponByName = await prisma.baseWeapon.findUnique({
      where: { nom: paramId },
    });

    if (!baseWeaponByName) {
      return NextResponse.json(
        { error: 'Base weapon not found', id: paramId },
        { status: 404 }
      );
    }

    return NextResponse.json(baseWeaponByName);
  } catch (error) {
    console.error('Get base weapon error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch base weapon' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params resolution
    const resolvedParams = await context.params;
    const paramId = resolvedParams.id;

    // Try to find by ID first
    const numericId = Number.parseInt(paramId, 10);
    if (!Number.isNaN(numericId)) {
      const baseWeapon = await prisma.baseWeapon.findUnique({
        where: { id: numericId },
      });
      if (baseWeapon) {
        const data = await request.json();
        const updated = await prisma.baseWeapon.update({
          where: { id: numericId },
          data: {
            nom: data.nom,
            prix_defaut: data.prix_defaut,
            cout_production_defaut: data.cout_production_defaut,
          },
        });
        return NextResponse.json(updated);
      }
    }

    // If not found by ID, try to find by name
    const baseWeaponByName = await prisma.baseWeapon.findUnique({
      where: { nom: paramId },
    });

    if (!baseWeaponByName) {
      return NextResponse.json(
        { error: 'Base weapon not found', id: paramId },
        { status: 404 }
      );
    }

    const data = await request.json();
    const updatedByName = await prisma.baseWeapon.update({
      where: { id: baseWeaponByName.id },
      data: {
        nom: data.nom,
        prix_defaut: data.prix_defaut,
        cout_production_defaut: data.cout_production_defaut,
      },
    });

    return NextResponse.json(updatedByName);
  } catch (error) {
    console.error('Update base weapon error:', error);
    return NextResponse.json(
      { error: 'Failed to update base weapon' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params resolution
    const resolvedParams = await context.params;
    const paramId = resolvedParams.id;

    console.info('Deleting base weapon with ID/name:', paramId);

    // Try to find by ID first
    const numericId = Number.parseInt(paramId, 10);
    if (!Number.isNaN(numericId)) {
      const baseWeapon = await prisma.baseWeapon.findUnique({
        where: { id: numericId },
      });
      if (baseWeapon) {
        await prisma.baseWeapon.delete({
          where: { id: numericId },
        });
        console.info('Base weapon deleted by ID:', numericId);
        return NextResponse.json({ success: true });
      }
    }

    // If not found by ID, try to find by name
    const baseWeaponByName = await prisma.baseWeapon.findUnique({
      where: { nom: paramId },
    });

    if (!baseWeaponByName) {
      return NextResponse.json(
        { error: 'Base weapon not found', id: paramId },
        { status: 404 }
      );
    }

    await prisma.baseWeapon.delete({
      where: { id: baseWeaponByName.id },
    });

    console.info('Base weapon deleted by name:', paramId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete base weapon error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete base weapon',
        details: error instanceof Error ? error.message : String(error),
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
