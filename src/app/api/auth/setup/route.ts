import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/tokens';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    console.log('Setup API called');
    const { token, password } = await request.json();
    console.log('Received token and password');

    // Vérifier le token
    const payload = verifyToken(token);
    console.log('Token verification result:', payload);
    
    if (!payload || payload.type !== 'setup') {
      console.log('Invalid token or wrong type');
      return NextResponse.json(
        { error: 'Token invalide ou expiré' },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });
    console.log('User found:', !!user);

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed');

    // Mettre à jour l'utilisateur
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        lastLogin: new Date()
      }
    });
    console.log('User updated successfully');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la configuration du compte' },
      { status: 500 }
    );
  }
} 