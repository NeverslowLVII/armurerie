'use client';

import Statistics from '@/components/statistics/index';
import type { Weapon } from '@/components/statistics/types';
import { getWeapons } from '@/services/api';
import { useEffect, useState } from 'react';
import type { JSX } from 'react';

export default function StatisticsPage() {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeapons = async () => {
      try {
        setLoading(true);
        const data = await getWeapons();
        setWeapons(data);
        setError(null);
      } catch (error_) {
        console.error('Failed to fetch weapons:', error_);
        setError('Failed to load weapons data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchWeapons();
  }, []);

  let content: JSX.Element | null = null;
  if (loading) {
    content = (
      <div className="py-10 text-center">
        <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-neutral-200 border-t-red-500 dark:border-neutral-700" />
        <p className="mt-4 text-neutral-600 dark:text-neutral-400">
          Chargement des données...
        </p>
      </div>
    );
  } else if (error) {
    content = (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          type="button"
          onClick={() => globalThis.location.reload()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  } else {
    content = (
      <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-neutral-800 dark:shadow-neutral-700">
        <Statistics weapons={weapons} />
      </div>
    );
  }

  return <div className="container mx-auto py-6">{content}</div>;
}
