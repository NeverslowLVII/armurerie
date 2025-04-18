import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number.parseInt(session.user.id) },
      select: { contractUrl: true } as any,
    });

    if (!user || !user.contractUrl) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Rediriger vers l'URL du contrat
    return NextResponse.redirect(user.contractUrl as any);
  } catch (error) {
    console.error('Get contract error:', error);
    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 });
  }
}
