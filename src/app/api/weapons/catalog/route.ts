import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Use global prisma instance to avoid multiple connections
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET() {
  try {
    const weapons = await prisma.weaponCatalog.findMany();
    return NextResponse.json(weapons);
  } catch (error) {
    console.error('Error fetching weapon catalog:', error);
    return NextResponse.json({ error: 'Failed to fetch weapon catalog' }, { status: 500 });
  }
}
