"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import {
	AlertCircle,
	ArrowDownCircle,
	ArrowUpCircle,
	MinusCircle,
} from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";

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

export function WeaponComparison() {
	const [weapons, setWeapons] = useState<WeaponStats[]>([]);
	const [weapon1, setWeapon1] = useState<WeaponStats | null>(null);
	const [weapon2, setWeapon2] = useState<WeaponStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [hasError, setHasError] = useState(false);
	const { toast } = useToast();

	useEffect(() => {
		const fetchWeapons = async () => {
			try {
				setLoading(true);
				setHasError(false);
				const response = await axios.get("/weapons/catalog");
				setWeapons(response.data);
			} catch (error_) {
				console.error("Error fetching weapons:", error_);
				setHasError(true);
				toast({
					variant: "destructive",
					title: "Erreur de chargement",
					description:
						"Impossible de charger les données des armes. Veuillez réessayer ultérieurement.",
					duration: 5000,
				});
			} finally {
				setLoading(false);
			}
		};

		fetchWeapons();
	}, [toast]);

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

	if (hasError && weapons.length === 0) {
		return (
			<div className="rounded-lg border border-red-300 dark:border-red-700/40 bg-red-50 dark:bg-red-900/20 p-5 shadow-md text-red-700 dark:text-red-300">
				<div className="flex items-center gap-2.5">
					<AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
					<p className="font-semibold text-md">Erreur de Chargement</p>
				</div>
				<p className="mt-1.5 text-sm ml-[30px]">
					Impossible de charger les données des armes. Veuillez réessayer
					ultérieurement.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card className="flex-1 bg-white dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
					<CardHeader className="pb-3 pt-5 px-5">
						<CardTitle className="text-lg font-semibold text-zinc-700 dark:text-zinc-200">
							Arme 1
						</CardTitle>
					</CardHeader>
					<CardContent className="px-5 pb-5">
						<Select
							onValueChange={handleWeapon1Change}
							value={weapon1?.name || ""}
						>
							<SelectTrigger
								aria-label="Sélectionner la première arme"
								className="h-11 w-full bg-white dark:bg-zinc-700/70 border-zinc-300 dark:border-zinc-600 rounded-lg text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/40 shadow-sm hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors data-[placeholder]:text-zinc-500 dark:data-[placeholder]:text-zinc-400 px-3.5"
							>
								<SelectValue placeholder="Sélectionner une arme" />
							</SelectTrigger>
							<SelectContent className="max-h-[300px] bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 shadow-xl rounded-lg text-sm p-1.5">
								{weaponCategories.map((category) => (
									<div key={category} className="mb-1">
										<div className="px-2.5 py-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-700/50 rounded-md mb-1 sticky top-0">
											{category}
										</div>
										{weapons
											.filter((weapon) => weapon.category === category)
											.map((weapon) => (
												<SelectItem
													key={weapon.name}
													value={weapon.name}
													className="text-zinc-800 hover:bg-zinc-100 focus:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:focus:bg-zinc-700/80 rounded-md cursor-pointer px-2.5 py-2"
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

				<Card className="flex-1 bg-white dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
					<CardHeader className="pb-3 pt-5 px-5">
						<CardTitle className="text-lg font-semibold text-zinc-700 dark:text-zinc-200">
							Arme 2
						</CardTitle>
					</CardHeader>
					<CardContent className="px-5 pb-5">
						<Select
							onValueChange={handleWeapon2Change}
							value={weapon2?.name || ""}
						>
							<SelectTrigger
								aria-label="Sélectionner la deuxième arme"
								className="h-11 w-full bg-white dark:bg-zinc-700/70 border-zinc-300 dark:border-zinc-600 rounded-lg text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/40 shadow-sm hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors data-[placeholder]:text-zinc-500 dark:data-[placeholder]:text-zinc-400 px-3.5"
							>
								<SelectValue placeholder="Sélectionner une arme" />
							</SelectTrigger>
							<SelectContent className="max-h-[300px] bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 shadow-xl rounded-lg text-sm p-1.5">
								{weaponCategories.map((category) => (
									<div key={category} className="mb-1">
										<div className="px-2.5 py-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-700/50 rounded-md mb-1 sticky top-0">
											{category}
										</div>
										{weapons
											.filter((weapon) => weapon.category === category)
											.map((weapon) => (
												<SelectItem
													key={weapon.name}
													value={weapon.name}
													className="text-zinc-800 hover:bg-zinc-100 focus:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:focus:bg-zinc-700/80 rounded-md cursor-pointer px-2.5 py-2"
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

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="space-y-6">
					{weapon1 ? (
						<Card className="bg-white dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
							<CardHeader className="pb-3 pt-5 px-5 border-b border-zinc-100 dark:border-zinc-700/40">
								<CardTitle className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
									{weapon1.name}
								</CardTitle>
								<CardDescription className="text-sm text-zinc-500 dark:text-zinc-400 pt-0.5">
									{weapon1.category}
								</CardDescription>
							</CardHeader>
							<CardContent className="p-5">
								<div className="space-y-2.5">
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
						<Card className="flex min-h-[300px] items-center justify-center p-6 text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-800/40 border-2 border-dashed border-zinc-200 dark:border-zinc-700/50 rounded-xl shadow-sm hover:border-red-400/70 dark:hover:border-red-500/60 hover:text-red-500 dark:hover:text-red-400 transition-colors group">
							<div className="text-center space-y-3">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="currentColor"
									className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500 group-hover:text-red-500/80 dark:group-hover:text-red-400/80 transition-colors"
									aria-hidden="true"
								>
									<title>Rechercher une arme</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6"
									/>
								</svg>
								<p className="font-medium text-lg">
									Sélectionnez l&apos;Arme 1
								</p>
								<p className="text-sm text-zinc-400 dark:text-zinc-500">
									Choisissez une arme dans la liste ci-dessus pour afficher ses
									statistiques.
								</p>
							</div>
						</Card>
					)}
				</div>

				<div className="space-y-6">
					{weapon2 ? (
						<Card className="bg-white dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
							<CardHeader className="pb-3 pt-5 px-5 border-b border-zinc-100 dark:border-zinc-700/40">
								<CardTitle className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
									{weapon2.name}
								</CardTitle>
								<CardDescription className="text-sm text-zinc-500 dark:text-zinc-400 pt-0.5">
									{weapon2.category}
								</CardDescription>
							</CardHeader>
							<CardContent className="p-5">
								<div className="space-y-2.5">
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
						<Card className="flex min-h-[300px] items-center justify-center p-6 text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-800/40 border-2 border-dashed border-zinc-200 dark:border-zinc-700/50 rounded-xl shadow-sm hover:border-red-400/70 dark:hover:border-red-500/60 hover:text-red-500 dark:hover:text-red-400 transition-colors group">
							<div className="text-center space-y-3">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="currentColor"
									className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500 group-hover:text-red-500/80 dark:group-hover:text-red-400/80 transition-colors"
									aria-hidden="true"
								>
									<title>Rechercher une arme</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6"
									/>
								</svg>
								<p className="font-medium text-lg">
									Sélectionnez l&apos;Arme 2
								</p>
								<p className="text-sm text-zinc-400 dark:text-zinc-500">
									Choisissez une arme dans la liste ci-dessus pour afficher ses
									statistiques.
								</p>
							</div>
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
	showTrend?: boolean;
}

function StatRow({
	label,
	value,
	compareValue,
	format = (v) => `${v}`,
	isLowerBetter = false,
	showTrend = true,
}: StatRowProps) {
	let trend: "better" | "worse" | "equal" | null = null;
	let TrendIcon = null;
	let iconColorClass = "text-zinc-500 dark:text-zinc-400";

	if (compareValue !== undefined && value !== undefined) {
		if (value === compareValue) {
			trend = "equal";
			TrendIcon = MinusCircle;
			iconColorClass = "text-zinc-500 dark:text-zinc-400";
		} else if (isLowerBetter ? value < compareValue : value > compareValue) {
			trend = "better";
			TrendIcon = ArrowUpCircle;
			iconColorClass = "text-green-500 dark:text-green-400";
		} else {
			trend = "worse";
			TrendIcon = ArrowDownCircle;
			iconColorClass = "text-red-500 dark:text-red-400";
		}
	}

	const valueTextClass =
		trend === "better"
			? "text-green-600 dark:text-green-400"
			: trend === "worse"
				? "text-red-600 dark:text-red-500"
				: "text-zinc-800 dark:text-zinc-100";

	return (
		<div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 py-3 last:border-b-0">
			<span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
			<span
				className={`flex items-center text-sm font-semibold tabular-nums ${valueTextClass}`}
			>
				{showTrend && TrendIcon && (
					<TrendIcon className={`mr-1.5 h-4 w-4 shrink-0 ${iconColorClass}`} />
				)}
				{format(value)}
			</span>
		</div>
	);
}
