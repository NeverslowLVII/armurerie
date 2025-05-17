"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	Pagination,
	PaginationContent,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { useToast } from "@/components/ui/use-toast";
import { createOrder } from "@/services/api";
import { formatPrice } from "@/utils/formatters";
import type { BaseWeapon } from "@prisma/client";
import {
	ListChecks,
	Loader2,
	Minus,
	MinusCircle,
	PieChart,
	Plus,
	PlusCircle,
	ShoppingCart,
	Trash2,
	X,
} from "lucide-react";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

// Updated CatalogEntry to include id, cout, vente from API
export interface CatalogEntry {
	id: number; // Added from API data
	name: string;
	category: string;
	cout: number; // Added from API data (maps to cout_production_defaut)
	vente: number; // Added from API data (maps to prix_defaut)
	canon_precision: number;
	canon_long: number;
	canon: number;
	canon_court: number;
	ressort: number;
	mire: number;
	detente: number;
	chien: number;
	armature_legere: number;
	armature: number;
	armature_lourde: number;
	armature_precision: number;
	crosse: number;
	// Other fields like puissance, total_acier etc., can be added if needed
}

interface OrderFormProps {
	baseWeapons: BaseWeapon[]; // Still needed for mapping to baseWeaponId for createOrder API
	weaponCatalogItems: CatalogEntry[]; // New prop for primary display
	onClose?: () => void;
	initialLoading?: boolean; // Added to receive loading state from parent
	dataError?: string | null; // Added to receive error state from parent
}

// OrderItem now refers to catalogEntryId
interface OrderItem {
	catalogEntryId: number;
	quantity: number;
}

