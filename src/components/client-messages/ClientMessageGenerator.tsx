import {
	ArrowPathIcon,
	CheckIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	ClipboardDocumentCheckIcon,
	ClipboardDocumentIcon,
	CurrencyDollarIcon,
	EnvelopeIcon,
	FunnelIcon,
	IdentificationIcon,
	MagnifyingGlassIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useData } from "../../context/DataContext";
import { useAllWeapons } from "../../hooks/useAllWeapons";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogContent,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { SelectNative } from "../ui/select-native";
import { Textarea } from "../ui/textarea";
import {
	type DetenteurGroup,
	calculateSimilarity,
	generateClientMessage,
	groupWeaponsByDetenteur,
	normalizeDetenteur,
} from "./utils";

const MAX_MESSAGE_LENGTH = 750;

function getInitials(name: string) {
	if (!name) return "?";
	return name
		.split(/\s+/)
		.map((word) => word[0]?.toUpperCase() || "")
		.slice(0, 2)
		.join("");
}

// Générer une couleur unique basée sur le nom
function getColorFromName(name: string) {
	if (!name) return "#6366f1";
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.codePointAt(i) || 0 + ((hash << 5) - hash);
	}
	const colors = [
		"#ef4444",
		"#f97316",
		"#f59e0b",
		"#eab308",
		"#84cc16",
		"#22c55e",
		"#10b981",
		"#14b8a6",
		"#06b6d4",
		"#0ea5e9",
		"#3b82f6",
		"#6366f1",
		"#8b5cf6",
		"#a855f7",
		"#d946ef",
		"#ec4899",
		"#f43f5e",
	];
	return colors[Math.abs(hash) % colors.length];
}

function formatCurrency(amount: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount / 100);
}

function formatDate(date: string | number | Date) {
	return new Date(date).toLocaleDateString("en-US");
}

const messageTemplates = [
	{ id: "standard", name: "Standard" },
	{ id: "relance", name: "Relance" },
	{ id: "promo", name: "Promotion" },
	{ id: "remerciement", name: "Remerciement" },
];

const sortOptions = [
	{ id: "recent", name: "Plus récents" },
	{ id: "ancien", name: "Plus anciens" },
	{ id: "montant", name: "Montant total ↓" },
	{ id: "montant-asc", name: "Montant total ↑" },
	{ id: "achats", name: "Nombre d'achats ↓" },
	{ id: "achats-asc", name: "Nombre d'achats ↑" },
];

type SortByType = "totalAmount" | "purchaseCount" | "lastPurchaseDate" | "name";

