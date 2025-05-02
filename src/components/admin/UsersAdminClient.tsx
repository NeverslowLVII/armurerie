'use client';

import { CreateUserDialog } from '@/components/admin/CreateUserDialog';
import { Button } from '@/components/ui/button';
import { UserCogIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

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

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          Gestion des Utilisateurs
        </h1>
        <div className="flex items-center space-x-2">
          <CreateUserDialog />
        </div>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between rounded-lg bg-white p-4 shadow dark:bg-neutral-800"
          >
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                {user.name}
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {user.email}
              </p>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                <span
                  className="mr-2 inline-block h-3 w-3 rounded-full"
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
                <Link href={`/admin/users/${user.id}/edit`}>Modifier</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
