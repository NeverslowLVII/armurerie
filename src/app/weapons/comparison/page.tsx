"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeaponComparison } from "@/components/weapons/WeaponComparison";
import { WeaponOrderCalculator } from "@/components/weapons/WeaponOrderCalculator";
import React, { Suspense, useMemo } from "react";

const WeaponComparisonSkeleton = () => (
	<div className="space-y-6 animate-pulse">
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div>
				<Skeleton className="mb-2.5 h-5 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
				<Skeleton className="h-10 w-full bg-zinc-200 dark:bg-zinc-700 rounded-md" />
			</div>
			<div>
				<Skeleton className="mb-2.5 h-5 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
				<Skeleton className="h-10 w-full bg-zinc-200 dark:bg-zinc-700 rounded-md" />
			</div>
		</div>
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			<Skeleton className="h-64 w-full bg-zinc-100 dark:bg-zinc-700/60 rounded-lg" />
			<Skeleton className="h-64 w-full bg-zinc-100 dark:bg-zinc-700/60 rounded-lg" />
		</div>
	</div>
);

const WeaponOrderSkeleton = () => {
	const skeletonItems = useMemo(
		() => Array.from({ length: 5 }, (_, i) => ({ id: `wo-skel-item-${i}` })),
		[],
	);

	return (
		<div className="space-y-8 animate-pulse">
			<div className="max-h-64 space-y-3 overflow-y-auto pr-2">
				{skeletonItems.map((item) => (
					<div
						key={item.id}
						className="flex items-center space-x-3 border-b border-zinc-200 dark:border-zinc-700/60 py-2.5"
					>
						<Skeleton className="h-5 w-5 bg-zinc-200 dark:bg-zinc-700 rounded-md" />
						<Skeleton className="h-5 w-full max-w-xs bg-zinc-200 dark:bg-zinc-700 rounded" />
					</div>
				))}
			</div>
			<Skeleton className="h-80 w-full bg-zinc-100 dark:bg-zinc-700/60 rounded-lg" />
		</div>
	);
};

export default function WeaponComparisonPage() {
	return (
		<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-6 lg:p-8">
			<div className="container mx-auto max-w-screen-xl">
				<header className="mb-10 text-center md:text-left">
					<h1 className="text-3xl sm:text-4xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">
						Comparateur d&apos;Armes
					</h1>
					<p className="text-base text-zinc-500 dark:text-zinc-400 mt-2 max-w-2xl md:max-w-none mx-auto md:mx-0">
						Analysez, comparez et préparez vos commandes d&apos;armement.
					</p>
				</header>

				<Tabs defaultValue="comparison" className="w-full">
					<TabsList className="flex items-center justify-start border-b border-zinc-200 dark:border-zinc-700/60 mb-8 space-x-2">
						<TabsTrigger
							value="comparison"
							className="relative px-4 py-2.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-500 data-[state=active]:font-semibold transition-all duration-150 after:content-[''] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2.5px] after:bg-red-600 dark:after:bg-red-500 after:scale-x-0 after:transition-transform after:duration-200 after:ease-out data-[state=active]:after:scale-x-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 ring-offset-zinc-50 dark:ring-offset-zinc-950 rounded-none"
						>
							Comparaison
						</TabsTrigger>
						<TabsTrigger
							value="order"
							className="relative px-4 py-2.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-500 data-[state=active]:font-semibold transition-all duration-150 after:content-[''] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2.5px] after:bg-red-600 dark:after:bg-red-500 after:scale-x-0 after:transition-transform after:duration-200 after:ease-out data-[state=active]:after:scale-x-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 ring-offset-zinc-50 dark:ring-offset-zinc-950 rounded-none"
						>
							Commander
						</TabsTrigger>
					</TabsList>

					<TabsContent value="comparison" className="m-0">
						<Card className="p-6 sm:p-8 bg-white dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 rounded-xl shadow-lg">
							<h2 className="mb-6 text-xl sm:text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
								Comparaison des Armes
							</h2>
							<Suspense fallback={<WeaponComparisonSkeleton />}>
								<WeaponComparison />
							</Suspense>
						</Card>
					</TabsContent>

					<TabsContent value="order" className="m-0">
						<Card className="p-6 sm:p-8 bg-white dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 rounded-xl shadow-lg">
							<h2 className="mb-6 text-xl sm:text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
								Passer une Commande
							</h2>
							<Suspense fallback={<WeaponOrderSkeleton />}>
								<WeaponOrderCalculator />
							</Suspense>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