export function ClientMessageGenerator() {
	const {
		weapons,
		loading: weaponsLoading,
		error: weaponsError,
		refresh: refreshAllWeapons,
	} = useAllWeapons();
	const { data: session } = useSession();
	const searchInputRef = useRef<HTMLInputElement>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedGroup, setSelectedGroup] = useState<DetenteurGroup | null>(
		null,
	);
	const [message, setMessage] = useState("");
	const [isCopied, setIsCopied] = useState(false);
	const [messageTemplate, setMessageTemplate] = useState("standard");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [activeTab, setActiveTab] = useState<"informations" | "achats">(
		"informations",
	);
	const itemsPerPage = 10;
	const [sortBy, setSortBy] = useState("recent");
	const [showFilters, setShowFilters] = useState(false);
	const [minAmount, setMinAmount] = useState("");
	const [maxAmount, setMaxAmount] = useState("");
	const [minPurchases, setMinPurchases] = useState("");

	// Raccourcis clavier
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			// CTRL+F pour rechercher
			if (e.ctrlKey && e.key === "f") {
				e.preventDefault();
				searchInputRef.current?.focus();
			}

			if (e.ctrlKey && e.key === "c" && selectedGroup && message) {
				e.preventDefault();
				handleCopyMessage();
			}

			if (e.key === "Escape" && showFilters) {
				e.preventDefault();
				setShowFilters(false);
			}
		};

		globalThis.addEventListener("keydown", handleKeyDown);
		return () => globalThis.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, selectedGroup, message, showFilters]);

	useEffect(() => {
		if (isOpen) {
			setTimeout(() => {
				searchInputRef.current?.focus();
			}, 100);
		}
	}, [isOpen]);

	useEffect(() => {
		if (isOpen) {
			refreshAllWeapons();
		}
	}, [isOpen, refreshAllWeapons]);

	const detenteurGroups = useMemo(() => {
		if (weaponsLoading) return [];
		return groupWeaponsByDetenteur(weapons);
	}, [weapons, weaponsLoading]);

	useEffect(() => {
		if (detenteurGroups.length === 0) return;

		const duplicates: { name1: string; name2: string; similarity: number }[] =
			[];

		duplicates.sort((a, b) => b.similarity - a.similarity);
	}, [detenteurGroups]);

	const filteredGroups = useMemo(() => {
		let result = detenteurGroups;

		if (searchTerm.trim()) {
			const normalizedSearch = normalizeDetenteur(searchTerm);
			result = result.filter((group) => {
				return group.names.some(
					(name) =>
						normalizeDetenteur(name).includes(normalizedSearch) ||
						calculateSimilarity(normalizeDetenteur(name), normalizedSearch) >=
							0.6,
				);
			});
		}

		if (minAmount) {
			const min = Number.parseFloat(minAmount) * 100;
			result = result.filter((group) => group.totalSpent >= min);
		}

		if (maxAmount) {
			const max = Number.parseFloat(maxAmount) * 100;
			result = result.filter((group) => group.totalSpent <= max);
		}

		if (minPurchases) {
			const min = Number.parseInt(minPurchases, 10);
			result = result.filter((group) => group.purchaseCount >= min);
		}

		return result.sort((a, b) => {
			switch (sortBy) {
				case "recent": {
					return (
						new Date(b.lastPurchase).getTime() -
						new Date(a.lastPurchase).getTime()
					);
				}
				case "ancien": {
					return (
						new Date(a.lastPurchase).getTime() -
						new Date(b.lastPurchase).getTime()
					);
				}
				case "montant": {
					return b.totalSpent - a.totalSpent;
				}
				case "montant-asc": {
					return a.totalSpent - b.totalSpent;
				}
				case "achats": {
					return b.purchaseCount - a.purchaseCount;
				}
				case "achats-asc": {
					return a.purchaseCount - b.purchaseCount;
				}
				default: {
					return 0;
				}
			}
		});
	}, [detenteurGroups, searchTerm, sortBy, minAmount, maxAmount, minPurchases]);

	const paginatedGroups = useMemo(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		return filteredGroups.slice(startIndex, startIndex + itemsPerPage);
	}, [filteredGroups, currentPage]);

	const totalPages = useMemo(() => {
		return Math.max(1, Math.ceil(filteredGroups.length / itemsPerPage));
	}, [filteredGroups]);

	useEffect(() => {
		setCurrentPage(1);
		// reference filters to satisfy exhaustive-deps
		void searchTerm;
		void sortBy;
		void minAmount;
		void maxAmount;
		void minPurchases;
	}, [searchTerm, sortBy, minAmount, maxAmount, minPurchases]);

	useEffect(() => {
		if (!selectedGroup) {
			setMessage("");
			return;
		}

		// Récupérer le nom de l'utilisateur connecté
		const currentUserName = session?.user?.name || "Armurier";

		setMessage(
			generateClientMessage(selectedGroup, messageTemplate, currentUserName),
		);
	}, [selectedGroup, messageTemplate, session?.user?.name]);

	const getCharCountClass = () => {
		const length = message.length;
		if (length > MAX_MESSAGE_LENGTH) return "text-red-500 font-bold";
		if (length > MAX_MESSAGE_LENGTH * 0.9) return "text-orange-400";
		return "text-zinc-400";
	};

	const goToPreviousPage = () => {
		setCurrentPage((prev) => Math.max(1, prev - 1));
	};

	const goToNextPage = () => {
		setCurrentPage((prev) => Math.min(totalPages, prev + 1));
	};

	const refreshMessage = () => {
		if (!selectedGroup) return;

		const currentUserName = session?.user?.name || "Armurier";

		setMessage(
			generateClientMessage(selectedGroup, messageTemplate, currentUserName),
		);
	};

	const resetFilters = () => {
		setMinAmount("");
		setMaxAmount("");
		setMinPurchases("");
		setSortBy("recent");
	};

	const handleCopyMessage = () => {
		if (!message) return;

		setIsSubmitting(true);

		navigator.clipboard
			.writeText(message)
			.then(() => {
				setIsCopied(true);
				toast.success("Message copié dans le presse-papier");
				setTimeout(() => {
					setIsCopied(false);
					setIsSubmitting(false);
				}, 2000);
			})
			.catch((error) => {
				console.error("Erreur lors de la copie du message:", error);
				toast.error("Impossible de copier le message");
				setIsSubmitting(false);
			});
	};

	return (
		<>
			<Button
				className="bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-500 hover:to-orange-500"
				onClick={() => setIsOpen(true)}
			>
				<EnvelopeIcon className="mr-1.5 h-4 w-4" />
				Communication clients
			</Button>

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogPortal>
					<DialogOverlay className="bg-black/60 backdrop-blur-sm" />
					<DialogContent className="h-[90vh] max-w-[98vw] border border-zinc-800 bg-black p-0 shadow-2xl xl:max-w-[95vw] 2xl:max-w-[90vw]">
						<div className="flex h-full flex-col overflow-hidden">
							<div className="flex items-center justify-between border-b border-zinc-800 bg-black px-5 py-4">
								<DialogTitle className="text-xl font-semibold text-white">
									Communication clients
								</DialogTitle>
								<div className="flex items-center gap-3">
									<div className="relative w-72">
										<Input
											ref={searchInputRef}
											type="text"
											placeholder="Rechercher un client... (Ctrl+F)"
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											className="w-full rounded-md border-zinc-800 bg-zinc-900 py-1.5 pl-4 pr-10 text-sm text-white focus:border-red-500 focus:ring-red-500"
										/>
										<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
											<MagnifyingGlassIcon className="h-4 w-4 text-zinc-500" />
										</div>
									</div>
									<Button
										onClick={() => setShowFilters(!showFilters)}
										variant="outline"
										size="icon"
										className={`h-8 w-8 border-zinc-700 p-1.5 text-zinc-300 hover:bg-zinc-800 ${showFilters ? "bg-zinc-800" : ""}`}
										title="Filtres et tri"
									>
										<FunnelIcon className="h-4 w-4" />
									</Button>
									<Button
										onClick={() => setIsOpen(false)}
										variant="outline"
										size="sm"
										className="border-zinc-700 bg-zinc-900 px-4 text-zinc-200 hover:bg-zinc-800"
									>
										Fermer
									</Button>
								</div>
							</div>

							{showFilters && (
								<div className="border-b border-zinc-800 bg-zinc-900 p-3">
									<div className="flex flex-wrap items-center gap-4">
										<div>
											<label
												htmlFor="sortOrder"
												className="mb-1.5 block text-xs text-zinc-400"
											>
												Trier par
											</label>
											<SelectNative
												id="sortOrder"
												value={sortBy}
												onChange={(e) =>
													setSortBy(e.target.value as SortByType)
												}
												className="w-40 rounded-md border-zinc-700 bg-zinc-900 py-1 text-sm text-white"
											>
												{sortOptions.map((option) => (
													<option key={option.id} value={option.id}>
														{option.name}
													</option>
												))}
											</SelectNative>
										</div>
										<div>
											<label
												htmlFor="minAmount"
												className="mb-1.5 block text-xs text-zinc-400"
											>
												Montant min ($)
											</label>
											<Input
												id="minAmount"
												type="number"
												value={minAmount}
												onChange={(e) => setMinAmount(e.target.value)}
												className="w-32 rounded-md border-zinc-700 bg-zinc-900 py-1 text-sm text-white"
											/>
										</div>
										<div>
											<label
												htmlFor="maxAmount"
												className="mb-1.5 block text-xs text-zinc-400"
											>
												Montant max ($)
											</label>
											<Input
												id="maxAmount"
												type="number"
												value={maxAmount}
												onChange={(e) => setMaxAmount(e.target.value)}
												className="w-32 rounded-md border-zinc-700 bg-zinc-900 py-1 text-sm text-white"
											/>
										</div>
										<div>
											<label
												htmlFor="minPurchases"
												className="mb-1.5 block text-xs text-zinc-400"
											>
												Achats min
											</label>
											<Input
												id="minPurchases"
												type="number"
												value={minPurchases}
												onChange={(e) => setMinPurchases(e.target.value)}
												className="w-32 rounded-md border-zinc-700 bg-zinc-900 py-1 text-sm text-white"
											/>
										</div>
										<div className="flex items-end">
											<Button
												onClick={resetFilters}
												variant="outline"
												size="sm"
												className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
											>
												<XMarkIcon className="mr-1.5 h-3.5 w-3.5" />
												Réinitialiser
											</Button>
										</div>
									</div>
								</div>
							)}

							<div className="flex flex-1 overflow-hidden">
								<div className="flex h-full w-1/4 flex-col overflow-hidden border-r border-zinc-800 bg-zinc-900">
									<div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2.5">
										<h3 className="text-sm font-medium text-zinc-300">
											Clients{" "}
											<span className="text-xs text-zinc-400">
												({filteredGroups.length} résultats)
											</span>
										</h3>
										{weaponsLoading && (
											<div className="flex items-center text-xs text-zinc-500">
												<svg
													className="mr-1.5 h-3 w-3 animate-spin"
													viewBox="0 0 24 24"
												>
													<title>Chargement...</title>
													<circle
														className="opacity-25"
														cx="12"
														cy="12"
														r="10"
														stroke="currentColor"
														strokeWidth="4"
													/>
													<path
														className="opacity-75"
														fill="currentColor"
														d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
													/>
												</svg>
												Chargement...
											</div>
										)}
									</div>

									<div className="flex-1 overflow-y-auto">
										{weaponsError && (
											<div className="flex h-full items-center justify-center text-zinc-400">
												<div className="text-center">
													<p className="text-red-500">Erreur de chargement</p>
													<Button
														onClick={refreshAllWeapons}
														variant="outline"
														size="sm"
														className="mt-3 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
													>
														<ArrowPathIcon className="mr-1.5 h-3.5 w-3.5" />
														Réessayer
													</Button>
												</div>
											</div>
										)}

										{!weaponsError && weaponsLoading ? (
											<div className="flex h-full items-center justify-center text-zinc-400">
												<div className="text-center">
													<svg
														className="mx-auto mb-3 h-10 w-10 animate-spin text-zinc-700"
														viewBox="0 0 24 24"
													>
														<title>Chargement des clients...</title>
														<circle
															className="opacity-25"
															cx="12"
															cy="12"
															r="10"
															stroke="currentColor"
															strokeWidth="4"
														/>
														<path
															className="opacity-75"
															fill="currentColor"
															d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
														/>
													</svg>
													<p>Chargement des clients...</p>
												</div>
											</div>
										) : !weaponsError && paginatedGroups.length === 0 ? (
											<div className="flex h-full items-center justify-center text-zinc-400">
												<div className="text-center">
													<MagnifyingGlassIcon className="mx-auto mb-3 h-10 w-10 text-zinc-700" />
													<p>Aucun client trouvé</p>
													{(searchTerm ||
														minAmount ||
														maxAmount ||
														minPurchases) && (
														<Button
															onClick={resetFilters}
															variant="outline"
															size="sm"
															className="mt-3 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
														>
															Réinitialiser les filtres
														</Button>
													)}
												</div>
											</div>
										) : (
											<div className="divide-y divide-zinc-800">
												{paginatedGroups.map((group) => (
													<button
														type="button"
														key={group.primaryName}
														className="flex w-full cursor-pointer items-center justify-between px-3 py-2.5 text-left hover:bg-zinc-800 focus:bg-zinc-800 focus:outline-none"
														onClick={() => setSelectedGroup(group)}
													>
														<div
															className="mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
															style={{
																backgroundColor: getColorFromName(
																	group.primaryName,
																),
															}}
														>
															{getInitials(group.primaryName)}
														</div>
														<div className="min-w-0 flex-1">
															<p className="truncate text-sm font-medium text-red-400">
																{group.primaryName}
															</p>
															<div className="mt-1 flex items-center text-xs text-zinc-400">
																<span>
																	{group.purchaseCount} achat
																	{group.purchaseCount > 1 ? "s" : ""}
																</span>
																<span className="mx-1.5">•</span>
																<span>{formatCurrency(group.totalSpent)}</span>
															</div>
														</div>
														{selectedGroup === group && (
															<CheckIcon className="ml-2 h-4 w-4 text-red-500" />
														)}
													</button>
												))}
											</div>
										)}
									</div>

									<div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900 px-3 py-2">
										<Button
											onClick={goToPreviousPage}
											disabled={currentPage === 1}
											variant="outline"
											size="sm"
											className="h-7 w-7 border-zinc-700 p-0 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
										>
											<ChevronLeftIcon className="h-4 w-4" />
										</Button>

										<div className="text-xs text-zinc-400">
											Page {currentPage} / {totalPages}
										</div>

										<Button
											onClick={goToNextPage}
											disabled={currentPage === totalPages}
											variant="outline"
											size="sm"
											className="h-7 w-7 border-zinc-700 p-0 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
										>
											<ChevronRightIcon className="h-4 w-4" />
										</Button>
									</div>
								</div>

								{/* Right Panel - Client Details & Message - 75% width */}
								<div className="flex w-3/4 flex-col overflow-hidden bg-black">
									{selectedGroup ? (
										<div className="flex h-full flex-col overflow-hidden">
											{/* Client header - smaller & more compact */}
											<div className="flex items-center border-b border-zinc-800 px-4 py-2">
												<div
													className="mr-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white"
													style={{
														backgroundColor: getColorFromName(
															selectedGroup.primaryName,
														),
													}}
												>
													{getInitials(selectedGroup.primaryName)}
												</div>
												<div>
													<h3 className="text-lg font-medium text-white">
														{selectedGroup.primaryName}
													</h3>
													<p className="text-xs text-zinc-400">
														Dernier achat:{" "}
														{formatDate(selectedGroup.lastPurchase)}
													</p>
												</div>
											</div>

											{/* Content area with flex layout for vertical space distribution */}
											<div className="flex flex-1 flex-col overflow-hidden">
												{/* Client info area - now taking 30% of the height */}
												<div className="h-[30%] overflow-auto border-b border-zinc-800 p-4">
													{/* Tabs */}
													<div className="mb-3 flex border-b border-zinc-800">
														<button
															type="button"
															onClick={() => setActiveTab("informations")}
															className={`border-b-2 px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none ${
																activeTab === "informations"
																	? "text-white"
																	: "text-zinc-400 hover:text-zinc-200"
															}`}
														>
															Informations
															{activeTab === "informations" && (
																<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
															)}
														</button>
													</div>

													{activeTab === "informations" && (
														<div className="space-y-4">
															{selectedGroup.names.length > 1 && (
																<div className="mb-3">
																	<div className="mb-2 flex items-center">
																		<IdentificationIcon className="mr-1.5 h-3.5 w-3.5 text-yellow-500" />
																		<h4 className="text-xs font-medium text-yellow-500">
																			Variantes
																		</h4>
																	</div>
																	<div className="flex flex-wrap gap-1.5">
																		{selectedGroup.names.map((name) => (
																			<Badge
																				key={name}
																				className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-200 hover:bg-zinc-700"
																			>
																				{name}
																			</Badge>
																		))}
																	</div>
																</div>
															)}

															<div>
																<div className="mb-2 flex items-center">
																	<CurrencyDollarIcon className="mr-1.5 h-3.5 w-3.5 text-red-500" />
																	<h4 className="text-xs font-medium text-zinc-200">
																		Finances
																	</h4>
																</div>
																<div className="overflow-hidden rounded-lg bg-zinc-900 text-sm shadow-sm">
																	<div className="grid grid-cols-3">
																		<div className="border-r border-zinc-800 p-2">
																			<p className="text-xs text-zinc-500">
																				Total
																			</p>
																			<p className="font-semibold text-white">
																				{formatCurrency(
																					selectedGroup.totalSpent,
																				)}
																			</p>
																		</div>
																		<div className="border-r border-zinc-800 p-2">
																			<p className="text-xs text-zinc-500">
																				Achats
																			</p>
																			<p className="font-semibold text-white">
																				{selectedGroup.purchaseCount}
																			</p>
																		</div>
																		<div className="p-2">
																			<p className="text-xs text-zinc-500">
																				Moyenne
																			</p>
																			<p className="font-semibold text-white">
																				{formatCurrency(
																					selectedGroup.totalSpent /
																						selectedGroup.purchaseCount,
																				)}
																			</p>
																		</div>
																	</div>
																</div>
															</div>
														</div>
													)}
												</div>

												<div className="flex h-[70%] flex-col overflow-hidden bg-zinc-900/30 p-4">
													<div className="mb-3 flex items-center justify-between">
														<h4 className="text-base font-medium text-white">
															Modèle de message
														</h4>
														<div className="flex items-center gap-2">
															<SelectNative
																value={messageTemplate}
																onChange={(e) =>
																	setMessageTemplate(e.target.value)
																}
																className="rounded-md border-zinc-700 bg-zinc-900 py-1 text-sm text-white"
															>
																{messageTemplates.map((template) => (
																	<option key={template.id} value={template.id}>
																		{template.name}
																	</option>
																))}
															</SelectNative>
															<Button
																onClick={refreshMessage}
																variant="outline"
																size="sm"
																className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
																title="Régénérer le message"
															>
																<ArrowPathIcon className="h-3.5 w-3.5" />
															</Button>
														</div>
													</div>

													<div className="flex flex-1 flex-col">
														<div className="relative">
															<Textarea
																value={message}
																onChange={(e) => setMessage(e.target.value)}
																className="min-h-[200px] flex-1 resize-none rounded-md border-zinc-800 bg-zinc-900 text-white focus:border-red-500 focus:ring-red-500"
																placeholder="Sélectionnez un client pour générer un message..."
															/>
															<div
																className={`absolute bottom-2 right-3 text-xs ${getCharCountClass()}`}
															>
																{message.length} / {MAX_MESSAGE_LENGTH}
															</div>
														</div>

														<Button
															onClick={handleCopyMessage}
															disabled={
																!message ||
																isSubmitting ||
																message.length > MAX_MESSAGE_LENGTH
															}
															className="mt-4 w-full bg-red-600 py-2.5 font-medium text-white transition-colors duration-150 hover:bg-red-700"
															title="Copier le message (Ctrl+C)"
														>
															{isSubmitting ? (
																<div className="flex items-center justify-center gap-2">
																	<svg
																		className="h-4 w-4 animate-spin text-white"
																		fill="none"
																		viewBox="0 0 24 24"
																	>
																		<title>Envoi en cours...</title>
																		<circle
																			className="opacity-25"
																			cx="12"
																			cy="12"
																			r="10"
																			stroke="currentColor"
																			strokeWidth="4"
																		/>
																		<path
																			className="opacity-75"
																			fill="currentColor"
																			d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
																		/>
																	</svg>
																	<span>Copie en cours...</span>
																</div>
															) : (
																<div className="flex items-center justify-center">
																	{isCopied ? (
																		<ClipboardDocumentCheckIcon className="mr-2 h-4 w-4" />
																	) : (
																		<ClipboardDocumentIcon className="mr-2 h-4 w-4" />
																	)}
																	<span>
																		{(() => {
																			if (isCopied) {
																				return "Message copié !";
																			}
																			if (message.length > MAX_MESSAGE_LENGTH) {
																				return "Message trop long";
																			}
																			return "Copier le message";
																		})()}
																	</span>
																</div>
															)}
														</Button>
													</div>
												</div>
											</div>
										</div>
									) : (
										<div className="flex h-full flex-col items-center justify-center p-6 text-center">
											<EnvelopeIcon className="mb-4 h-16 w-16 text-zinc-700" />
											<h3 className="mb-2 text-xl font-medium text-zinc-300">
												Sélectionnez un client
											</h3>
											<p className="max-w-md text-sm text-zinc-500">
												Choisissez un client dans la liste pour générer un
												message personnalisé basé sur ses achats
											</p>
										</div>
									)}
								</div>
							</div>
						</div>
					</DialogContent>
				</DialogPortal>
			</Dialog>
		</>
	);
}
