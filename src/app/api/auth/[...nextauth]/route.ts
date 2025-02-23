import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

async function handler(req: Request, context: any) {
  console.log('NextAuth handler called:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  try {
    const nextAuthHandler = NextAuth(authOptions);
    return await nextAuthHandler(req, context);
  } catch (error) {
    console.error('NextAuth error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export { handler as GET, handler as POST }; 