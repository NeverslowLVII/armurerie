import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';

// Extracted function for core logic
// Removed export as it's not allowed for non-handler functions in route files
async function verifyAuthTokenAndGetUser(authToken: string | undefined) {
  if (!authToken) {
    return { error: 'Unauthorized', status: 401 };
  }

  try {
    const decoded = jwt.verify(authToken, JWT_SECRET) as {
      id: number;
      email: string;
      username?: string;
      role: string;
      name: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        color: true,
        contractUrl: true,
      },
    });

    if (!user) {
      throw new Error('User not found from token'); // Throw specific error
    }

    return { user: user, status: 200 };
  } catch (error) {
    console.error('Token verification or user lookup failed:', error);
    // Distinguish different verification errors if needed, otherwise return general invalid token
    return { error: 'Invalid token', status: 401 };
  }
}

export async function POST(request: Request) {
  try {
    const { email, username, password } = await request.json();

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: email || '' }, { username: username || '' }],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        color: user.color,
        contractUrl: user.contractUrl,
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86_400, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// Verify token and get current user
export async function GET() {
  try {
    const cookiesStore = await cookies();
    const authToken = cookiesStore.get('auth_token')?.value;

    const result = await verifyAuthTokenAndGetUser(authToken);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    // Type assertion if needed, or ensure verifyAuthTokenAndGetUser signature is clear
    return NextResponse.json({ user: result.user }, { status: result.status });
  } catch (error) {
    // This outer catch handles errors during cookie reading itself, if any
    console.error('Error reading cookies or during auth check:', error);
    return NextResponse.json(
      { error: 'Authentication failed due to server error' },
      { status: 500 }
    );
  }
}
