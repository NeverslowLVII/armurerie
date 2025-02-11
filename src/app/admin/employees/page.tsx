import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Employee } from '@prisma/client';
import { CreateEmployeeDialog } from '@/components/admin/CreateEmployeeDialog';

export const metadata: Metadata = {
  title: 'Gestion des Employés - Armurie',
  description: 'Administration des comptes employés',
};

async function getEmployees() {
  return await prisma.employee.findMany({
    orderBy: { name: 'asc' },
  });
}

export default async function EmployeesAdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'PATRON') {
    redirect('/dashboard');
  }

  const employees = await getEmployees();

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Gestion des Employés</h1>
        <CreateEmployeeDialog />
      </div>

      <div className="grid gap-4">
        {employees.map((employee: Employee) => (
          <div
            key={employee.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-neutral-800 rounded-lg shadow"
          >
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{employee.name}</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{employee.email}</p>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                <span
                  className="inline-block w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: employee.color ?? '#ccc' }}
                />
                {employee.role}
              </p>
            </div>
            <div className="flex gap-2">
              {employee.contractUrl && (
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={employee.contractUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contrat
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/employees/${employee.id}/edit`}>
                  Modifier
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}