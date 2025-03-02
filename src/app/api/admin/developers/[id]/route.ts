import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Role } from '@/services/api';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify that the user is a patron
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PATRON') {
      return NextResponse.json(
        { error: 'Unauthorized - Only PATRON can update developers' },
        { status: 403 }
      );
    }

    const id = Number.parseInt(params.id);
    const { username, password, name } = await request.json();

    // Validate input
    if (!username || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if username already exists for a different developer
    const existingDeveloper = await prisma.user.findFirst({
      where: {
        username,
        role: Role.EMPLOYEE,
        NOT: {
          id,
        },
      },
    });

    if (existingDeveloper) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Update developer
    const updateData: any = {
      username,
      name,
    };

    // Only update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const developer = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
      },
    });

    return NextResponse.json(developer);
  } catch (error) {
    console.error('Error updating developer:', error);
    return NextResponse.json(
      { error: 'Failed to update developer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify that the user is a patron
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PATRON') {
      return NextResponse.json(
        { error: 'Unauthorized - Only PATRON can delete developers' },
        { status: 403 }
      );
    }

    const id = Number.parseInt(params.id);

    // Check if developer exists
    const developer = await prisma.user.findUnique({
      where: { id },
    });

    if (!developer || developer.role !== Role.EMPLOYEE) {
      return NextResponse.json(
        { error: 'Developer not found' },
        { status: 404 }
      );
    }

    // Delete developer
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting developer:', error);
    return NextResponse.json(
      { error: 'Failed to delete developer' },
      { status: 500 }
    );
  }
} 