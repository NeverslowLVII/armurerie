'use client';

import Navbar from '@/components/Navbar';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import FeedbackManager from '@/components/FeedbackManager';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isFeedbackManagerOpen, setIsFeedbackManagerOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <div className="relative min-h-screen bg-white dark:bg-neutral-900">
      <Navbar />
      <div className="pt-28">{children}</div>

      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsFeedbackManagerOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 p-0 text-white shadow-lg transition-transform duration-200 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
          aria-label="Ouvrir le formulaire de retour"
        >
          <ChatBubbleLeftEllipsisIcon className="h-7 w-7" />
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
