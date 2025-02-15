import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import EmployeesAdminClient from '@/components/admin/EmployeesAdminClient';

export const metadata: Metadata = {
  title: 'Gestion des Employés - Armurie',
  description: 'Administration des comptes employés',
};

async function getEmployees() {
  return (await prisma.employee.findMany({
    orderBy: { name: 'asc' },
    select: ({ id: true, name: true, role: true, color: true, email: true, contractUrl: true } as any)
  })) as any[];
}

export default async function EmployeesAdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'PATRON') {
    redirect('/dashboard');
  }

  const employees = await getEmployees();

  return <EmployeesAdminClient employees={employees} />;
}