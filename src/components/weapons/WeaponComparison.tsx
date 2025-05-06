'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import { AlertCircle } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

interface WeaponStats {
  id?: string;
  name: string;
  category: string;
  puissance: number;
  cadence: number;
  precision: number;
  portee: number;
  capacite: number;
  recharge: number;
}

/**
 * WeaponComparison Component
 * Allows users to compare two weapons side by side
 */
export function WeaponComparison() {
  const [weapons, setWeapons] = useState<WeaponStats[]>([]);
  const [weapon1, setWeapon1] = useState<WeaponStats | null>(null);
  const [weapon2, setWeapon2] = useState<WeaponStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();

  // Fetch weapons data
  useEffect(() => {
    const fetchWeapons = async () => {
      try {
        setLoading(true);
        setHasError(false);
        const response = await axios.get('/weapons/catalog');
        setWeapons(response.data);
      } catch (error_) {
        console.error('Error fetching weapons:', error_);
        setHasError(true);
        toast({
          variant: 'destructive',
          title: 'Erreur de chargement',
          description:
            'Impossible de charger les données des armes. Veuillez réessayer ultérieurement.',
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWeapons();
  }, [toast]);

  // Memoize weapon categories for better performance
  const weaponCategories = useMemo(() => {
    const categories = [...new Set(weapons.map((weapon) => weapon.category))];
    return categories.sort();
  }, [weapons]);

  const handleWeapon1Change = (value: string) => {
    const selectedWeapon = weapons.find((w) => w.name === value) || null;
    setWeapon1(selectedWeapon);
  };

  const handleWeapon2Change = (value: string) => {
    const selectedWeapon = weapons.find((w) => w.name === value) || null;
    setWeapon2(selectedWeapon);
  };

  // Loading state with skeleton UI
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-[240px] w-full rounded-md" />
          <Skeleton className="h-[240px] w-full rounded-md" />
        </div>
      </div>
    );
  }

  // Error state shown inline if the toast didn't display
  if (hasError && weapons.length === 0) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-200">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <p className="font-medium">Erreur de chargement</p>
        </div>
        <p className="mt-1 text-sm">
          Impossible de charger les données des armes. Veuillez réessayer
          ultérieurement.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Arme 1</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              onValueChange={handleWeapon1Change}
              value={weapon1?.name || ''}
            >
              <SelectTrigger aria-label="Sélectionner la première arme">
                <SelectValue placeholder="Sélectionner une arme" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] border border-neutral-200 bg-background dark:border-neutral-800 dark:bg-neutral-950">
                {weaponCategories.map((category) => (
                  <div key={category}>
                    <div className="bg-neutral-50 px-2 py-1.5 text-sm font-semibold text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                      {category}
                    </div>
                    {weapons
                      .filter((weapon) => weapon.category === category)
                      .map((weapon) => (
                        <SelectItem
                          key={weapon.name}
                          value={weapon.name}
                          className="text-neutral-800 hover:bg-neutral-100 focus:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
                        >
                          {weapon.name}
                        </SelectItem>
                      ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Arme 2</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              onValueChange={handleWeapon2Change}
              value={weapon2?.name || ''}
            >
              <SelectTrigger aria-label="Sélectionner la deuxième arme">
                <SelectValue placeholder="Sélectionner une arme" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] border border-neutral-200 bg-background dark:border-neutral-800 dark:bg-neutral-950">
                {weaponCategories.map((category) => (
                  <div key={category}>
                    <div className="bg-neutral-50 px-2 py-1.5 text-sm font-semibold text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                      {category}
                    </div>
                    {weapons
                      .filter((weapon) => weapon.category === category)
                      .map((weapon) => (
                        <SelectItem
                          key={weapon.name}
                          value={weapon.name}
                          className="text-neutral-800 hover:bg-neutral-100 focus:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
                        >
                          {weapon.name}
                        </SelectItem>
                      ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          {weapon1 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {weapon1.name}
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  {weapon1.category}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  <StatRow
                    label="Puissance"
                    value={weapon1.puissance}
                    compareValue={weapon2?.puissance}
                    format={(v) => v.toFixed(1)}
                  />
                  <StatRow
                    label="Cadence"
                    value={weapon1.cadence}
                    compareValue={weapon2?.cadence}
                    format={(v) => v.toFixed(1)}
                  />
                  <StatRow
                    label="Précision"
                    value={weapon1.precision}
                    compareValue={weapon2?.precision}
                    format={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                  <StatRow
                    label="Portée"
                    value={weapon1.portee}
                    compareValue={weapon2?.portee}
                    format={(v) => `${v}m`}
                  />
                  <StatRow
                    label="Capacité"
                    value={weapon1.capacite}
                    compareValue={weapon2?.capacite}
                  />
                  <StatRow
                    label="Temps de recharge"
                    value={weapon1.recharge}
                    compareValue={weapon2?.recharge}
                    format={(v) => `${v.toFixed(1)}s`}
                    isLowerBetter
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex min-h-[240px] items-center justify-center p-6 text-neutral-500 dark:text-neutral-400">
              <p className="text-center">
                Sélectionnez une arme pour afficher ses statistiques
              </p>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {weapon2 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {weapon2.name}
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  {weapon2.category}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  <StatRow
                    label="Puissance"
                    value={weapon2.puissance}
                    compareValue={weapon1?.puissance}
                    format={(v) => v.toFixed(1)}
                  />
                  <StatRow
                    label="Cadence"
                    value={weapon2.cadence}
                    compareValue={weapon1?.cadence}
                    format={(v) => v.toFixed(1)}
                  />
                  <StatRow
                    label="Précision"
                    value={weapon2.precision}
                    compareValue={weapon1?.precision}
                    format={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                  <StatRow
                    label="Portée"
                    value={weapon2.portee}
                    compareValue={weapon1?.portee}
                    format={(v) => `${v}m`}
                  />
                  <StatRow
                    label="Capacité"
                    value={weapon2.capacite}
                    compareValue={weapon1?.capacite}
                  />
                  <StatRow
                    label="Temps de recharge"
                    value={weapon2.recharge}
                    compareValue={weapon1?.recharge}
                    format={(v) => `${v.toFixed(1)}s`}
                    isLowerBetter
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex min-h-[240px] items-center justify-center p-6 text-neutral-500 dark:text-neutral-400">
              <p className="text-center">
                Sélectionnez une arme pour afficher ses statistiques
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatRowProps {
  label: string;
  value: number;
  compareValue?: number | undefined;
  format?: (value: number) => string;
  isLowerBetter?: boolean;
}

function StatRow({
  label,
  value,
  compareValue,
  format = (v) => `${v}`,
  isLowerBetter = false,
}: StatRowProps) {
  let comparison = null;
  if (compareValue !== undefined) {
    comparison = isLowerBetter ? value < compareValue : value > compareValue;
  }

  let textClass = 'text-neutral-800 dark:text-neutral-200';
  if (comparison !== null) {
    textClass = comparison
      ? 'text-green-600 dark:text-green-500'
      : 'text-red-600 dark:text-red-400';
  }

  return (
    <div className="flex justify-between border-b border-neutral-100 py-1.5 last:border-0 dark:border-neutral-700">
      <span className="text-sm text-neutral-600 dark:text-neutral-300">
        {label}
      </span>
      <span className={`text-sm font-medium tabular-nums ${textClass}`}>
        {format(value)}
      </span>
    </div>
  );
}
