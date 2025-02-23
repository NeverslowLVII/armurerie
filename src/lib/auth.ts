import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
  }
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET must be set');
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        identifier: { label: 'Email ou nom d\'utilisateur', type: 'text' },
        password: { label: 'Mot de passe', type: 'password' }
      },
      async authorize(credentials, req) {
        console.log('Authorize called with credentials:', {
          identifier: credentials?.identifier,
          hasPassword: !!credentials?.password,
          headers: req?.headers
        });
        
        if (!credentials?.identifier || !credentials?.password) {
          console.log('Missing credentials');
          throw new Error('Missing credentials');
        }

        try {
          // Test database connection first
          try {
            await prisma.$connect();
            console.log('Database connection successful');
          } catch (dbError) {
            console.error('Database connection error:', dbError);
            throw new Error('Database connection failed');
          }

          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: credentials.identifier },
                { username: credentials.identifier }
              ]
            }
          });

          console.log('User search result:', {
            found: !!user,
            email: user?.email,
            username: user?.username,
            hasPassword: !!user?.password
          });

          if (!user || !user.password) {
            console.log('User not found or no password');
            throw new Error('Invalid credentials');
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          console.log('Password validation:', {
            isValid: isPasswordValid
          });

          if (!isPasswordValid) {
            console.log('Invalid password');
            throw new Error('Invalid credentials');
          }

          // Update last login time
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          });

          const userResponse = {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            username: user.username ?? undefined,
            color: user.color ?? undefined,
            contractUrl: user.contractUrl ?? undefined,
          };

          console.log('Authentication successful:', userResponse);
          return userResponse;
        } catch (error) {
          console.error('Authentication error:', error);
          throw error;
        } finally {
          await prisma.$disconnect();
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('JWT Callback:', { 
        tokenExists: !!token, 
        userExists: !!user,
        userId: user?.id,
        userRole: user?.role
      });
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      console.log('Session Callback:', { 
        sessionExists: !!session, 
        tokenExists: !!token,
        tokenId: token?.id,
        tokenRole: token?.role
      });
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // Update every hour
  },
  debug: true, // Enable debug mode to see more detailed logs
  secret: process.env.NEXTAUTH_SECRET
}; 