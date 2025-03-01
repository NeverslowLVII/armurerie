import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Role } from '@/services/api';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Vérifier que l'utilisateur est un patron
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PATRON') {
      return NextResponse.json(
        { error: 'Unauthorized - Only PATRON can create user accounts' },
        { status: 403 }
      );
    }

    const { name, email, password, color, contractUrl, commission } = await request.json();

    // Validation des données
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email } as any,
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        color,
        contractUrl,
        commission: commission || 0,
        role: Role.EMPLOYEE,
      } as any,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: (user as any).email,
        role: user.role,
        contractUrl: (user as any).contractUrl,
        commission: (user as any).commission,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user account' },
      { status: 500 }
    );
  }
} 