import {
	ArrowDownIcon,
	ArrowDownTrayIcon,
	BanknotesIcon,
	ChevronDownIcon,
	CubeIcon,
	DocumentTextIcon,
	TableCellsIcon,
} from "@heroicons/react/24/outline";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type React from "react";
import * as XLSX from "xlsx";
import StatCard from "./StatCard";
import { formatDollars } from "./utils";

interface IncomeStatementProps {
	incomeStatementStats: {
		incomeStatementByPeriod: Array<{
			period: string;
			revenue: number;
			productionCost: number;
			grossProfit: number;
			commissions: number;
			taxes: number;
			netProfit: number;
			count: number;
			margin: number;
		}>;
		totals: {
			revenue: number;
			productionCost: number;
			grossProfit: number;
			commissions: number;
			taxes: number;
			netProfit: number;
			count: number;
		};
	};
}

const calculatePercentage = (value: number, total: number) => {
	if (total === 0) return 0;
	return (value / total) * 100;
};

const IncomeStatementTab: React.FC<IncomeStatementProps> = ({
	incomeStatementStats,
}) => {
	const { totals } = incomeStatementStats;

	const taxesAt10Percent = Math.round(totals.grossProfit * 0.1);

	const netProfitAt10Percent =
		totals.grossProfit - totals.commissions - taxesAt10Percent;

	const getExportData = () => {
		const dataArray = [
			["Chiffre d'affaires", totals.revenue / 100, 100],
			[
				"Coût de production",
				totals.productionCost / 100,
				Math.round(calculatePercentage(totals.productionCost, totals.revenue)),
			],
			[
				"Marge brute",
				totals.grossProfit / 100,
				Math.round(calculatePercentage(totals.grossProfit, totals.revenue)),
			],
			[
				"Taxes (10%)",
				taxesAt10Percent / 100,
				Math.round(calculatePercentage(taxesAt10Percent, totals.revenue)),
			],
			[
				"Charges du personnel",
				totals.commissions / 100,
				Math.round(calculatePercentage(totals.commissions, totals.revenue)),
			],
			[
				"Résultat net",
				netProfitAt10Percent / 100,
				Math.round(calculatePercentage(netProfitAt10Percent, totals.revenue)),
			],
		];

		const dataObjects = dataArray.map((row) => ({
			Poste: row[0],
			Montant: row[1],
			"% du CA": row[2],
		}));

		return { dataArray, dataObjects };
	};

	const exportToCSV = () => {
		const { dataArray } = getExportData();
		const headers = ["Poste", "Montant", "% du CA"];
		let csvContent = `${headers.join(";")}\n`;

		for (const row of dataArray) {
			const formattedRow = row.map((cell, index) => {
				if (index === 1) {
					return typeof cell === "number"
						? cell.toFixed(2).replace(".", ",")
						: cell;
				}
				if (index === 2) {
					return `${cell}`;
				}
				return cell;
			});
			csvContent += `${formattedRow.join(";")}\n`;
		}

		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		const today = new Date().toISOString().slice(0, 10);
		link.setAttribute("href", url);
		link.setAttribute("download", `compte_resultat_${today}.csv`);
		link.style.visibility = "hidden";
		document.body.append(link);
		link.click();
		link.remove();
	};

	const exportToJSON = () => {
		const { dataObjects } = getExportData();
		const jsonString = JSON.stringify(dataObjects, null, 2);
		const blob = new Blob([jsonString], {
			type: "application/json;charset=utf-8;",
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		const today = new Date().toISOString().slice(0, 10);
		link.setAttribute("href", url);
		link.setAttribute("download", `compte_resultat_${today}.json`);
		link.style.visibility = "hidden";
		document.body.append(link);
		link.click();
		link.remove();
	};

	const exportToXLSX = () => {
		const { dataArray } = getExportData();

		const dataWithHeaders = [
			["Poste", "Montant", "% du CA"],
			...dataArray.map((row) => [row[0], row[1], `${row[2]}%`]),
		];

		const worksheet = XLSX.utils.aoa_to_sheet(dataWithHeaders);

		const columnWidths = [{ wch: 25 }, { wch: 15 }, { wch: 10 }];
		worksheet["!cols"] = columnWidths;

		dataWithHeaders.forEach((_row, index) => {
			if (index === 0) return;
			const cellRef = XLSX.utils.encode_cell({ c: 1, r: index });
			if (worksheet[cellRef]) {
				worksheet[cellRef].t = "n";
				worksheet[cellRef].z = "$#,##0.00";
			}
			const percentCellRef = XLSX.utils.encode_cell({ c: 2, r: index });
			if (worksheet[percentCellRef]) {
				worksheet[percentCellRef].t = "s";
			}
		});

		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Compte de Résultat");
		const today = new Date().toISOString().slice(0, 10);
		XLSX.writeFile(workbook, `compte_resultat_${today}.xlsx`);
	};

	const exportToPDF = () => {
		const { dataArray } = getExportData();
		const doc = new jsPDF();

		const tableColumn = ["Poste", "Montant", "% du CA"];
		const tableRows = dataArray.map((row) => [
			row[0],
			formatDollars(Number(row[1]) * 100),
			`${row[2]}%`,
		]);

		autoTable(doc, {
			head: [tableColumn],
			body: tableRows,
			startY: 20,
			theme: "grid",
			headStyles: { fillColor: [22, 163, 74] },
			styles: { fontSize: 10 },
			columnStyles: {
				0: { cellWidth: 80 },
				1: { cellWidth: 40, halign: "right" },
				2: { cellWidth: 30, halign: "right" },
			},
		});

		doc.text("Compte de Résultat Détaillé", 14, 15);
		const today = new Date().toISOString().slice(0, 10);
		doc.save(`compte_resultat_${today}.pdf`);
	};

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="space-y-6"
		>
			<div className="flex items-center justify-between">
				<h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
					Compte de résultat détaillé
				</h3>

				<DropdownMenu.Root>
					<DropdownMenu.Trigger asChild>
						<button
							type="button"
							className="flex items-center space-x-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
						>
							<ArrowDownTrayIcon className="h-4 w-4" />
							<span>Exporter</span>
							<ChevronDownIcon className="h-4 w-4" />
						</button>
					</DropdownMenu.Trigger>

					<DropdownMenu.Portal>
						<DropdownMenu.Content
							className="z-50 min-w-[10rem] overflow-hidden rounded-md border border-zinc-200 bg-background p-1 text-zinc-900 shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
							sideOffset={5}
							align="end"
						>
							<DropdownMenu.Item
								className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-zinc-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:hover:bg-zinc-700"
								onSelect={exportToCSV}
							>
								<span className="mr-2 h-4 w-4 text-xs font-mono">CSV</span>
								<span>Exporter CSV</span>
							</DropdownMenu.Item>
							<DropdownMenu.Item
								className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-zinc-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:hover:bg-zinc-700"
								onSelect={exportToJSON}
							>
								<span className="mr-2 h-4 w-4 text-xs font-mono">{"{}"}</span>
								<span>Exporter JSON</span>
							</DropdownMenu.Item>
							<DropdownMenu.Item
								className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-zinc-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:hover:bg-zinc-700"
								onSelect={exportToXLSX}
							>
								<TableCellsIcon className="mr-2 h-4 w-4" />
								<span>Exporter XLSX</span>
							</DropdownMenu.Item>
							<DropdownMenu.Item
								className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-zinc-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:hover:bg-zinc-700"
								onSelect={exportToPDF}
							>
								<DocumentTextIcon className="mr-2 h-4 w-4" />
								<span>Exporter PDF</span>
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
				</DropdownMenu.Root>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				<StatCard
					title="Chiffre d'affaires"
					value={formatDollars(totals.revenue)}
					icon={BanknotesIcon}
					subtitle={`Total pour ${totals.count} armes`}
				/>
				<StatCard
					title="Coût de production"
					value={formatDollars(totals.productionCost)}
					icon={CubeIcon}
					subtitle={`${Math.round(calculatePercentage(totals.productionCost, totals.revenue))}% du CA`}
				/>
				<StatCard
					title="Marge brute"
					value={formatDollars(totals.grossProfit)}
					icon={ArrowDownIcon}
					subtitle={`${Math.round(calculatePercentage(totals.grossProfit, totals.revenue))}% du CA`}
				/>
			</div>

			<div className="overflow-x-auto rounded-xl border border-zinc-200 bg-background shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
				<table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
					<thead className="bg-zinc-50 dark:bg-zinc-800">
						<tr>
							<th
								scope="col"
								className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
							>
								Poste
							</th>
							<th
								scope="col"
								className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
							>
								Montant
							</th>
							<th
								scope="col"
								className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
							>
								% du CA
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-zinc-200 bg-background dark:divide-zinc-700 dark:bg-zinc-800">
						<tr className="font-semibold">
							<td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-900 dark:text-white">
								Chiffre d&apos;affaires
							</td>
							<td className="whitespace-nowrap px-6 py-4 text-right text-sm text-zinc-900 dark:text-white">
								{formatDollars(totals.revenue)}
							</td>
							<td className="whitespace-nowrap px-6 py-4 text-right text-sm text-zinc-900 dark:text-white">
								100%
							</td>
						</tr>

						<tr>
							<td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
								Coût de production
							</td>
							<td className="whitespace-nowrap px-6 py-4 text-right text-sm text-zinc-500 dark:text-zinc-400">
								{formatDollars(totals.productionCost)}
							</td>
							<td className="whitespace-nowrap px-6 py-4 text-right text-sm text-zinc-500 dark:text-zinc-400">
								{Math.round(
									calculatePercentage(totals.productionCost, totals.revenue),
								)}
								%
							</td>
						</tr>

						<tr className="bg-zinc-50 font-medium dark:bg-zinc-700/20">
							<td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-900 dark:text-white">
								Marge brute
							</td>
							<td className="whitespace-nowrap px-6 py-4 text-right text-sm text-zinc-900 dark:text-white">
								{formatDollars(totals.grossProfit)}
							</td>
							<td className="whitespace-nowrap px-6 py-4 text-right text-sm text-zinc-900 dark:text-white">
								{Math.round(
									calculatePercentage(totals.grossProfit, totals.revenue),
								)}
								%
							</td>
						</tr>

						<tr>
							<td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
								Taxes (10%)
							</td>
							<td className="whitespace-nowrap px-6 py-4 text-right text-sm text-zinc-500 dark:text-zinc-400">
								{formatDollars(taxesAt10Percent)}
							</td>
							<td className="whitespace-nowrap px-6 py-4 text-right text-sm text-zinc-500 dark:text-zinc-400">
								{Math.round(
									calculatePercentage(taxesAt10Percent, totals.revenue),
								)}
								%
							</td>
						</tr>

						<tr>
							<td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
								Charges du personnel
							</td>
							<td className="whitespace-nowrap px-6 py-4 text-right text-sm text-zinc-500 dark:text-zinc-400">
								{formatDollars(totals.commissions)}
							</td>
							<td className="whitespace-nowrap px-6 py-4 text-right text-sm text-zinc-500 dark:text-zinc-400">
								{Math.round(
									calculatePercentage(totals.commissions, totals.revenue),
								)}
								%
							</td>
						</tr>

						<tr className="bg-zinc-100 font-bold dark:bg-zinc-700/40">
							<td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-900 dark:text-white">
								Résultat net
							</td>
							<td className="whitespace-nowrap px-6 py-4 text-right text-sm text-zinc-900 dark:text-white">
								{formatDollars(netProfitAt10Percent)}
							</td>
							<td className="whitespace-nowrap px-6 py-4 text-right text-sm text-zinc-900 dark:text-white">
								{Math.round(
									calculatePercentage(netProfitAt10Percent, totals.revenue),
								)}
								%
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
				<p className="text-sm text-zinc-500 dark:text-zinc-400">
					<span className="font-medium">Note:</span> Ce compte de résultat est
					basé sur les {totals.count} ventes d&apos;armes réalisées durant la
					période sélectionnée. Les charges de personnel représentent les
					commissions versées aux employés selon leur rôle.
				</p>
			</div>
		</motion.div>
	);
};

export default IncomeStatementTab;
