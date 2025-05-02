import { prisma } from '@/lib/prisma';
import type { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Export the User interface
export interface User {
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
    username?: string | null;
    color?: string | null;
    contractUrl?: string | null;
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
        identifier: { label: "Email ou nom d'utilisateur", type: 'text' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error('Identifiants requis');
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.identifier },
              { username: credentials.identifier },
            ],
          },
        });

        if (!user) {
          throw new Error('Identifiants invalides');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isPasswordValid) {
          throw new Error('Identifiants invalides');
        }

        // Update last login time
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
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
      },
    }),
  ],
  callbacks: {
    // Restore callbacks
    async jwt({ token, user }) {
      if (user) {
        const appUser = user as User;
        token.id = appUser.id;
        token.role = appUser.role;
        token.username = appUser.username || null;
        token.color = appUser.color || null;
        token.contractUrl = appUser.contractUrl || null;
      }
      return token;
    },
    async session({ session, token }) {
      const augmentedToken = token as import('next-auth/jwt').JWT;
      if (augmentedToken) {
        const augmentedUser = session.user as User;
        augmentedUser.id = augmentedToken.id;
        augmentedUser.role = augmentedToken.role;
        augmentedUser.username = augmentedToken.username || null;
        augmentedUser.color = augmentedToken.color || null;
        augmentedUser.contractUrl = augmentedToken.contractUrl || null;
        session.user = augmentedUser;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
