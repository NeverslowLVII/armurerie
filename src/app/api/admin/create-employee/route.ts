import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Vérifier que l'utilisateur est un patron
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PATRON') {
      return NextResponse.json(
        { error: 'Unauthorized - Only PATRON can create employee accounts' },
        { status: 403 }
      );
    }

    const { name, email, password, color, contractUrl } = await request.json();

    // Validation des données
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existingEmployee = await prisma.employee.findUnique({
      where: { email } as any,
    });

    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'employé
    const employee = await prisma.employee.create({
      data: {
        name,
        email,
        password: hashedPassword,
        color,
        contractUrl,
        role: Role.EMPLOYEE,
      } as any,
    });

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        name: employee.name,
        email: (employee as any).email,
        role: employee.role,
        contractUrl: (employee as any).contractUrl,
      },
    });
  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json(
      { error: 'Failed to create employee account' },
      { status: 500 }
    );
  }
} 