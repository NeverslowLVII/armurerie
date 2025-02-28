import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  username: string | null;
  color: string | null;
  contractUrl: string | null;
}

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
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        identifier: { label: 'Email ou nom d\'utilisateur', type: 'text' },
        password: { label: 'Mot de passe', type: 'password' }
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error('Identifiants requis');
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.identifier },
              { username: credentials.identifier }
            ]
          },
        });

        if (!user) {
          throw new Error('Identifiants invalides');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error('Identifiants invalides');
        }

        // Update last login time
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        });

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          username: user.username || null,
          color: user.color || null,
          contractUrl: user.contractUrl || null,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.username = token.username || null;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 