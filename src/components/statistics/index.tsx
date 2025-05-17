import { Tab } from "@headlessui/react";
import {
	ChartBarIcon,
	CheckCircleIcon,
	CurrencyDollarIcon,
	UsersIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence } from "framer-motion";
import type React from "react";
import { useMemo, useState } from "react";
import DateRangeSelector from "./DateRangeSelector";
import EmployeesTab from "./EmployeesTab";
import IncomeStatementTab from "./IncomeStatementTab";
import OverviewTab from "./OverviewTab";
import WeaponsTab from "./WeaponsTab";
import type { DateRange, TabType, Weapon } from "./types";
import { normalizeWeapon } from "./types";
import { formatDate, getPresets, normalizeWeaponName } from "./utils";

interface StatisticsProps {
	weapons: Weapon[];
}

const TAX_RATE = 0.1;

const Statistics: React.FC<StatisticsProps> = ({ weapons }) => {
	const [selectedTab, setSelectedTab] = useState<TabType>("overview");
	const [activeDatePreset, setActiveDatePreset] = useState<number>(0);

	const initialPreset = getPresets()[0];
	const [dateRange, setDateRange] = useState<DateRange>({
		startDate: initialPreset.startDate,
		endDate: initialPreset.endDate,
	});

	const handleDateRangeChange = (newDateRange: DateRange) => {
		setDateRange(newDateRange);
		setActiveDatePreset(-1);
	};

	const handlePresetClick = (presetIndex: number) => {
		const preset = getPresets()[presetIndex];
		setDateRange({
			startDate: preset.startDate,
			endDate: preset.endDate,
		});
		setActiveDatePreset(presetIndex);
	};

	const normalizedWeapons = useMemo(() => {
		return weapons.map((weapon) => normalizeWeapon(weapon));
	}, [weapons]);

	const filteredWeapons = useMemo(() => {
		return normalizedWeapons.filter((weapon) => {
			const weaponDate = new Date(weapon.horodateur);
			return (
				weaponDate >= dateRange.startDate && weaponDate <= dateRange.endDate
			);
		});
	}, [normalizedWeapons, dateRange]);

	const weaponStats = useMemo(() => {
		if (filteredWeapons.length === 0) {
			return {
				totalWeapons: 0,
				totalValue: 0,
				totalCostProduction: 0,
				totalProfit: 0,
				totalTaxes: 0,
				profitAfterTaxes: 0,
				averagePrice: 0,
				averageCostProduction: 0,
				averageProfit: 0,
				profitMargin: 0,
				weaponTypes: [],
				dailyStats: [],
				profitByType: [],
			};
		}

		const totalWeapons = filteredWeapons.length;
		const totalValue = filteredWeapons.reduce(
			(sum, weapon) => sum + weapon.prix,
			0,
		);
		const totalCostProduction = filteredWeapons.reduce((sum, weapon) => {
			return sum + (weapon.cout_production ?? 0);
		}, 0);

		const totalProfit = totalValue - totalCostProduction;
		const totalTaxes = Math.round(totalProfit * TAX_RATE);
		const profitAfterTaxes = totalProfit - totalTaxes;

		const averagePrice = Math.round(totalValue / totalWeapons);
		const averageCostProduction = Math.round(
			totalCostProduction / totalWeapons,
		);
		const averageProfit = Math.round(totalProfit / totalWeapons);
		const profitMargin = totalValue > 0 ? (totalProfit / totalValue) * 100 : 0;

		const weaponsByType = filteredWeapons.reduce(
			(acc, weapon) => {
				const normalizedName = normalizeWeaponName(weapon.nom_arme);
				if (!acc[normalizedName]) {
					acc[normalizedName] = [];
				}
				acc[normalizedName].push(weapon);
				return acc;
			},
			{} as Record<string, Weapon[]>,
		);

		const weaponTypes = Object.entries(weaponsByType)
			.map(([name, typeWeapons]) => ({
				name,
				count: typeWeapons.length,
			}))
			.sort((a, b) => b.count - a.count);

		const profitByType = Object.entries(weaponsByType)
			.map(([name, typeWeapons]) => {
				const totalTypeValue = typeWeapons.reduce(
					(sum, weapon) => sum + weapon.prix,
					0,
				);
				const totalTypeCost = typeWeapons.reduce(
					(sum, weapon) => sum + (weapon.cout_production || 0),
					0,
				);
				const typeProfit = totalTypeValue - totalTypeCost;

				return {
					name,
					profit: typeProfit,
					count: typeWeapons.length,
				};
			})
			.sort((a, b) => b.profit - a.profit);

		const salesByDay = filteredWeapons.reduce(
			(acc, weapon) => {
				const day = formatDate(new Date(weapon.horodateur));
				if (!acc[day]) {
					acc[day] = {
						totalValue: 0,
						totalCost: 0,
						totalProfit: 0,
						count: 0,
					};
				}

				acc[day].totalValue += weapon.prix;
				acc[day].totalCost += weapon.cout_production ?? 0;
				acc[day].totalProfit += weapon.prix - (weapon.cout_production ?? 0);
				acc[day].count += 1;

				return acc;
			},
			{} as Record<
				string,
				{
					totalValue: number;
					totalCost: number;
					totalProfit: number;
					count: number;
				}
			>,
		);

		const dailyStats = Object.entries(salesByDay)
			.map(([day, stats]) => ({
				day,
				...stats,
			}))
			.sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());

		return {
			totalWeapons,
			totalValue,
			totalCostProduction,
			totalProfit,
			totalTaxes,
			profitAfterTaxes,
			averagePrice,
			averageCostProduction,
			averageProfit,
			profitMargin,
			weaponTypes,
			dailyStats,
			profitByType,
		};
	}, [filteredWeapons]);

	const employeeStats = useMemo(() => {
		const employeeWeapons = filteredWeapons.reduce(
			(acc, weapon) => {
				const employeeName = weapon.user?.name || "Inconnu";
				if (!acc[employeeName]) {
					acc[employeeName] = [];
				}
				acc[employeeName].push(weapon);
				return acc;
			},
			{} as Record<string, Weapon[]>,
		);

		const employeeWeaponCounts = Object.entries(employeeWeapons).reduce(
			(acc, [name, empWeapons]) => {
				acc[name] = empWeapons.length;
				return acc;
			},
			{} as Record<string, number>,
		);

		const employeeValueTotals = Object.entries(employeeWeapons).reduce(
			(acc, [name, empWeapons]) => {
				acc[name] = empWeapons.reduce((sum, weapon) => sum + weapon.prix, 0);
				return acc;
			},
			{} as Record<string, number>,
		);

		const employeeProfits = Object.entries(employeeWeapons)
			.map(([name, empWeapons]) => {
				const totalValue = empWeapons.reduce(
					(sum, weapon) => sum + weapon.prix,
					0,
				);
				const totalCost = empWeapons.reduce(
					(sum, weapon) => sum + (weapon.cout_production ?? 0),
					0,
				);
				const profit = totalValue - totalCost;

				const commissionRate = empWeapons[0]?.user?.commission ?? 0.1;
				const commission = Math.round(profit * commissionRate);

				return {
					name,
					profit,
					sales: empWeapons.length,
					commission,
					role: empWeapons[0]?.user?.role || "EMPLOYEE",
					commissionRate,
				};
			})
			.sort((a, b) => b.profit - a.profit);

		const topEmployee = Object.entries(employeeWeaponCounts).reduce(
			(top, [name, count]) => {
				if (!top || count > top.count) {
					return { name, count };
				}
				return top;
			},
			null as { name: string; count: number } | null,
		);

		const employeePerformance = Object.entries(employeeWeaponCounts)
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count);

		return {
			totalEmployees: Object.keys(employeeWeaponCounts).length,
			employeeWeaponCounts,
			employeeValueTotals,
			employeeProfits,
			topEmployee,
			employeePerformance,
		};
	}, [filteredWeapons]);

	const incomeStatementStats = useMemo(() => {
		const revenue = filteredWeapons.reduce(
			(sum, weapon) => sum + weapon.prix,
			0,
		);
		const productionCost = filteredWeapons.reduce(
			(sum, weapon) => sum + (weapon.cout_production ?? 0),
			0,
		);
		const grossProfit = revenue - productionCost;

		const commissions = filteredWeapons.reduce((sum, weapon) => {
			const weaponProfit = weapon.prix - (weapon.cout_production ?? 0);
			const commissionRate = weapon.user?.commission ?? 0.1;
			return sum + weaponProfit * commissionRate;
		}, 0);

		const operatingProfit = grossProfit - commissions;
		const taxes = Math.round(operatingProfit * TAX_RATE);
		const netProfit = operatingProfit - taxes;

		return {
			incomeStatementByPeriod: [
				{
					period: `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`,
					revenue,
					productionCost,
					grossProfit,
					taxes,
					commissions,
					netProfit,
					count: filteredWeapons.length,
					margin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
				},
			],
			totals: {
				revenue,
				productionCost,
				commissions,
				grossProfit,
				taxes,
				netProfit,
				count: filteredWeapons.length,
			},
		};
	}, [filteredWeapons, dateRange]);

	const tabs = [
		{ key: "overview", name: "Vue d'ensemble", icon: ChartBarIcon },
		{ key: "weapons", name: "Armes", icon: CheckCircleIcon },
		{ key: "employees", name: "Employés", icon: UsersIcon },
		{ key: "income", name: "Compte de résultat", icon: CurrencyDollarIcon },
	];

	return (
		<div className="space-y-6">
			<div className="rounded-xl border border-zinc-200 bg-background p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
				<h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-white">
					Statistiques
				</h2>

				<DateRangeSelector
					dateRange={dateRange}
					onDateRangeChange={handleDateRangeChange}
					activePreset={activeDatePreset}
					onPresetClick={handlePresetClick}
				/>

				{filteredWeapons.length === 0 ? (
					<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center dark:border-yellow-800 dark:bg-yellow-900/20">
						<p className="text-yellow-600 dark:text-yellow-400">
							Aucune donnée disponible pour cette période.
						</p>
					</div>
				) : (
					<Tab.Group
						selectedIndex={tabs.findIndex((tab) => tab.key === selectedTab)}
						onChange={(index) => setSelectedTab(tabs[index].key as TabType)}
					>
						<Tab.List className="flex space-x-2 overflow-x-auto rounded-xl bg-zinc-100 p-1 dark:bg-zinc-700">
							{tabs.map((tab) => (
								<Tab
									key={tab.key}
									className={({ selected }) =>
										`flex items-center space-x-2 px-3 py-2.5 text-sm font-medium leading-5 ${
											selected
												? "bg-background text-zinc-900 shadow dark:bg-zinc-800 dark:text-white"
												: "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
										} whitespace-nowrap rounded-lg outline-none ring-0 ring-offset-0`
									}
								>
									<tab.icon className="h-5 w-5" aria-hidden="true" />
									<span>{tab.name}</span>
								</Tab>
							))}
						</Tab.List>

						<Tab.Panels className="mt-6">
							<AnimatePresence mode="wait">
								{selectedTab === "overview" && (
									<OverviewTab weaponStats={weaponStats} />
								)}

								{selectedTab === "weapons" && (
									<WeaponsTab weaponStats={weaponStats} />
								)}

								{selectedTab === "employees" && (
									<EmployeesTab employeeStats={employeeStats} />
								)}

								{selectedTab === "income" && (
									<IncomeStatementTab
										incomeStatementStats={incomeStatementStats}
									/>
								)}
							</AnimatePresence>
						</Tab.Panels>
					</Tab.Group>
				)}
			</div>
		</div>
	);
};

export default Statistics;
