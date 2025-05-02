import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authOptions } from '@/lib/auth';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Tableau de bord - Armurerie',
  description: 'Votre espace personnel',
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto bg-white py-10 dark:bg-neutral-900">
      <h1 className="mb-8 text-3xl font-bold text-neutral-900 dark:text-white">
        Bienvenue, {session.user.name}
      </h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-neutral-900 dark:text-white">
              Profil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-neutral-700 dark:text-neutral-300">
              <p>
                <span className="font-semibold">Nom :</span> {session.user.name}
              </p>
              <p>
                <span className="font-semibold">Email :</span>{' '}
                {session.user.email}
              </p>
              <p>
                <span className="font-semibold">Rôle :</span>{' '}
                {session.user.role}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-neutral-900 dark:text-white">
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-neutral-700 dark:text-neutral-300">
              <p>
                <a
                  href="/api/contract"
                  className="text-blue-500 hover:underline dark:text-blue-400 dark:hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Voir mon contrat de travail
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {session.user.role === 'PATRON' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-neutral-900 dark:text-white">
                Administration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-neutral-700 dark:text-neutral-300">
                <p>
                  <a
                    href="/admin/employees"
                    className="text-blue-500 hover:underline dark:text-blue-400 dark:hover:underline"
                  >
                    Gérer les employés
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
