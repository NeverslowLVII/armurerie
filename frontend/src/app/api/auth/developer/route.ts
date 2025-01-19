import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const developer = await prisma.developer.findUnique({
      where: { username },
    });

    if (!developer) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, developer.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      { id: developer.id, username: developer.username, type: 'developer' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set HTTP-only cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('dev_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400 // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Error during developer authentication:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// Verify developer token
export async function GET(request: Request) {
  try {
    const devToken = request.cookies.get('dev_token')?.value;
    
    if (!devToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(devToken, JWT_SECRET) as { id: number; username: string; type: string };
      if (decoded.type !== 'developer') {
        throw new Error('Invalid token type');
      }

      const developer = await prisma.developer.findUnique({
        where: { id: decoded.id },
        select: { id: true, username: true, name: true }
      });

      if (!developer) {
        throw new Error('Developer not found');
      }

      return NextResponse.json({ developer });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error verifying developer token:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 