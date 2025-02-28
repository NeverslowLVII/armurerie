import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse('Non autorisé', { status: 401 });
    }

    // Vérifier si l'utilisateur est un patron ou co-patron
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser || (currentUser.role !== Role.PATRON && currentUser.role !== Role.CO_PATRON)) {
      return new NextResponse('Non autorisé - Accès réservé aux patrons', { status: 403 });
    }

    const { contractUrl } = await request.json();

    if (!contractUrl) {
      return new NextResponse('URL du contrat manquante', { status: 400 });
    }

    const userId = parseInt(params.id);
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { contractUrl },
    });

    return NextResponse.json({
      success: true,
      contractUrl: updatedUser.contractUrl,
    });
  } catch (error) {
    console.error('Error uploading contract:', error);
    return new NextResponse('Erreur interne du serveur', { status: 500 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse('Non autorisé', { status: 401 });
    }

    const userId = parseInt(params.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { contractUrl: true },
    });

    if (!user?.contractUrl) {
      return new NextResponse('Contrat non trouvé', { status: 404 });
    }

    return NextResponse.json({ contractUrl: user.contractUrl });
  } catch (error) {
    console.error('Error fetching contract:', error);
    return new NextResponse('Erreur interne du serveur', { status: 500 });
  }
} 