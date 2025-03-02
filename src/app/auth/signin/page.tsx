'use client';

import { Suspense } from 'react';
import SignInPage from '@/components/auth/SignInPage';
import { FullPageSkeletonLoading } from '@/components/ui/loading';
import { Skeleton } from '@/components/ui/skeleton';

export default function Page() {
  return (
    <Suspense fallback={
      <FullPageSkeletonLoading>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-6 w-full max-w-md mx-auto" />
          <div className="space-y-4 max-w-md mx-auto">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </FullPageSkeletonLoading>
    }>
      <SignInPage />
    </Suspense>
  );
}