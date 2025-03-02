'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { SkeletonLoading } from '@/components/ui/loading';
import { Skeleton } from '@/components/ui/skeleton';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');
  
  let errorMessage = "Une erreur s'est produite lors de l'authentification.";
  let errorDescription = "Veuillez réessayer ou contacter l'administrateur.";
  
  switch (error) {
    case 'CredentialsSignin': {
      errorMessage = "Échec de connexion";
      errorDescription = "Les identifiants fournis sont incorrects. Veuillez vérifier votre email et mot de passe.";
      break;
    }
    case 'AccessDenied': {
      errorMessage = "Accès refusé";
      errorDescription = "Vous n'avez pas les permissions nécessaires pour accéder à cette ressource.";
      break;
    }
    case 'OAuthSignin':
    case 'OAuthCallback':
    case 'OAuthCreateAccount':
    case 'EmailCreateAccount':
    case 'Callback':
    case 'OAuthAccountNotLinked':
    case 'EmailSignin':
    case 'CredentialsSignup':
    case 'SessionRequired': {
      errorMessage = "Erreur d'authentification";
      errorDescription = "Une erreur s'est produite lors du processus d'authentification. Veuillez réessayer.";
      break;
    }
    default: {
      // Use default message
      break;
    }
  }

  return (
    <div className="max-w-md w-full bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-8">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
        </div>
        <h2 className="mt-3 text-2xl font-bold text-red-600 dark:text-red-400">{errorMessage}</h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-300">{errorDescription}</p>
        <div className="mt-6">
          <Link
            href="/auth/signin"
            className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-neutral-900">
      <Suspense fallback={
        <SkeletonLoading isLoading={true}>
          <div className="max-w-md w-full bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-8">
            <div className="text-center">
              <Skeleton className="h-12 w-12 rounded-full mx-auto" />
              <Skeleton className="h-8 w-64 mx-auto mt-3" />
              <Skeleton className="h-4 w-full mx-auto mt-2" />
              <Skeleton className="h-10 w-48 mx-auto mt-6" />
            </div>
          </div>
        </SkeletonLoading>
      }>
        <ErrorContent />
      </Suspense>
    </div>
  );
} 