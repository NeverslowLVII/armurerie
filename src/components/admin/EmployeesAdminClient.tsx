'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CreateEmployeeDialog } from '@/components/admin/CreateEmployeeDialog';
import DeveloperManager from '@/components/admin/DeveloperManager';
import { UserCogIcon } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  color: string | null;
  contractUrl: string | null;
}

interface Props {
  employees: Employee[];
}

export default function EmployeesAdminClient({ employees }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const showDevelopers = searchParams.get('showDevelopers') === 'true';

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Gestion des Employés</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="flex items-center space-x-2"
            asChild
          >
            <Link href="?showDevelopers=true">
              <UserCogIcon className="h-4 w-4" />
              <span>Gérer les développeurs</span>
            </Link>
          </Button>
          <CreateEmployeeDialog />
        </div>
      </div>

      <div className="grid gap-4">
        {employees.map((employee) => (
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

      <DeveloperManager
        open={showDevelopers}
        onClose={() => router.push('/admin/employees')}
      />
    </div>
  );
} 