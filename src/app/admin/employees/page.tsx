import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import UsersAdminClient from '@/components/admin/UsersAdminClient';

export const metadata: Metadata = {
  title: 'Gestion des Utilisateurs - Armurerie',
  description: 'Administration des comptes utilisateurs',
};

async function getUsers() {
  return (await prisma.user.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      role: true,
      color: true,
      email: true,
      contractUrl: true,
    } as any,
  })) as any[];
}

export default async function UsersAdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'PATRON') {
    redirect('/dashboard');
  }

  const users = await getUsers();

  return <UsersAdminClient users={users} />;
}
