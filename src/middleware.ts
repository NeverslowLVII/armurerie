import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import type { NextRequest } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const isApiRoute = path.startsWith('/api/');

    // Si déjà authentifié et sur la page de connexion, rediriger vers /
    if (token && path.startsWith('/auth/signin')) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Public routes - no auth required
    if (
      path.startsWith('/auth') ||
      path.startsWith('/api/auth')
    ) {
      return NextResponse.next();
    }

    // API routes should return 401 instead of redirecting
    if (!token && isApiRoute) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'content-type': 'application/json' }
        }
      );
    }

    // Protected routes - require auth
    if (!token) {
      const signInUrl = new URL('/auth/signin', req.url);
      return NextResponse.redirect(signInUrl);
    }

    // Admin routes - require PATRON or CO_PATRON
    if (path.startsWith('/admin') && token.role !== Role.PATRON && token.role !== Role.CO_PATRON) {
      if (isApiRoute) {
        return new NextResponse(
          JSON.stringify({ error: 'Access denied' }),
          { 
            status: 403,
            headers: { 'content-type': 'application/json' }
          }
        );
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Developer routes - require DEVELOPER
    if (path.startsWith('/api/feedback') && token.role !== Role.DEVELOPER) {
      if (isApiRoute) {
        return new NextResponse(
          JSON.stringify({ error: 'Access denied' }),
          { 
            status: 403,
            headers: { 'content-type': 'application/json' }
          }
        );
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

export function middleware(request: NextRequest) {
  // Only apply to /api routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    const response = NextResponse.next()

    // Add the CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Max-Age', '86400')

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 