'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  let errorMessage = 'Une erreur est survenue lors de l\'authentification';

  switch (error) {
    case 'CredentialsSignin':
      errorMessage = 'Identifiants invalides';
      break;
    case 'AccessDenied':
      errorMessage = 'Accès refusé';
      break;
    case 'Verification':
      errorMessage = 'Le lien de vérification est invalide ou a expiré';
      break;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md w-full bg-white shadow-lg rounded-lg p-8"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur d&apos;authentification</h2>
        <p className="text-gray-600 mb-6">{errorMessage}</p>
        <Link
          href="/auth/signin"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Retour à la connexion
        </Link>
      </div>
    </motion.div>
  );
}

export default function AuthError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Suspense fallback={
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Chargement...</h2>
          </div>
        </div>
      }>
        <ErrorContent />
      </Suspense>
    </div>
  );
} 