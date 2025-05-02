'use client';

import FeedbackManager from '@/components/FeedbackManager';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import type React from 'react';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const [isFeedbackManagerOpen, setIsFeedbackManagerOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <div className="relative min-h-screen bg-white dark:bg-neutral-900">
      <Navbar />
      <div className="pt-28">{children}</div>

      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsFeedbackManagerOpen(true)}
          className="rounded-md bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 px-4 py-2 text-white shadow-lg transition-transform duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
          aria-label="Envoyer un télégramme"
        >
          Envoyer un télégramme
        </Button>
      </div>

      <FeedbackManager
        open={isFeedbackManagerOpen}
        onClose={() => setIsFeedbackManagerOpen(false)}
        userId={session?.user?.id ? Number(session.user.id) : undefined}
      />
    </div>
  );
}
