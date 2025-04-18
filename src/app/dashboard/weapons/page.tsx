'use client';

import WeaponsTable from '@/components/WeaponsTable';

export default function WeaponsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-neutral-800 dark:shadow-neutral-700">
        <WeaponsTable />
      </div>
    </div>
  );
}
