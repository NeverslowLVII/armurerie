import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { del, put } from '@vercel/blob';
import { getServerSession } from 'next-auth';
import { NextResponse, NextRequest } from 'next/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

    if (
      !currentUser ||
      (currentUser.role !== Role.PATRON &&
        currentUser.role !== Role.CO_PATRON &&
        currentUser.role !== Role.DEVELOPER)
    ) {
      return new NextResponse(
        'Non autorisé - Accès réservé aux administrateurs',
        {
          status: 403,
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new NextResponse('Fichier manquant', { status: 400 });
    }

    // Await params resolution *after* handling formData
    const resolvedParams = await context.params;
    const userId = Number.parseInt(resolvedParams.id);
    if (Number.isNaN(userId)) {
      console.error('Invalid user ID format:', resolvedParams.id);
      return new NextResponse('Invalid user ID format', { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    if (!user) {
      return new NextResponse('Utilisateur non trouvé', { status: 404 });
    }

    // Générer un nom de fichier unique basé sur l'ID de l'utilisateur et la date
    const fileName = `contracts/${user.id}_${user.name.replaceAll(/\s+/g, '_')}_${Date.now()}.${file.name.split('.').pop()}`;

    // Upload du fichier vers Vercel Blob Storage
    const { url } = await put(fileName, file, { access: 'public' });

    // Mettre à jour l'URL du contrat dans la base de données
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { contractUrl: url },
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
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse('Non autorisé', { status: 401 });
    }

    // Await params
    const resolvedParams = await context.params;
    const userId = Number.parseInt(resolvedParams.id);
    if (Number.isNaN(userId)) {
      console.error('Invalid user ID format:', resolvedParams.id);
      return new NextResponse('Invalid user ID format', { status: 400 });
    }

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

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

    if (
      !currentUser ||
      (currentUser.role !== Role.PATRON &&
        currentUser.role !== Role.CO_PATRON &&
        currentUser.role !== Role.DEVELOPER)
    ) {
      return new NextResponse(
        'Non autorisé - Accès réservé aux administrateurs',
        {
          status: 403,
        }
      );
    }

    // Await params resolution
    const resolvedParams = await context.params;
    const userId = Number.parseInt(resolvedParams.id);
    if (Number.isNaN(userId)) {
      console.error('Invalid user ID format:', resolvedParams.id);
      return new NextResponse('Invalid user ID format', { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { contractUrl: true },
    });

    if (!user?.contractUrl) {
      return new NextResponse('Contrat non trouvé', { status: 404 });
    }

    // Extraire l'URL du blob à partir de l'URL complète
    const blobUrl = user.contractUrl;

    try {
      // Supprimer le fichier de Vercel Blob Storage
      await del(blobUrl);
    } catch (error) {
      console.error(
        'Erreur lors de la suppression du fichier dans Vercel Blob:',
        error
      );
      // Continuer même si la suppression du blob échoue
    }

    // Mettre à jour l'utilisateur pour supprimer l'URL du contrat
    await prisma.user.update({
      where: { id: userId },
      data: { contractUrl: null },
    });

    return NextResponse.json({
      success: true,
      message: 'Contrat supprimé avec succès',
    });
  } catch (error) {
    console.error('Error deleting contract:', error);
    return new NextResponse('Erreur interne du serveur', { status: 500 });
  }
}
