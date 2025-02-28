'use client';

import WeaponsTable from '@/components/WeaponsTable';

export default function WeaponsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="bg-white dark:bg-neutral-800 shadow-lg dark:shadow-neutral-700 rounded-lg p-6">
        <WeaponsTable />
      </div>
    </div>
  );
} 