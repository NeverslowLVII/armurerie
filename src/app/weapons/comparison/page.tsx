"use client";

import React, { Suspense } from 'react';
import { WeaponComparison } from '@/components/weapons/WeaponComparison';
import { WeaponOrderCalculator } from '@/components/weapons/WeaponOrderCalculator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

/**
 * Skeleton component for loading state
 */
const WeaponComparisonSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Skeleton className="h-5 w-16 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div>
        <Skeleton className="h-5 w-16 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-[240px] w-full rounded-md" />
      <Skeleton className="h-[240px] w-full rounded-md" />
    </div>
  </div>
);

/**
 * Skeleton component for order calculator loading state
 */
const WeaponOrderSkeleton = () => (
  <div className="space-y-6">
    <div className="max-h-60 space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-2 py-1 border-b">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-5 w-full max-w-[200px]" />
        </div>
      ))}
    </div>
    <Skeleton className="h-[320px] w-full rounded-md" />
  </div>
);

/**
 * Weapon Comparison Page Component
 * Displays a side-by-side comparison tool for weapons and an order calculator
 * 
 * Note: The API endpoint has been fixed to use /weapons/catalog directly
 * instead of /api/weapons/catalog to avoid path duplication.
 */
export default function WeaponComparisonPage() {
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6">
      <h1 className="text-3xl font-bold mb-6 text-neutral-900 dark:text-white">
        Comparateur d&apos;Armes - Saint-Denis
      </h1>
      
      <Tabs defaultValue="comparison" className="space-y-6">
        <TabsList className="w-full max-w-md mx-auto mb-2">
          <TabsTrigger value="comparison" className="flex-1">
            Comparaison
          </TabsTrigger>
          <TabsTrigger value="order" className="flex-1">
            Commander
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="m-0">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-neutral-900 dark:text-white">
              Comparaison des Armes
            </h2>
            <Suspense fallback={<WeaponComparisonSkeleton />}>
              <WeaponComparison />
            </Suspense>
          </Card>
        </TabsContent>
        
        <TabsContent value="order" className="m-0">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-neutral-900 dark:text-white">
              Passer une Commande
            </h2>
            <Suspense fallback={<WeaponOrderSkeleton />}>
              <WeaponOrderCalculator />
            </Suspense>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 