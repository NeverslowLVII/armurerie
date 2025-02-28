'use client';

import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';

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
      } catch (error) {
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
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Total des ventes</h3>
        <span className="text-2xl font-bold">{totalAmount}$</span>
      </div>

      <div className="space-y-2">
        {sales.length === 0 ? (
          <p className="text-gray-500">Aucune vente cette semaine</p>
        ) : (
          sales.map((sale) => (
            <div
              key={sale.id}
              className="flex justify-between items-center p-2 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium">{sale.nom_arme}</p>
                <p className="text-sm text-gray-500">
                  Sérigraphie: {sale.serigraphie}
                </p>
              </div>
              <span className="font-semibold">{sale.prix}$</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 