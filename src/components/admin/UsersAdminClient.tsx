'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CreateUserDialog } from '@/components/admin/CreateUserDialog';
import DeveloperManager from '@/components/admin/DeveloperManager';
import { UserCogIcon } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  color: string | null;
  contractUrl: string | null;
}

interface Props {
  users: User[];
}

export default function UsersAdminClient({ users }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const showDevelopers = searchParams?.get('showDevelopers') === 'true';

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Gestion des Utilisateurs</h1>
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
          <CreateUserDialog />
        </div>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-neutral-800 rounded-lg shadow"
          >
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{user.name}</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{user.email}</p>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                <span
                  className="inline-block w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: user.color ?? '#ccc' }}
                />
                {user.role}
              </p>
            </div>
            <div className="flex gap-2">
              {user.contractUrl && (
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={user.contractUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contrat
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/users/${user.id}/edit`}>
                  Modifier
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>

      <DeveloperManager
        open={showDevelopers}
        onClose={() => router.push('/admin/users')}
      />
    </div>
  );
} 