import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';
import { put, del } from '@vercel/blob';

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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new NextResponse('Fichier manquant', { status: 400 });
    }

    const userId = Number.parseInt(params.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true }
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
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse('Non autorisé', { status: 401 });
    }

    const userId = Number.parseInt(params.id);
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
  _request: Request,
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

    const userId = Number.parseInt(params.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { contractUrl: true }
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
      console.error('Erreur lors de la suppression du fichier dans Vercel Blob:', error);
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