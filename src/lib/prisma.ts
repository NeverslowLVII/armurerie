import { PrismaClient } from '@prisma/client';

// Déclare une variable globale pour stocker le client Prisma
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Crée une instance du client Prisma SANS le logging activé
export const prisma = globalThis.prisma || new PrismaClient(/*{
  log: ['query', 'info', 'warn', 'error'],
}*/);

// En environnement de développement, assigne le client Prisma à la variable globale
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
