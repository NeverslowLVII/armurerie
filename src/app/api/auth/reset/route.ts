import { generateResetPasswordEmailHtml, sendEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/tokens';
import { generateResetLink } from '@/lib/tokens';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Pour des raisons de sécurité, on renvoie toujours success même si l'utilisateur n'existe pas
      return NextResponse.json({ success: true });
    }

    // Générer le lien de réinitialisation
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetLink = generateResetLink(user.id, user.email, baseUrl);

    // Envoyer l'email
    const emailResult = await sendEmail({
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe',
      html: generateResetPasswordEmailHtml(resetLink),
    });
    console.info('Email sending result:', emailResult);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la réinitialisation du mot de passe' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { token, password } = await request.json();

    // Vérifier le token
    const payload = verifyToken(token);
    if (!payload || payload.type !== 'reset') {
      return NextResponse.json(
        { error: 'Token invalide ou expiré' },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Mettre à jour l'utilisateur
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        lastLogin: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la réinitialisation du mot de passe' },
      { status: 500 }
    );
  }
}
