'use client';

import { useEffect, useState } from 'react';
import Statistics from '@/components/statistics/index';
import { getWeapons } from '@/services/api';
import { Weapon } from '@/components/statistics/types';

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

  return (
    <div className="container mx-auto py-6">
      {loading ? (
        <div className="text-center py-10">
          <div className="w-16 h-16 border-4 border-t-red-500 border-neutral-200 dark:border-neutral-700 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">Chargement des données...</p>
        </div>
      ) : (error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button 
            onClick={() => globalThis.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 shadow-lg dark:shadow-neutral-700 rounded-lg p-6">
          <Statistics weapons={weapons} />
        </div>
      ))}
    </div>
  );
} 