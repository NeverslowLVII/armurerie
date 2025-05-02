'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface WeeklySale {
  id: number;
  horodateur: string;
  detenteur: string;
  nom_arme: string;
  serigraphie: string;
  prix: number;
}

export function WeeklySales() {
  const [sales, setSales] = useState<WeeklySale[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeeklySales = async () => {
      try {
        const response = await fetch('/api/employee/weekly-sales');
        const data = await response.json();
        setSales(data.sales);
        setTotalAmount(data.totalAmount);
      } catch {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les ventes de la semaine',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklySales();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg p-3"
            >
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
          Total des ventes
        </h3>
        <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-2xl font-bold text-transparent">
          {(totalAmount / 100).toLocaleString('us-US')} $
        </span>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mt-2 space-y-2"
      >
        {sales.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 py-6 dark:border-neutral-700/50 dark:bg-neutral-800/30"
          >
            <p className="text-neutral-500 dark:text-neutral-400">
              Aucune vente cette semaine
            </p>
            <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
              Les ventes apparaîtront ici
            </p>
          </motion.div>
        ) : (
          sales.map((sale, _index) => (
            <motion.div
              key={sale.id}
              variants={item}
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 p-3 transition-colors hover:border-green-200 dark:border-neutral-700/50 dark:bg-neutral-800/30 dark:hover:border-green-800/50"
            >
              <div>
                <p className="font-medium text-neutral-800 dark:text-neutral-200">
                  {sale.nom_arme}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Sérigraphie:{' '}
                  <span className="text-green-600 dark:text-green-400">
                    {sale.serigraphie}
                  </span>
                </p>
              </div>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {(sale.prix / 100).toLocaleString('us-US')} $
              </span>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}
