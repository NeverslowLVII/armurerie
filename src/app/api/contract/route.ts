import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(session.user.id) },
      select: ({ contractUrl: true } as any),
    });

    if (!employee || !employee.contractUrl) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Rediriger vers l'URL du contrat
    return NextResponse.redirect(employee.contractUrl as any);
  } catch (error) {
    console.error('Get contract error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract' },
      { status: 500 }
    );
  }
} 