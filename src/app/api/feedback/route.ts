import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

async function isDeveloper() {
  const devToken = cookies().get('dev_token')?.value;
  if (!devToken) return false;
  
  try {
    const decoded = jwt.verify(devToken, JWT_SECRET) as { type: string };
    return decoded.type === 'developer';
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { type, title, description, status, employeeId } = await request.json();
    const isDev = await isDeveloper();

    // Only developers can set status, others default to OPEN
    const finalStatus = isDev ? status : 'OPEN';

    const feedback = await prisma.feedback.create({
      data: {
        type,
        title,
        description,
        status: finalStatus,
        ...(employeeId ? { submittedBy: employeeId } : {}),
      },
      ...(employeeId ? {
        include: {
          employee: true,
        },
      } : {}),
    });

    // Email notifications temporarily disabled
    // Uncomment and configure SMTP settings in Vercel to enable
    /*
    try {
      await sendFeedbackNotification(feedback);
    } catch (emailError) {
      console.error('Error sending feedback notification email:', emailError);
    }
    */

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
    const isDev = await isDeveloper();
    if (!isDev) {
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
    const isDev = await isDeveloper();
    if (!isDev) {
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

export async function DELETE(request: Request) {
  try {
    const isDev = await isDeveloper();
    if (!isDev) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '');

    if (!id || isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid feedback ID' },
        { status: 400 }
      );
    }

    await prisma.feedback.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to delete feedback' },
      { status: 500 }
    );
  }
} 