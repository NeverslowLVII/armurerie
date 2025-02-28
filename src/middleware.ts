import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';

// Define public routes that don't require authentication
const publicRoutes = [
  '/auth/signin',
  '/auth/error',
  '/auth/reset',
  '/auth/setup',
  '/api/auth/callback/credentials',
  '/api/auth/csrf',
  '/api/auth/session',
  '/api/auth/providers',
  '/api/auth/signin',
  '/api/auth/signout',
  '/favicon.ico',
  '/_next',
  '/images',
  '/assets',
  '/static',
  '/vercel.svg'
];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const isApiRoute = path.startsWith('/api/');

    // Check if the route is public
    if (publicRoutes.some(route => {
      // Exact match for paths like /auth/reset
      if (path === route) return true;
      // Prefix match for paths like /_next/...
      if (route.endsWith('/') ? path.startsWith(route) : path.startsWith(route + '/') || path === route) return true;
      return false;
    })) {
      return NextResponse.next();
    }

    // If already authenticated and on login page, redirect to /
    if (token && path.startsWith('/auth/signin')) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // API routes should return 401 instead of redirecting
    if (!token && isApiRoute) {
      if (req.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Max-Age': '86400'
          }
        });
      }

      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 
            'content-type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }

    // Protected routes - require auth
    if (!token) {
      const signInUrl = new URL('/auth/signin', req.url);
      signInUrl.searchParams.set('callbackUrl', encodeURIComponent(req.url));
      return NextResponse.redirect(signInUrl);
    }

    // Admin routes - require PATRON or CO_PATRON
    if (path.startsWith('/admin') && token.role !== Role.PATRON && token.role !== Role.CO_PATRON) {
      if (isApiRoute) {
        return new NextResponse(
          JSON.stringify({ error: 'Access denied' }),
          { 
            status: 403,
            headers: { 
              'content-type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
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
            headers: { 
              'content-type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          }
        );
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    const response = NextResponse.next();
    
    // Add CORS headers to all responses
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
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

// Update matcher to exclude more static paths
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|vercel.svg|assets/|images/|static/|auth/reset|auth/setup|api/auth/setup).*)',
  ],
}; 