import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function getCurrentEmployee() {
  const currentEmployeeName = localStorage.getItem('currentEmployee');
  if (!currentEmployeeName) return null;

  return await prisma.employee.findFirst({
    where: { name: currentEmployeeName }
  });
}

async function isDeveloper() {
  const employee = await getCurrentEmployee();
  return employee?.role === 'DEVELOPER';
}

export async function POST(request: Request) {
  try {
    const employee = await getCurrentEmployee();
    if (!employee) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { type, title, description, status } = await request.json();

    // Only developers can set status, others default to OPEN
    const finalStatus = employee.role === 'DEVELOPER' ? status : 'OPEN';

    const feedback = await prisma.feedback.create({
      data: {
        type,
        title,
        description,
        status: finalStatus,
        submittedBy: employee.id,
      },
      include: {
        employee: true,
      },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to create feedback' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const employee = await getCurrentEmployee();
    if (!employee || employee.role !== 'DEVELOPER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const feedback = await prisma.feedback.findMany({
      include: {
        employee: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const employee = await getCurrentEmployee();
    if (!employee || employee.role !== 'DEVELOPER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, status } = await request.json();

    const feedback = await prisma.feedback.update({
      where: { id },
      data: { status },
      include: {
        employee: true,
      },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    );
  }
} 