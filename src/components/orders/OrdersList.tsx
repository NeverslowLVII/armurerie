"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import { type Order, deleteOrder, updateOrderStatus } from "@/services/api";
import { formatDate, formatPrice } from "@/utils/formatters";
import {
	CheckCircle,
	ChevronDown,
	ChevronUp,
	ChevronsUpDown,
	Circle,
	Loader2,
	MoreHorizontal,
	Package,
	Search,
	Trash2,
	XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const getStatusLabel = (status: string) => {
	switch (status) {
		case "PENDING":
			return "En attente";
		case "COMPLETED":
			return "Terminée";
		case "CANCELLED":
			return "Annulée";
		default:
			return status;
	}
};

// Nouvelle fonction pour les couleurs des points de statut
const getStatusDotColor = (status: string) => {
	switch (status) {
		case "PENDING":
			return "text-amber-500";
		case "COMPLETED":
			return "text-green-500";
		case "CANCELLED":
			return "text-red-500";
		default:
			return "text-zinc-500";
	}
};

interface OrdersListProps {
	orders: Order[];
	isAdmin: boolean;
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	onStatusChange: (
		orderId: number,
		newStatus: "PENDING" | "COMPLETED" | "CANCELLED",
	) => void;
	isLoading?: boolean;
}

const skeletonCols = [
	"id",
	"date",
	"employee",
	"articles",
	"total",
	"status",
	"actions",
];
const skeletonRows = ["r1", "r2", "r3", "r4", "r5"];

const statusOptions = [
	{ value: "ALL", label: "Toutes" },
	{ value: "PENDING", label: "En attente" },
	{ value: "COMPLETED", label: "Terminée" },
	{ value: "CANCELLED", label: "Annulée" },
];

export default function OrdersList({
	orders,
	isAdmin,
	currentPage,
	totalPages,
	onPageChange,
	onStatusChange,
	isLoading = false,
}: OrdersListProps) {
	const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("ALL");
	const [debouncedSearch, setDebouncedSearch] = useState(search);
	useEffect(() => {
		const handler = setTimeout(() => setDebouncedSearch(search), 200);
		return () => clearTimeout(handler);
	}, [search]);
	type SortField = "id" | "createdAt" | "userName" | "totalPrice" | "status";
	const [sortBy, setSortBy] = useState<SortField>("createdAt");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const handleSort = (field: SortField) => {
		if (sortBy === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		else {
			setSortBy(field);
			setSortOrder("asc");
		}
	};

	// Raw filtered by status and debounced search
	const filtered = useMemo(() => {
		return orders
			.filter((o) => statusFilter === "ALL" || o.status === statusFilter)
			.filter(
				(o) =>
					o.id.toString().includes(debouncedSearch) ||
					o.user?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()),
			);
	}, [orders, debouncedSearch, statusFilter]);
	// Sorted according to sortBy and sortOrder
	const sortedOrders = useMemo(() => {
		const sorted = [...filtered];
		sorted.sort((a, b) => {
			let cmp = 0;
			switch (sortBy) {
				case "id":
					cmp = a.id - b.id;
					break;
				case "createdAt":
					cmp =
						new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
					break;
				case "userName":
					cmp = (a.user?.name || "").localeCompare(b.user?.name || "");
					break;
				case "totalPrice":
					cmp = a.totalPrice - b.totalPrice;
					break;
				case "status":
					cmp = a.status.localeCompare(b.status);
					break;
			}
			return sortOrder === "asc" ? cmp : -cmp;
		});
		return sorted;
	}, [filtered, sortBy, sortOrder]);

	const handleStatusChange = async (
		orderId: number,
		newStatus: "PENDING" | "COMPLETED" | "CANCELLED",
	) => {
		try {
			setLoadingOrderId(orderId);
			await updateOrderStatus(orderId, newStatus);

			const statusLabels = {
				PENDING: "En attente",
				COMPLETED: "Terminée",
				CANCELLED: "Annulée",
			};

			toast({
				title: "Commande mise à jour",
				description: `Commande #${orderId} : statut changé à ${statusLabels[newStatus]}`,
			});
			onStatusChange(orderId, newStatus);
		} catch (error) {
			console.error("Échec de la mise à jour du statut de la commande:", error);
			toast({
				title: "Mise à jour échouée",
				description:
					"Impossible de mettre à jour le statut de la commande. Veuillez réessayer.",
				variant: "destructive",
			});
		} finally {
			setLoadingOrderId(null);
		}
	};

	const handleDeleteOrder = async (orderId: number) => {
		if (!confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
			return;
		}

		try {
			setLoadingOrderId(orderId);
			await deleteOrder(orderId);
			toast({
				title: "Commande supprimée",
				description: `La commande #${orderId} a été supprimée`,
			});

			onStatusChange(orderId, "CANCELLED");
		} catch (error) {
			console.error("Échec de la suppression de la commande:", error);
			toast({
				title: "Suppression échouée",
				description: "Impossible de supprimer la commande. Veuillez réessayer.",
				variant: "destructive",
			});
		} finally {
			setLoadingOrderId(null);
		}
	};

	if (isLoading) {
		return (
			<TooltipProvider>
				<div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
					<div className="relative w-full sm:max-w-xs">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
						<Input
							placeholder="Rechercher par ID, nom..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-10 h-10 w-full bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/30 shadow-sm hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
						/>
					</div>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-full sm:w-auto h-10 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-red-500/30 data-[placeholder]:text-zinc-400 dark:data-[placeholder]:text-zinc-500 shadow-sm hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors px-4">
							<SelectValue placeholder="Statut" />
						</SelectTrigger>
						<SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 shadow-xl rounded-lg text-sm">
							{statusOptions.map((opt) => (
								<SelectItem
									key={opt.value}
									value={opt.value}
									className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-2"
								>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-8">
					<Card className="overflow-hidden border border-zinc-200 dark:border-zinc-700/80 rounded-xl shadow-lg">
						<ScrollArea className="whitespace-nowrap">
							<Table>
								<TableHeader>
									<TableRow className="border-b-zinc-200 dark:border-b-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/30">
										{skeletonCols.map((col) => (
											<TableHead
												key={col}
												className="px-4 h-12 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
											>
												<Skeleton className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" />
											</TableHead>
										))}
									</TableRow>
								</TableHeader>
								<TableBody>
									{skeletonRows.map((row) => (
										<TableRow
											key={row}
											className="animate-pulse border-b-slate-200 dark:border-b-zinc-800"
										>
											{skeletonCols.map((col) => (
												<TableCell
													key={`${row}-${col}`}
													className="px-4 py-3 h-12"
												>
													<Skeleton className="h-4 w-full bg-slate-200 dark:bg-zinc-800" />
												</TableCell>
											))}
										</TableRow>
									))}
								</TableBody>
							</Table>
						</ScrollArea>
					</Card>
				</div>
			</TooltipProvider>
		);
	}

	return (
		<TooltipProvider>
			<div className="space-y-6">
				<div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
					<div className="relative w-full sm:max-w-xs">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
						<Input
							placeholder="Rechercher par ID, nom..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-10 h-10 w-full bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/30 shadow-sm hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
						/>
					</div>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-full sm:w-auto h-10 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-red-500/30 data-[placeholder]:text-zinc-400 dark:data-[placeholder]:text-zinc-500 shadow-sm hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors px-4">
							<SelectValue placeholder="Statut" />
						</SelectTrigger>
						<SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 shadow-xl rounded-lg text-sm">
							{statusOptions.map((opt) => (
								<SelectItem
									key={opt.value}
									value={opt.value}
									className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-2"
								>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<Card className="overflow-hidden border border-zinc-200 dark:border-zinc-700/80 rounded-xl shadow-lg">
					<ScrollArea className="whitespace-nowrap">
						<Table className="min-w-full text-sm table-fixed">
							<TableHeader>
								<TableRow className="border-b-zinc-200 dark:border-b-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/30 hover:bg-zinc-100/80 dark:hover:bg-zinc-700/50 transition-colors">
									<TableHead
										onClick={() => handleSort("id")}
										className="w-[100px] px-4 py-3.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 tracking-wider cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-colors"
									>
										<div className="flex items-center space-x-1">
											<span>ID</span>
											{sortBy === "id" ? (
												sortOrder === "asc" ? (
													<ChevronUp className="h-4 w-4 text-red-500" />
												) : (
													<ChevronDown className="h-4 w-4 text-red-500" />
												)
											) : (
												<ChevronsUpDown className="h-4 w-4 opacity-50" />
											)}
										</div>
									</TableHead>
									<TableHead
										onClick={() => handleSort("createdAt")}
										className="w-[180px] px-4 py-3.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 tracking-wider cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-colors"
									>
										<div className="flex items-center space-x-1">
											<span>Date</span>
											{sortBy === "createdAt" ? (
												sortOrder === "asc" ? (
													<ChevronUp className="h-4 w-4 text-red-500" />
												) : (
													<ChevronDown className="h-4 w-4 text-red-500" />
												)
											) : (
												<ChevronsUpDown className="h-4 w-4 opacity-50" />
											)}
										</div>
									</TableHead>
									<TableHead
										onClick={() => handleSort("userName")}
										className="px-4 py-3.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 tracking-wider cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-colors"
									>
										<div className="flex items-center space-x-1">
											<span>Employé</span>
											{sortBy === "userName" ? (
												sortOrder === "asc" ? (
													<ChevronUp className="h-4 w-4 text-red-500" />
												) : (
													<ChevronDown className="h-4 w-4 text-red-500" />
												)
											) : (
												<ChevronsUpDown className="h-4 w-4 opacity-50" />
											)}
										</div>
									</TableHead>
									<TableHead className="min-w-[200px] px-4 py-3.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 tracking-wider">
										Articles
									</TableHead>
									<TableHead
										onClick={() => handleSort("totalPrice")}
										className="w-[120px] px-4 py-3.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 tracking-wider cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-colors text-right"
									>
										<div className="flex items-center justify-end space-x-1">
											<span>Total</span>
											{sortBy === "totalPrice" ? (
												sortOrder === "asc" ? (
													<ChevronUp className="h-4 w-4 text-red-500" />
												) : (
													<ChevronDown className="h-4 w-4 text-red-500" />
												)
											) : (
												<ChevronsUpDown className="h-4 w-4 opacity-50" />
											)}
										</div>
									</TableHead>
									<TableHead
										onClick={() => handleSort("status")}
										className="w-[150px] px-4 py-3.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 tracking-wider cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-colors text-center"
									>
										<div className="flex items-center space-x-1">
											<span>Statut</span>
											{sortBy === "status" ? (
												sortOrder === "asc" ? (
													<ChevronUp className="h-4 w-4 text-red-500" />
												) : (
													<ChevronDown className="h-4 w-4 text-red-500" />
												)
											) : (
												<ChevronsUpDown className="h-4 w-4 opacity-50" />
											)}
										</div>
									</TableHead>
									<TableHead className="w-[100px] px-4 py-3.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 tracking-wider text-center">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
								{sortedOrders.length === 0 ? (
									<TableRow className="border-none">
										<TableCell
											colSpan={7}
											className="text-center h-80 text-zinc-500 dark:text-zinc-400"
										>
											<div className="flex flex-col items-center justify-center space-y-4">
												<Package className="h-16 w-16 text-zinc-300 dark:text-zinc-600 opacity-80" />
												<p className="text-lg font-medium text-zinc-600 dark:text-zinc-300">
													Aucune commande à afficher
												</p>
												<p className="text-sm text-zinc-400 dark:text-zinc-500">
													Utilisez les filtres ci-dessus ou attendez de
													nouvelles commandes.
												</p>
											</div>
										</TableCell>
									</TableRow>
								) : (
									sortedOrders.map((order, index) => (
										<TableRow
											key={order.id}
											className="group hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors duration-150 ease-in-out animate-fadeInUpTableRow"
											style={{ animationDelay: `${index * 50}ms` }}
										>
											<TableCell className="px-4 py-4 text-zinc-700 dark:text-zinc-300 font-medium">
												#{order.id}
											</TableCell>
											<TableCell className="px-4 py-4 text-zinc-600 dark:text-zinc-400">
												{formatDate(new Date(order.createdAt))}
											</TableCell>
											<TableCell className="px-4 py-4 text-zinc-600 dark:text-zinc-400">
												{order.user?.name || (
													<span className="italic text-zinc-400 dark:text-zinc-500">
														N/A
													</span>
												)}
											</TableCell>
											<TableCell className="px-4 py-4 text-zinc-600 dark:text-zinc-400">
												<ul className="list-none text-xs space-y-1">
													{order.items?.slice(0, 2).map((item) => (
														<li key={item.id} className="truncate">
															<span className="text-zinc-500 dark:text-zinc-400">
																{item.quantity}x
															</span>{" "}
															{item.baseWeapon?.nom ||
																`Arme #${item.baseWeaponId}`}
														</li>
													))}
													{order.items && order.items.length > 2 && (
														<li className="italic text-zinc-400 dark:text-zinc-500">
															+ {order.items.length - 2} autre(s)...
														</li>
													)}
												</ul>
											</TableCell>
											<TableCell className="px-4 py-4 text-zinc-700 dark:text-zinc-300 font-semibold text-right">
												{formatPrice(order.totalPrice)}
											</TableCell>
											<TableCell className="px-4 py-4 text-center">
												<div className="flex items-center justify-center">
													<Circle
														className={`h-2.5 w-2.5 mr-2 ${getStatusDotColor(order.status)} fill-current`}
													/>
													<span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
														{getStatusLabel(order.status)}
													</span>
												</div>
											</TableCell>
											<TableCell className="px-4 py-4 text-center w-[100px]">
												{loadingOrderId === order.id ? (
													<Loader2 className="h-4.5 w-4.5 animate-spin mx-auto text-red-500" />
												) : (
													<div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
														{isAdmin && (
															<DropdownMenu>
																<DropdownMenuTrigger asChild>
																	<Button
																		variant="ghost"
																		size="icon"
																		className="h-8 w-8 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700 data-[state=open]:bg-zinc-100 dark:data-[state=open]:bg-zinc-700 rounded-md"
																	>
																		<MoreHorizontal className="h-4.5 w-4.5" />
																		<span className="sr-only">Options</span>
																	</Button>
																</DropdownMenuTrigger>
																<DropdownMenuContent
																	align="end"
																	className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 shadow-2xl rounded-lg w-56 text-sm"
																>
																	<DropdownMenuLabel className="text-xs text-zinc-500 dark:text-zinc-400 px-3 py-2 font-medium">
																		Actions sur la commande
																	</DropdownMenuLabel>
																	<DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-700/60" />
																	<DropdownMenuItem
																		onClick={() =>
																			handleStatusChange(order.id, "PENDING")
																		}
																		className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300 hover:!bg-amber-500/10 hover:!text-amber-600 dark:hover:!bg-amber-500/20 dark:hover:!text-amber-400 cursor-pointer px-3 py-2 focus:bg-amber-500/10 dark:focus:bg-amber-500/20"
																	>
																		<Circle className="h-3.5 w-3.5 text-amber-500 fill-current opacity-70" />{" "}
																		En Attente
																	</DropdownMenuItem>
																	<DropdownMenuItem
																		onClick={() =>
																			handleStatusChange(order.id, "COMPLETED")
																		}
																		className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300 hover:!bg-green-500/10 hover:!text-green-600 dark:hover:!bg-green-500/20 dark:hover:!text-green-400 cursor-pointer px-3 py-2 focus:bg-green-500/10 dark:focus:bg-green-500/20"
																	>
																		<CheckCircle className="h-3.5 w-3.5 text-green-500 opacity-70" />{" "}
																		Terminée
																	</DropdownMenuItem>
																	<DropdownMenuItem
																		onClick={() =>
																			handleStatusChange(order.id, "CANCELLED")
																		}
																		className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300 hover:!bg-red-500/10 hover:!text-red-600 dark:hover:!bg-red-500/20 dark:hover:!text-red-400 cursor-pointer px-3 py-2 focus:bg-red-500/10 dark:focus:bg-red-500/20"
																	>
																		<XCircle className="h-3.5 w-3.5 text-red-500 opacity-70" />{" "}
																		Annulée
																	</DropdownMenuItem>
																	<DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-700/60" />
																	<DropdownMenuItem
																		onClick={() => handleDeleteOrder(order.id)}
																		className="flex items-center gap-2.5 text-red-600 hover:!text-red-700 dark:text-red-500 dark:hover:!text-red-400 hover:!bg-red-500/10 dark:hover:!bg-red-500/20 cursor-pointer font-medium px-3 py-2 focus:bg-red-500/10 dark:focus:bg-red-500/20"
																	>
																		<Trash2 className="h-3.5 w-3.5 opacity-70" />{" "}
																		Supprimer
																	</DropdownMenuItem>
																</DropdownMenuContent>
															</DropdownMenu>
														)}
													</div>
												)}
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</ScrollArea>

					{totalPages > 1 && (
						<div className="mt-auto pt-5 flex justify-center p-4 border-t border-zinc-200 dark:border-zinc-700/80">
							<Pagination>
								<PaginationContent className="rounded-lg bg-white dark:bg-zinc-800 shadow-md p-1.5 border border-zinc-200 dark:border-zinc-700">
									<PaginationItem>
										<PaginationPrevious
											href="#"
											className={`px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md transition-colors ${currentPage === 1 ? "pointer-events-none text-zinc-400 dark:text-zinc-500" : "text-zinc-600 dark:text-zinc-300"}`}
											onClick={(e) => {
												e.preventDefault();
												if (currentPage > 1) onPageChange(currentPage - 1);
											}}
										/>
									</PaginationItem>
									{[...Array(totalPages)].map((pageNumber, i) => (
										<PaginationItem key={`page-${pageNumber + i}`}>
											<PaginationLink
												href="#"
												className={`px-4 py-2 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md transition-colors ${currentPage === i + 1 ? "bg-red-500 text-white dark:bg-red-600 dark:text-white shadow-md" : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-zinc-100"}`}
												onClick={(e) => {
													e.preventDefault();
													onPageChange(i + 1);
												}}
											>
												{i + 1}
											</PaginationLink>
										</PaginationItem>
									))}
									<PaginationItem>
										<PaginationNext
											href="#"
											className={`px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md transition-colors ${currentPage === totalPages ? "pointer-events-none text-zinc-400 dark:text-zinc-500" : "text-zinc-600 dark:text-zinc-300"}`}
											onClick={(e) => {
												e.preventDefault();
												if (currentPage < totalPages)
													onPageChange(currentPage + 1);
											}}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						</div>
					)}
				</Card>
			</div>
		</TooltipProvider>
	);
}
