import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

// Extend the built-in session types
declare module 'next-auth' {
  interface User {
    id: string;
    email: string | null;
    username: string | null;
    name: string;
    role: Role;
    color: string | null;
    contractUrl: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string | null;
      username: string | null;
      name: string;
      role: Role;
      color: string | null;
      contractUrl: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    username: string | null;
    color: string | null;
    contractUrl: string | null;
  }
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET must be set');
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Email ou nom d\'utilisateur', type: 'text' },
        password: { label: 'Mot de passe', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        const foundUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.identifier },
              { username: credentials.identifier }
            ]
          },
        });

        if (!foundUser) {
          throw new Error('Invalid credentials');
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          foundUser.password
        );

        if (!isValidPassword) {
          throw new Error('Invalid credentials');
        }

        // Update last login
        await prisma.user.update({
          where: { id: foundUser.id },
          data: { lastLogin: new Date() },
        });

        // Convert to NextAuth User format
        return {
          id: foundUser.id.toString(),
          email: foundUser.email,
          username: foundUser.username,
          name: foundUser.name,
          role: foundUser.role,
          color: foundUser.color,
          contractUrl: foundUser.contractUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
        token.color = user.color;
        token.contractUrl = user.contractUrl;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.username = token.username;
        session.user.color = token.color;
        session.user.contractUrl = token.contractUrl;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 