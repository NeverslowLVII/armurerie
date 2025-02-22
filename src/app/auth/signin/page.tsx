'use client';

import { Suspense } from 'react';
import SignInPage from '@/components/auth/SignInPage';

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    }>
      <SignInPage />
    </Suspense>
  );
}