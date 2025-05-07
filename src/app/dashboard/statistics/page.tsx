'use client';

import Statistics from '@/components/statistics/index';
import type { Weapon } from '@/components/statistics/types';
import { getWeapons } from '@/services/api';
import { useEffect, useState } from 'react';
import type { JSX } from 'react';

// Supprimer la constante MAX_WEAPONS_FOR_STATS
// const MAX_WEAPONS_FOR_STATS = 1000;

const BATCH_SIZE = 500; // Taille des lots pour la récupération des données

export default function StatisticsPage() {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0); // Pourcentage de chargement
  const [totalFetched, setTotalFetched] = useState<number>(0); // Nombre total d'armes récupérées

  useEffect(() => {
    const fetchAllWeapons = async () => {
      let allWeapons: Weapon[] = [];
      let currentPage = 1;
      let hasMoreData = true;
      let runningTotal = 0;
      let estimatedTotal = 0; // Sera mis à jour après le premier appel

      try {
        setLoading(true);
        setError(null);
        setProgress(0);
        setTotalFetched(0);

        do {
          const data = await getWeapons(currentPage, BATCH_SIZE);
          if (currentPage === 1 && data.totalCount) {
            estimatedTotal = data.totalCount;
          }

          if (data.weapons && data.weapons.length > 0) {
            allWeapons = allWeapons.concat(data.weapons);
            runningTotal += data.weapons.length;
            setTotalFetched(runningTotal);
            if (estimatedTotal > 0) {
              setProgress(Math.min(Math.round((runningTotal / estimatedTotal) * 100), 100));
            }
          } else {
            // S'il n'y a pas d'armes dans la réponse, ou si data.weapons est undefined
            hasMoreData = false; // Sortir de la boucle si aucune arme n'est retournée
            break;
          }

          // Si le nombre d'armes retournées est inférieur à BATCH_SIZE, c'est la dernière page
          if (data.weapons.length < BATCH_SIZE) {
            hasMoreData = false;
          }

          // Ou si nous avons déjà récupéré le total estimé (si disponible)
          if (estimatedTotal > 0 && runningTotal >= estimatedTotal) {
            hasMoreData = false;
          }

          currentPage += 1;
        } while (hasMoreData);

        setWeapons(allWeapons);
        setProgress(100); // Assurer que la progression est à 100% à la fin
      } catch (error_) {
        console.error('Failed to fetch all weapons:', error_);
        setError('Failed to load all weapons data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllWeapons();
  }, []);

  let content: JSX.Element | null = null;
  if (loading) {
    content = (
      <div className="py-10 text-center">
        <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-neutral-200 border-t-red-500 dark:border-neutral-700" />
        <p className="mt-4 text-neutral-600 dark:text-neutral-400">
          Chargement des données... {progress}% ({totalFetched} armes)
        </p>
        {/* Barre de progression */} 
        <div className="mt-2 w-full bg-neutral-200 rounded-full h-2.5 dark:bg-neutral-700">
          <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
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
      <div className="rounded-lg bg-background p-6 shadow-lg dark:bg-neutral-800 dark:shadow-neutral-700">
        <Statistics weapons={weapons} />
      </div>
    );
  }

  return <div className="container mx-auto py-6">{content}</div>;
}
