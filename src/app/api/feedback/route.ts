import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Role } from '@/services/api';

export async function POST(request: Request) {
  try {
    const { type, title, description, status, userId } = await request.json();
    const session = await getServerSession(authOptions);

    // Check if user is logged in
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized - User must be logged in to submit feedback' }, { status: 401 });
    }

    // User ID logic: Use session user ID if not explicitly provided (and ensure consistency if both exist?)
    const finalUserId = userId ?? (session.user.id ? Number(session.user.id) : undefined);

    // Only developers can set status explicitly, others default to OPEN
    const finalStatus = session?.user.role === Role.DEVELOPER ? status : 'OPEN';

    const feedback = await prisma.feedback.create({
      data: {
        type,
        title,
        description,
        status: finalStatus,
        ...(finalUserId ? { user_id: finalUserId } : {}),
      },
      ...(finalUserId
        ? {
            include: {
              user: true,
            },
          }
        : {}),
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
    return NextResponse.json({ error: 'Failed to create feedback' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== Role.DEVELOPER) {
      return NextResponse.json(
        { error: 'Unauthorized - Only developers can view all feedback' },
        { status: 401 }
      );
    }

    const feedback = await prisma.feedback.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== Role.DEVELOPER) {
      return NextResponse.json(
        { error: 'Unauthorized - Only developers can update feedback' },
        { status: 401 }
      );
    }

    const { id, status } = await request.json();

    const feedback = await prisma.feedback.update({
      where: { id },
      data: { status },
      include: {
        user: true,
      },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== Role.DEVELOPER) {
      return NextResponse.json(
        { error: 'Unauthorized - Only developers can delete feedback' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = Number.parseInt(searchParams.get('id') || '');

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid feedback ID' }, { status: 400 });
    }

    await prisma.feedback.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 });
  }
}
