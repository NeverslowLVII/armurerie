import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse('Non autorisé', { status: 401 });
    }

    const { signature } = await request.json();

    if (!signature) {
      return new NextResponse('Signature manquante', { status: 400 });
    }

    // Dans un environnement de production, vous devriez :
    // 1. Sauvegarder la signature dans un stockage sécurisé (ex: AWS S3)
    // 2. Générer un PDF du contrat avec la signature
    // 3. Sauvegarder le PDF dans un stockage sécurisé
    // 4. Envoyer une copie par email à l'employé

    // Pour cet exemple, nous allons simplement stocker l'URL de la signature
    const contractUrl = signature;

    const updatedUser = await prisma.user.update({
      where: {
        email: session.user.email,
      },
      data: {
        contractUrl,
      },
    });

    return NextResponse.json({
      success: true,
      contractUrl: updatedUser.contractUrl,
    });
  } catch (error) {
    console.error('Error in sign contract route:', error);
    return new NextResponse('Erreur interne du serveur', { status: 500 });
  }
} 