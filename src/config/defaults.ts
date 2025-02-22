import { Role } from '@prisma/client';

export const DEFAULT_ADMIN = {
  email: process.env.DEFAULT_ADMIN_EMAIL ?? 'admin@armurerie.com',
  password: process.env.DEFAULT_ADMIN_PASSWORD ?? 'Admin123!',
  name: 'Administrateur',
  role: Role.PATRON,
  color: '#FF0000',
} as const;