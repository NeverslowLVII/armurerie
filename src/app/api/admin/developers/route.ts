import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Role } from '@/services/api';

export async function GET() {
  try {
    // Verify that the user is a patron
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PATRON') {
      return NextResponse.json(
        { error: 'Unauthorized - Only PATRON can manage developers' },
        { status: 403 }
      );
    }

    const developers = await prisma.user.findMany({
      where: {
        role: Role.DEVELOPER
      },
      select: {
        id: true,
        username: true,
        name: true,
      },
    });

    return NextResponse.json(developers);
  } catch (error) {
    console.error('Error fetching developers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch developers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Verify that the user is a patron
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PATRON') {
      return NextResponse.json(
        { error: 'Unauthorized - Only PATRON can create developers' },
        { status: 403 }
      );
    }

    const { username, password, name } = await request.json();

    // Validate input
    if (!username || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingDeveloper = await prisma.user.findUnique({
      where: { username },
    });

    if (existingDeveloper) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create developer
    const developer = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: Role.DEVELOPER,
        email: `${username}@armurerie.dev`, // Generate a default email for developers
      },
      select: {
        id: true,
        username: true,
        name: true,
      },
    });

    return NextResponse.json(developer);
  } catch (error) {
    console.error('Error creating developer:', error);
    return NextResponse.json(
      { error: 'Failed to create developer' },
      { status: 500 }
    );
  }
} 