export default function OrderForm({
	baseWeapons,
	weaponCatalogItems,
	onClose,
	initialLoading = false, // Default to false
	dataError = null, // Default to null
}: OrderFormProps) {
	const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
	const [submitting, setSubmitting] = useState(false);
	const router = useRouter();

	// Debug logs (weaponCatalogItems replaces internal weaponCatalog state)
	useEffect(() => {
		console.log("OrderForm props baseWeapons:", baseWeapons);
	}, [baseWeapons]);
	useEffect(() => {
		console.log("OrderForm props weaponCatalogItems:", weaponCatalogItems);
	}, [weaponCatalogItems]);
	useEffect(() => {
		console.log("OrderForm state orderItems:", orderItems);
	}, [orderItems]);

	const componentLabels: Record<
		keyof Omit<CatalogEntry, "id" | "name" | "category" | "cout" | "vente">,
		string
	> = {
		canon_precision: "Canon de précision",
		canon_long: "Canon long",
		canon: "Canon",
		canon_court: "Canon court",
		ressort: "Ressort",
		mire: "Mire",
		detente: "Détente",
		chien: "Chien",
		armature_legere: "Armature légère",
		armature: "Armature",
		armature_lourde: "Armature lourde",
		armature_precision: "Armature de précision",
		crosse: "Crosse",
	};

	const addToOrder = (catalogEntryId: number) => {
		setOrderItems((prev) => {
			const existingItem = prev.find(
				(item) => item.catalogEntryId === catalogEntryId,
			);
			if (existingItem) {
				return prev.map((item) =>
					item.catalogEntryId === catalogEntryId
						? { ...item, quantity: item.quantity + 1 }
						: item,
				);
			}
			return [...prev, { catalogEntryId, quantity: 1 }];
		});
	};

	const updateQuantity = (catalogEntryId: number, quantity: number) => {
		const parsedQuantity = Math.max(1, quantity);
		setOrderItems((prev) =>
			prev.map((item) =>
				item.catalogEntryId === catalogEntryId
					? { ...item, quantity: parsedQuantity }
					: item,
			),
		);
	};

	const removeFromOrder = (catalogEntryId: number) => {
		setOrderItems((prev) =>
			prev.filter((item) => item.catalogEntryId !== catalogEntryId),
		);
	};

	const componentsNeeded = useMemo(() => {
		// Initialiser tous les composants à 0
		const needed: Record<string, number> = {};
		for (const key of Object.keys(componentLabels)) {
			needed[key] = 0;
		}

		// Calculer les quantités pour les composants utilisés
		for (const item of orderItems) {
			const catalogEntry = weaponCatalogItems.find(
				(c) => c.id === item.catalogEntryId,
			);
			if (!catalogEntry) continue;

			for (const key of Object.keys(componentLabels) as Array<
				keyof typeof componentLabels
			>) {
				const componentValue = catalogEntry[key];
				if (typeof componentValue === "number") {
					const qty = componentValue * item.quantity;
					needed[key] = (needed[key] || 0) + qty;
				}
			}
		}
		return needed;
	}, [orderItems, weaponCatalogItems]);

	useEffect(() => {
		console.log("OrderForm componentsNeeded:", componentsNeeded);
	}, [componentsNeeded]);

	const totalCost = useMemo(
		() =>
			orderItems.reduce((sum, item) => {
				const catalogEntry = weaponCatalogItems.find(
					(c) => c.id === item.catalogEntryId,
				);
				return sum + (catalogEntry?.cout || 0) * item.quantity;
			}, 0),
		[orderItems, weaponCatalogItems],
	);
	const totalRevenue = useMemo(
		() =>
			orderItems.reduce((sum, item) => {
				const catalogEntry = weaponCatalogItems.find(
					(c) => c.id === item.catalogEntryId,
				);
				return sum + (catalogEntry?.vente || 0) * item.quantity;
			}, 0),
		[orderItems, weaponCatalogItems],
	);
	const totalMargin = totalRevenue - totalCost;
	const marginPercentage = totalCost > 0 ? (totalMargin / totalCost) * 100 : 0;

	const handleSubmit = async () => {
		if (orderItems.length === 0) {
			toast({
				title: "Commande vide",
				description: "Veuillez ajouter au moins un article à votre commande.",
				variant: "destructive",
			});
			return;
		}

		// Avant de commencer, afficher la liste des armes disponibles pour le débogage
		console.log(
			"BaseWeapons disponibles:",
			baseWeapons.map((w) => w.nom),
		);

		const apiOrderItems: { baseWeaponId: number; quantity: number }[] = [];
		let missingWeapons = false;

		for (const item of orderItems) {
			const catalogEntry = weaponCatalogItems.find(
				(c) => c.id === item.catalogEntryId,
			);
			if (!catalogEntry) {
				console.error(
					`Could not find catalog entry for id: ${item.catalogEntryId}`,
				);
				toast({
					title: "Erreur de données",
					description: `Arme non trouvée dans le catalogue pour ID ${item.catalogEntryId}.`,
					variant: "destructive",
				});
				return;
			}

			// Extraction améliorée du nom de base
			const nameParts = catalogEntry.name.split(/\s*\(|\)\s*/);
			const baseName = nameParts[0].trim();

			// Recherche plus flexible de l'arme de base correspondante
			let matchingBaseWeapon = baseWeapons.find((bw) => {
				// 1. Correspondance exacte
				if (bw.nom === baseName) return true;

				// 2. Correspondance sans casse
				if (bw.nom.toLowerCase() === baseName.toLowerCase()) return true;

				// 3. Correspondance sur le dernier mot
				const baseWeaponLastWord = bw.nom.split(/\s+/).pop()?.toLowerCase();
				const catalogLastWord = baseName.split(/\s+/).pop()?.toLowerCase();
				if (baseWeaponLastWord === catalogLastWord) return true;

				// 4. Vérifier si le nom de l'arme de base contient le nom du catalogue
				if (bw.nom.toLowerCase().includes(baseName.toLowerCase())) return true;

				// 5. Vérifier si le nom du catalogue contient le nom de l'arme de base
				if (baseName.toLowerCase().includes(bw.nom.toLowerCase())) return true;

				return false;
			});

			// Si pas de correspondance, chercher une solution de secours spécifique pour RollingBlock
			if (!matchingBaseWeapon && baseName === "RollingBlock") {
				matchingBaseWeapon = baseWeapons.find(
					(bw) => bw.nom.includes("Rolling") || bw.nom.includes("Block"),
				);
			}

			// Option de secours générale: utiliser la première arme de base disponible si aucune correspondance
			if (!matchingBaseWeapon && baseWeapons.length > 0) {
				matchingBaseWeapon = baseWeapons[0];
				missingWeapons = true;
				console.warn(
					`Aucune correspondance trouvée pour '${catalogEntry.name}'. Utilisation de l'arme de secours: ${matchingBaseWeapon.nom}`,
				);
			}

			if (!matchingBaseWeapon) {
				console.error(
					`Could not map catalog entry '${catalogEntry.name}' (base: ${baseName}) to any BaseWeapon.`,
				);
				toast({
					title: "Erreur de correspondance",
					description: `Impossible de trouver l'arme de base pour '${catalogEntry.name}'.
					Veuillez contacter l'administrateur pour synchroniser le catalogue.`,
					variant: "destructive",
				});
				return;
			}
			apiOrderItems.push({
				baseWeaponId: matchingBaseWeapon.id,
				quantity: item.quantity,
			});
		}

		console.log("API Order Items to be sent:", apiOrderItems);

		try {
			setSubmitting(true);
			await createOrder(apiOrderItems);

			if (missingWeapons) {
				toast({
					title: "Commande créée avec des armes de substitution",
					description:
						"Certaines armes n'ont pas pu être correctement associées. La commande a été créée en utilisant des substituts.",
					variant: "destructive",
				});
			} else {
				toast({
					title: "Commande créée",
					description: "Votre commande a été enregistrée avec succès.",
				});
			}

			setOrderItems([]);
			router.push("/dashboard/orders");
			if (onClose) onClose();
		} catch (error) {
			console.error("Failed to create order:", error);
			toast({
				title: "Échec de la création",
				description:
					"Une erreur est survenue lors de la création de la commande. Veuillez réessayer.",
				variant: "destructive",
			});
		} finally {
			setSubmitting(false);
		}
	};

	// Early return for critical data error affecting the whole form
	if (
		dataError &&
		(weaponCatalogItems.length === 0 || baseWeapons.length === 0)
	) {
		return (
			<Alert
				variant="destructive"
				className="my-4 bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700/40 text-red-700 dark:text-red-300 rounded-xl shadow-md p-5"
			>
				<AlertCircle className="h-5 w-5 mr-2.5 text-red-500 dark:text-red-400" />
				<AlertTitle className="font-semibold text-md">
					Erreur de Données Essentielles
				</AlertTitle>
				<AlertDescription className="mt-1">
					{dataError} Impossible d&apos;afficher le formulaire de commande.
				</AlertDescription>
			</Alert>
		);
	}

	// Group weapons by category for easier browsing in the new UI
	const weaponsByCategory = useMemo(() => {
		return weaponCatalogItems.reduce(
			(groups, entry) => {
				const cat = entry.category || "Autre";
				if (!groups[cat]) groups[cat] = [];
				groups[cat].push(entry);
				return groups;
			},
			{} as Record<string, CatalogEntry[]>,
		);
	}, [weaponCatalogItems]);

	return (
		<div className="space-y-8 p-1 md:p-2">
			{dataError && (
				<Alert
					variant="destructive"
					className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700/40 text-red-700 dark:text-red-300 rounded-xl shadow-md p-5"
				>
					<AlertCircle className="h-5 w-5 mr-2.5 text-red-500 dark:text-red-400" />
					<AlertTitle className="font-semibold text-md">
						Problème de Données
					</AlertTitle>
					<AlertDescription className="text-sm">
						{dataError} Certaines fonctionnalités pourraient être limitées.
					</AlertDescription>
				</Alert>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-10 items-start">
				{/* Colonne 1 & 2 : Catalogue d'armes */}
				<div className="lg:col-span-2 space-y-8">
					<Card className="bg-white dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/50 rounded-2xl shadow-lg dark:shadow-zinc-900/50">
						<CardHeader className="border-b border-zinc-200/70 dark:border-zinc-700/40 px-6 py-5">
							<CardTitle className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
								Catalogue d&apos;Armes
							</CardTitle>
							{initialLoading && (
								<CardDescription className="text-sm text-amber-500 dark:text-amber-400 mt-1.5">
									Chargement du catalogue...
								</CardDescription>
							)}
						</CardHeader>
						<CardContent className="p-0">
							{Object.entries(weaponsByCategory).length === 0 &&
								!initialLoading && (
									<div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
										<ShoppingCart className="mx-auto h-14 w-14 mb-5 opacity-50" />
										<p className="font-semibold text-lg">
											Le catalogue d&apos;armes est vide.
										</p>
										<p className="text-sm">
											Aucun article disponible à la commande pour le moment.
										</p>
									</div>
								)}
							<Tabs
								defaultValue={Object.keys(weaponsByCategory)[0]}
								className="w-full"
							>
								<TabsList className="flex flex-wrap gap-1.5 px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800/70 h-auto rounded-none rounded-t-lg border-b border-zinc-200/70 dark:border-zinc-700/60 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600 scrollbar-track-transparent">
									{Object.keys(weaponsByCategory).map((category) => (
										<TabsTrigger
											key={category}
											value={category}
											className="text-xs sm:text-sm font-medium px-4 py-2.5 data-[state=active]:bg-red-600 dark:data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-150 whitespace-nowrap hover:bg-zinc-200 dark:hover:bg-zinc-700/80 flex-shrink-0"
										>
											{category}
										</TabsTrigger>
									))}
								</TabsList>
								{Object.entries(weaponsByCategory).map(
									([category, entries]) => (
										<TabsContent
											key={category}
											value={category}
											className="p-5 sm:p-6 focus-visible:ring-0 focus-visible:ring-offset-0"
										>
											<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
												{entries.map((entry) => {
													const orderItem = orderItems.find(
														(i) => i.catalogEntryId === entry.id,
													);
													const isAdded = !!orderItem;
													return (
														<Card
															key={entry.id}
															className={`transition-all duration-200 ease-in-out bg-white dark:bg-zinc-700/60 border hover:shadow-xl dark:hover:shadow-zinc-900/60 ${isAdded ? "border-red-500 dark:border-red-400 ring-2 ring-red-500/40 dark:ring-red-400/40 shadow-md" : "border-zinc-200/80 dark:border-zinc-600/70 hover:border-red-400/70 dark:hover:border-red-500/60"} rounded-xl overflow-hidden group`}
														>
															<CardContent className="p-5 space-y-3">
																<h4
																	className="font-semibold text-base text-zinc-800 dark:text-zinc-100 truncate group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors"
																	title={entry.name}
																>
																	{entry.name}
																</h4>
																<p className="text-xs text-zinc-500 dark:text-zinc-400">
																	{entry.category} - ID: {entry.id}
																</p>
																<div className="flex justify-between items-center pt-2">
																	<span className="text-xl font-bold text-red-600 dark:text-red-500">
																		{formatPrice(entry.vente * 100)}
																	</span>
																	<Button
																		size="sm"
																		variant={isAdded ? "default" : "outline"}
																		className={`h-10 text-xs sm:text-sm rounded-lg w-full transition-all duration-150 ease-in-out focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-800 flex items-center justify-center group/btn ${
																			isAdded
																				? "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400 text-white shadow-md hover:shadow-lg"
																				: "border-zinc-300 dark:border-zinc-500 hover:bg-red-500/5 dark:hover:bg-red-500/10 hover:border-red-500/70 dark:hover:border-red-400/80 text-zinc-700 dark:text-zinc-200 hover:text-red-600 dark:hover:text-red-400"
																		}`}
																		onClick={() =>
																			isAdded
																				? removeFromOrder(entry.id)
																				: addToOrder(entry.id)
																		}
																		disabled={initialLoading}
																	>
																		{isAdded ? (
																			<MinusCircle className="mr-2 h-4.5 w-4.5 flex-shrink-0" />
																		) : (
																			<PlusCircle className="mr-2 h-4.5 w-4.5 flex-shrink-0" />
																		)}
																		<span className="truncate">
																			{isAdded ? "Retirer" : "Ajouter"}
																		</span>
																	</Button>
																</div>
															</CardContent>
														</Card>
													);
												})}
											</div>
										</TabsContent>
									),
								)}
							</Tabs>
						</CardContent>
					</Card>
				</div>

				{/* Colonne 3 : Panier et Stats */}
				<div className="lg:col-span-1 space-y-8">
					<Card className="sticky top-24 shadow-lg dark:shadow-zinc-900/50 rounded-2xl dark:bg-zinc-800/70 dark:border-zinc-700/50 border-zinc-200/80">
						<CardHeader className="border-b dark:border-zinc-700/40 px-6 py-5">
							<div className="flex justify-between items-center">
								<CardTitle className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
									Votre Commande
								</CardTitle>
								{orderItems.length > 0 && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setOrderItems([])}
										className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/15 text-xs px-3 py-1.5 h-auto rounded-md transition-colors"
									>
										<Trash2 className="mr-1.5 h-4 w-4" />
										Vider
									</Button>
								)}
							</div>
						</CardHeader>
						<CardContent className="p-5 space-y-3.5 max-h-[calc(100vh-500px)] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600">
							{orderItems.length === 0 ? (
								<div className="text-center py-12">
									<ShoppingCart className="mx-auto h-14 w-14 text-zinc-400 dark:text-zinc-500 mb-4" />
									<p className="text-zinc-500 dark:text-zinc-400 text-md font-medium">
										Votre panier est vide.
									</p>
									<p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
										Ajoutez des armes depuis le catalogue.
									</p>
								</div>
							) : (
								<ul className="divide-y divide-zinc-200/60 dark:divide-zinc-700/50">
									{orderItems.map((item) => {
										const catalogEntry = weaponCatalogItems.find(
											(c) => c.id === item.catalogEntryId,
										);
										if (!catalogEntry) return null;
										return (
											<li
												key={item.catalogEntryId}
												className="py-4 flex items-center justify-between space-x-3 group"
											>
												<div className="flex-grow min-w-0">
													<p
														className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors"
														title={catalogEntry.name}
													>
														{catalogEntry.name}
													</p>
													<p className="text-xs text-zinc-500 dark:text-zinc-400/90">
														{formatPrice(catalogEntry.vente * 100)}
													</p>
												</div>
												<div className="flex items-center gap-2 shrink-0">
													<Button
														variant="outline"
														size="icon"
														className="h-8 w-8 rounded-md border-zinc-300/80 dark:border-zinc-600/80 hover:bg-zinc-100 dark:hover:bg-zinc-700/70 hover:border-zinc-400 dark:hover:border-zinc-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-zinc-800 transition-colors"
														onClick={() =>
															updateQuantity(
																item.catalogEntryId,
																item.quantity - 1,
															)
														}
														disabled={item.quantity <= 1 || initialLoading}
													>
														<Minus className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
														<span className="sr-only">Diminuer</span>
													</Button>
													<Input
														type="number"
														value={item.quantity}
														onChange={(e) => {
															const val = Number.parseInt(e.target.value, 10);
															updateQuantity(
																item.catalogEntryId,
																Number.isNaN(val) || val < 1 ? 1 : val,
															);
														}}
														className="h-8 w-14 text-center px-1 text-sm rounded-md border-zinc-300/80 dark:border-zinc-600/80 bg-white dark:bg-zinc-700/80 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 dark:focus:ring-offset-zinc-800 dark:text-zinc-100"
														disabled={initialLoading}
														min="1"
													/>
													<Button
														variant="outline"
														size="icon"
														className="h-8 w-8 rounded-md border-zinc-300/80 dark:border-zinc-600/80 hover:bg-zinc-100 dark:hover:bg-zinc-700/70 hover:border-zinc-400 dark:hover:border-zinc-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-zinc-800 transition-colors"
														onClick={() =>
															updateQuantity(
																item.catalogEntryId,
																item.quantity + 1,
															)
														}
														disabled={initialLoading}
													>
														<Plus className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
														<span className="sr-only">Augmenter</span>
													</Button>
												</div>
												<p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 w-24 text-right shrink-0">
													{formatPrice(
														catalogEntry.vente * item.quantity * 100,
													)}
												</p>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 rounded-md text-zinc-400/90 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/15 opacity-0 group-hover:opacity-100 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-zinc-800"
													onClick={() => removeFromOrder(item.catalogEntryId)}
													disabled={initialLoading}
												>
													<X className="h-4 w-4" />
													<span className="sr-only">Supprimer</span>
												</Button>
											</li>
										);
									})}
								</ul>
							)}
						</CardContent>
						{orderItems.length > 0 && (
							<CardFooter className="p-5 border-t dark:border-zinc-700/40 space-y-2.5">
								<div className="flex justify-between items-center text-sm font-medium">
									<span className="text-zinc-600 dark:text-zinc-300/90">
										Sous-total:
									</span>
									<span className="text-zinc-800 dark:text-zinc-100 font-semibold">
										{formatPrice(totalRevenue * 100)}
									</span>
								</div>
							</CardFooter>
						)}
					</Card>

					<Card className="shadow-lg dark:shadow-zinc-900/50 rounded-2xl dark:bg-zinc-800/70 dark:border-zinc-700/50 border-zinc-200/80">
						<CardHeader className="px-6 py-5">
							<CardTitle className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
								Analyse & Composants
							</CardTitle>
						</CardHeader>
						<Tabs defaultValue="components" className="w-full">
							<TabsList className="grid w-full grid-cols-2 h-auto rounded-none border-b bg-transparent p-0 dark:border-zinc-700/40">
								<TabsTrigger
									value="components"
									className="rounded-none border-b-[3px] border-transparent data-[state=active]:border-red-500 data-[state=active]:text-red-500 dark:data-[state=active]:text-red-400 data-[state=active]:shadow-none text-sm font-semibold h-12 focus-visible:ring-offset-0 focus-visible:ring-2 focus-visible:ring-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-colors duration-150"
								>
									<ListChecks className="mr-2 h-5 w-5 flex-shrink-0" />{" "}
									Composants Requis
								</TabsTrigger>
								<TabsTrigger
									value="financials"
									className="rounded-none border-b-[3px] border-transparent data-[state=active]:border-red-500 data-[state=active]:text-red-500 dark:data-[state=active]:text-red-400 data-[state=active]:shadow-none text-sm font-semibold h-12 focus-visible:ring-offset-0 focus-visible:ring-2 focus-visible:ring-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-colors duration-150"
								>
									<PieChart className="mr-2 h-5 w-5 flex-shrink-0" /> Analyse
									Financière
								</TabsTrigger>
							</TabsList>
							<TabsContent value="components" className="p-5 sm:p-6">
								{orderItems.length === 0 ? (
									<div className="text-center py-10">
										<ListChecks className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500 mb-3" />
										<p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
											Les composants requis apparaîtront ici.
										</p>
									</div>
								) : (
									<ul className="space-y-3 text-sm">
										{Object.entries(componentsNeeded)
											.filter(([, quantity]) => quantity > 0) // Only show components with quantity > 0
											.map(([key, quantity]) => (
												<li
													key={key}
													className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-700/40 p-2.5 rounded-md"
												>
													<span className="text-zinc-700 dark:text-zinc-300/90">
														{componentLabels[
															key as keyof typeof componentLabels
														] || key}
														:
													</span>
													<span className="font-semibold text-zinc-800 dark:text-zinc-100 bg-zinc-200/70 dark:bg-zinc-600/70 px-2.5 py-1 rounded-md text-xs">
														{quantity}
													</span>
												</li>
											))}
									</ul>
								)}
							</TabsContent>
							<TabsContent
								value="financials"
								className="p-5 sm:p-6 space-y-3.5"
							>
								{orderItems.length === 0 ? (
									<div className="text-center py-10">
										<PieChart className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500 mb-3" />
										<p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
											L&apos;analyse financière apparaîtra ici.
										</p>
									</div>
								) : (
									<div className="space-y-3">
										<div className="flex justify-between items-center p-3.5 bg-zinc-100 dark:bg-zinc-700/70 rounded-lg">
											<span className="text-sm text-zinc-600 dark:text-zinc-300/90">
												Coût Total des Marchandises:
											</span>
											<span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
												{formatPrice(totalCost * 100)}
											</span>
										</div>
										<div className="flex justify-between items-center p-3.5 bg-zinc-100 dark:bg-zinc-700/70 rounded-lg">
											<span className="text-sm text-zinc-600 dark:text-zinc-300/90">
												Revenu Total:
											</span>
											<span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
												{formatPrice(totalRevenue * 100)}
											</span>
										</div>
										<div className="flex justify-between items-center p-3.5 bg-green-500/10 dark:bg-green-500/20 rounded-lg">
											<span className="text-sm text-green-700 dark:text-green-300/90 font-medium">
												Marge Brute Totale:
											</span>
											<span className="text-sm font-bold text-green-600 dark:text-green-200">
												{formatPrice(totalMargin * 100)}
											</span>
										</div>
										<div className="flex justify-between items-center p-3.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
											<span className="text-sm text-blue-700 dark:text-blue-300/90 font-medium">
												Pourcentage de Marge:
											</span>
											<span className="text-sm font-bold text-blue-600 dark:text-blue-200">
												{marginPercentage.toFixed(2)}%
											</span>
										</div>
									</div>
								)}
							</TabsContent>
						</Tabs>
					</Card>
				</div>
			</div>

			<div className="flex justify-end pt-6 sticky bottom-0 bg-zinc-50 dark:bg-zinc-950 py-5 border-t border-zinc-200/80 dark:border-zinc-700/60 px-6 -mx-6 shadow-top-subtle-darker">
				<Button
					onClick={handleSubmit}
					disabled={
						initialLoading ||
						submitting ||
						orderItems.length === 0 ||
						!!dataError
					}
					className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400 text-white font-semibold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2.5 min-w-[240px] h-14 text-lg focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
				>
					{submitting ? (
						<>
							<Loader2 className="mr-2 h-6 w-6 animate-spin" /> Traitement...
						</>
					) : (
						<>
							<ShoppingCart className="mr-2 h-6 w-6" /> Passer la Commande (
							{formatPrice(totalRevenue * 100)})
						</>
					)}
				</Button>
			</div>
		</div>
	);
}
