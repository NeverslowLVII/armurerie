import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	CurrencyDollarIcon,
	FireIcon,
	PencilIcon,
	PlusIcon,
	TrashIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import React, { useState, useMemo, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useData } from "../context/DataContext";
import { createBaseWeapon, updateBaseWeapon } from "../services/api";

interface BaseWeaponsManagerProps {
	isOpen: boolean;
	onClose: () => void;
}

const calculateProfit = (price: number, cost: number): string => {
	return (((price - cost) / price) * 100).toFixed(1);
};

const ROW_HEIGHT = 68;

const listItemVariants = {
	hidden: {
		opacity: 0,
		y: 20,
		scale: 0.95,
	},
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		backgroundColor: "rgb(255 255 255 / 0)",
		transition: {
			type: "spring",
			stiffness: 300,
			damping: 30,
		},
	},
	editing: {
		opacity: 1,
		y: 0,
		scale: 1,
		backgroundColor: "rgb(79 70 229 / 0.1)",
		transition: {
			duration: 0.2,
			backgroundColor: {
				duration: 0.3,
			},
		},
	},
	exit: {
		opacity: 0,
		x: -20,
		transition: {
			duration: 0.2,
		},
	},
};

const successVariants = {
	hidden: { opacity: 0, y: -20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			type: "spring",
			stiffness: 500,
			damping: 30,
		},
	},
	exit: {
		opacity: 0,
		y: 20,
		transition: {
			duration: 0.2,
		},
	},
};

const textVariants = {
	initial: {
		opacity: 0,
		x: -10,
		display: "inline-block",
	},
	animate: {
		opacity: 1,
		x: 0,
		display: "inline-block",
		transition: {
			type: "spring",
			stiffness: 500,
			damping: 30,
			mass: 0.5,
		},
	},
};

const getProfitClass = (profit: number): string => {
	if (profit >= 30) {
		return "bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200";
	}
	if (profit >= 15) {
		return "bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200";
	}
	return "bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200";
};

export const BaseWeaponsManager: React.FC<BaseWeaponsManagerProps> = ({
	isOpen,
	onClose,
}) => {
	const { baseWeapons, refreshBaseWeapons, baseWeaponsPageSize } = useData();
	const [editingWeapon, setEditingWeapon] = useState<
		(typeof baseWeapons)[0] | null
	>(null);
	const [newWeaponName, setNewWeaponName] = useState("");
	const [newWeaponPrice, setNewWeaponPrice] = useState("");
	const [newWeaponCostProduction, setNewWeaponCostProduction] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [containerHeight, setContainerHeight] = useState<number>(0);

	const listContainerRef = React.useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (listContainerRef.current) {
			setContainerHeight(listContainerRef.current.clientHeight);
		}
	}, []);

	useEffect(() => {
		if (isOpen) {
			refreshBaseWeapons(1, baseWeaponsPageSize || 100);
		}
	}, [isOpen, refreshBaseWeapons, baseWeaponsPageSize]);

	const filteredWeapons = useMemo(() => {
		return baseWeapons
			.filter(
				(weapon) =>
					weapon.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
					weapon.prix_defaut.toString().includes(searchQuery),
			)
			.sort((a, b) => {
				const profitA = Number.parseFloat(
					calculateProfit(a.prix_defaut, a.cout_production_defaut),
				);
				const profitB = Number.parseFloat(
					calculateProfit(b.prix_defaut, b.cout_production_defaut),
				);
				return profitB - profitA;
			});
	}, [baseWeapons, searchQuery]);

	const itemsPerPage = useMemo(() => {
		if (containerHeight === 0) return 5;
		return Math.max(Math.floor(containerHeight / ROW_HEIGHT), 1);
	}, [containerHeight]);

	const totalPages = Math.ceil(filteredWeapons.length / itemsPerPage);

	useEffect(() => {
		if (currentPage > totalPages) {
			setCurrentPage(Math.max(1, totalPages));
		}
	}, [totalPages, currentPage]);

	const paginatedWeapons = useMemo(() => {
		const start = (currentPage - 1) * itemsPerPage;
		return filteredWeapons.slice(start, start + itemsPerPage);
	}, [filteredWeapons, currentPage, itemsPerPage]);

	const handleAddWeapon = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);
		try {
			await createBaseWeapon({
				nom: newWeaponName,
				prix_defaut: Number.parseInt(newWeaponPrice) * 100,
				cout_production_defaut: Number.parseInt(newWeaponCostProduction) * 100,
			});
			setNewWeaponName("");
			setNewWeaponPrice("");
			setNewWeaponCostProduction("");
			setSuccess("Arme de base ajoutée avec succès !");
			refreshBaseWeapons(1, baseWeaponsPageSize || 100);
			setTimeout(() => setSuccess(null), 3000);
		} catch (error) {
			setError("Erreur lors de l'ajout de l'arme de base");
			console.error("Erreur lors de l'ajout de l'arme de base:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleUpdateWeapon = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingWeapon) return;
		setIsSubmitting(true);
		setError(null);

		try {
			await updateBaseWeapon(editingWeapon.id, {
				nom: newWeaponName,
				prix_defaut: Number.parseInt(newWeaponPrice) * 100,
				cout_production_defaut: Number.parseInt(newWeaponCostProduction) * 100,
			});
			setEditingWeapon(null);
			setNewWeaponName("");
			setNewWeaponPrice("");
			setNewWeaponCostProduction("");
			setSuccess("Arme de base mise à jour avec succès !");
			refreshBaseWeapons(1, baseWeaponsPageSize || 100);
			setTimeout(() => setSuccess(null), 3000);
		} catch (error) {
			setError("Erreur lors de la mise à jour de l'arme de base");
			console.error("Erreur lors de la mise à jour de l'arme de base:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteWeapon = async (weaponId: number) => {
		try {
			if (
				globalThis.confirm(
					"Êtes-vous sûr de vouloir supprimer cette arme de base ?",
				)
			) {
				const response = await fetch(`/api/base-weapons/${weaponId}`, {
					method: "DELETE",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
				});

				if (response.ok) {
					toast.success("Arme de base supprimée avec succès");
					refreshBaseWeapons(1, baseWeaponsPageSize || 100);
				} else {
					const errorData = await response.json();

					if (response.status === 409) {
						toast.error(
							"Cette arme de base ne peut pas être supprimée car elle est utilisée par des armes dans l'inventaire",
							{ duration: 5000 },
						);
					} else if (
						response.status === 500 &&
						(errorData.details?.includes("Foreign key constraint violated") ||
							errorData.details?.includes("Weapon_nom_arme_fkey"))
					) {
						toast.error(
							"Cette arme de base ne peut pas être supprimée car elle est utilisée par des armes dans l'inventaire",
							{ duration: 5000 },
						);
					} else {
						toast.error("Erreur lors de la suppression de l'arme de base");
					}
				}
			}
		} catch (error) {
			console.error("Erreur lors de la suppression:", error);
			toast.error("Erreur lors de la suppression de l'arme de base");
		}
	};

	const startEditing = async (weapon: (typeof baseWeapons)[0]) => {
		setEditingWeapon(weapon);
		await new Promise((resolve) => setTimeout(resolve, 100));
		setNewWeaponName(weapon.nom);
		await new Promise((resolve) => setTimeout(resolve, 100));
		setNewWeaponPrice((weapon.prix_defaut / 100).toString());
		await new Promise((resolve) => setTimeout(resolve, 100));
		setNewWeaponCostProduction(
			(weapon.cout_production_defaut / 100).toString(),
		);
	};

	const cancelEditing = () => {
		setEditingWeapon(null);
		setNewWeaponName("");
		setNewWeaponPrice("");
		setNewWeaponCostProduction("");
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogPortal>
				<DialogOverlay className="bg-black/30 backdrop-blur-sm" />
				<DialogContent className="h-[85vh] max-w-[95vw] border border-zinc-800 bg-zinc-900 p-0 shadow-2xl xl:max-w-[90vw] 2xl:max-w-[85vw]">
					<div className="flex h-full flex-col">
						<div className="border-b border-zinc-700 p-3">
							<div className="flex items-center justify-between">
								<DialogTitle className="text-xl font-semibold text-zinc-100">
									Gestionnaire d&apos;armes de base
								</DialogTitle>
								<div className="flex items-center space-x-4">
									<div className="relative">
										<Input
											type="text"
											placeholder="Rechercher une arme..."
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											className="w-64 rounded-md border border-zinc-600 bg-zinc-800 py-1.5 pl-4 pr-10 text-sm text-zinc-100 placeholder-zinc-400 focus:border-red-500 focus:ring-red-500"
										/>
										<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
											<svg
												className="h-4 w-4 text-zinc-500"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<title>Icône de recherche</title>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
												/>
											</svg>
										</div>
									</div>
									<Button
										type="button"
										onClick={onClose}
										variant="outline"
										className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
									>
										Fermer
									</Button>
								</div>
							</div>
							<DialogDescription className="sr-only">
								Interface pour gérer les armes de base, ajouter de nouvelles
								armes et modifier les existantes
							</DialogDescription>
						</div>

						<div className="flex min-h-0 flex-1">
							{/* Left Panel - Form */}
							<div className="w-1/3 overflow-y-auto border-r border-zinc-700 bg-zinc-900">
								<div className="space-y-4 p-4">
									{error && (
										<div className="rounded border-l-4 border-red-700 bg-red-900/50 p-2 text-sm text-red-300">
											{error}
										</div>
									)}

									{success && (
										<motion.div
											initial="hidden"
											animate="visible"
											exit="exit"
											variants={successVariants}
											className="rounded border-l-4 border-emerald-700 bg-emerald-900/50 p-2 text-sm text-emerald-300"
										>
											{success}
										</motion.div>
									)}

									<form
										onSubmit={
											editingWeapon ? handleUpdateWeapon : handleAddWeapon
										}
										className="space-y-4"
									>
										<div>
											<label
												htmlFor="baseWeaponName"
												className="mb-1 block text-sm font-medium text-zinc-300"
											>
												Nom de l&apos;arme
											</label>
											<motion.div
												initial="initial"
												animate="animate"
												variants={textVariants}
												className="block w-full"
											>
												<Input
													id="baseWeaponName"
													type="text"
													value={newWeaponName}
													onChange={(e) => setNewWeaponName(e.target.value)}
													className="w-full border-zinc-600 bg-zinc-800 text-zinc-100 placeholder-zinc-400"
													required
													disabled={isSubmitting}
												/>
											</motion.div>
										</div>

										<div>
											<label
												htmlFor="baseWeaponPrice"
												className="mb-1 block text-sm font-medium text-zinc-300"
											>
												Prix par défaut ($)
											</label>
											<motion.div
												initial="initial"
												animate="animate"
												variants={textVariants}
												className="block w-full"
											>
												<Input
													id="baseWeaponPrice"
													type="number"
													value={newWeaponPrice}
													onChange={(e) => setNewWeaponPrice(e.target.value)}
													className="w-full border-zinc-600 bg-zinc-800 text-zinc-100 placeholder-zinc-400"
													required
													min="0"
													step="0.01"
													disabled={isSubmitting}
												/>
											</motion.div>
										</div>

										<div>
											<label
												htmlFor="baseWeaponCost"
												className="mb-1 block text-sm font-medium text-zinc-300"
											>
												Coût de production ($)
											</label>
											<motion.div
												initial="initial"
												animate="animate"
												variants={textVariants}
												className="block w-full"
											>
												<Input
													id="baseWeaponCost"
													type="number"
													value={newWeaponCostProduction}
													onChange={(e) =>
														setNewWeaponCostProduction(e.target.value)
													}
													className="w-full border-zinc-600 bg-zinc-800 text-zinc-100 placeholder-zinc-400"
													required
													min="0"
													step="0.01"
													disabled={isSubmitting}
												/>
											</motion.div>
										</div>

										<div className="pt-2">
											<div className="flex justify-between space-x-2">
												{editingWeapon && (
													<Button
														type="button"
														onClick={cancelEditing}
														variant="outline"
														className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
														disabled={isSubmitting}
													>
														<XMarkIcon className="mr-1.5 h-4 w-4" />
														Annuler
													</Button>
												)}
												<Button
													type="submit"
													className={`flex-1 ${
														isSubmitting
															? "bg-red-500/50"
															: "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500"
													} text-white`}
													disabled={isSubmitting}
												>
													{isSubmitting ? (
														<>
															<svg
																className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
																xmlns="http://www.w3.org/2000/svg"
																fill="none"
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
															{editingWeapon ? "Mise à jour..." : "Ajout..."}
														</>
													) : (
														<>
															{editingWeapon ? (
																<>
																	<PencilIcon className="mr-1.5 h-4 w-4" />
																	Mettre à jour
																</>
															) : (
																<>
																	<PlusIcon className="mr-1.5 h-4 w-4" />
																	Ajouter
																</>
															)}
														</>
													)}
												</Button>
											</div>
										</div>
									</form>
								</div>
							</div>

							<div className="flex min-h-0 flex-1 flex-col bg-zinc-900">
								<div className="border-b border-zinc-700 bg-zinc-800 px-4 py-2">
									<div className="flex items-center justify-between">
										<h3 className="text-sm font-medium text-zinc-100">
											Armes de base existantes
											<span className="ml-2 text-xs text-zinc-400">
												({filteredWeapons.length} résultats)
											</span>
										</h3>
										<div className="flex items-center space-x-1 text-sm">
											<Button
												onClick={() =>
													setCurrentPage((p) => Math.max(1, p - 1))
												}
												disabled={currentPage === 1}
												variant="ghost"
												className="p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
											>
												<ChevronLeftIcon className="h-4 w-4" />
											</Button>
											<span className="text-zinc-300">
												{currentPage} / {totalPages}
											</span>
											<Button
												onClick={() =>
													setCurrentPage((p) => Math.min(totalPages, p + 1))
												}
												disabled={currentPage === totalPages}
												variant="ghost"
												className="p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
											>
												<ChevronRightIcon className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</div>

								<div ref={listContainerRef} className="flex-1 overflow-y-auto">
									<div className="divide-y divide-zinc-800">
										<AnimatePresence mode="popLayout">
											{paginatedWeapons.map((weapon) => (
												<motion.div
													key={weapon.id}
													variants={listItemVariants}
													initial="hidden"
													animate={
														editingWeapon?.id === weapon.id
															? "editing"
															: "visible"
													}
													exit="exit"
													className="px-4 py-3 transition-colors duration-150 hover:bg-zinc-800"
												>
													<div className="flex items-center justify-between">
														<motion.div
															className="min-w-0 flex-1"
															whileHover={{ x: 5 }}
															transition={{ type: "spring", stiffness: 400 }}
														>
															<p className="truncate text-sm font-medium text-red-400">
																{weapon.nom}
															</p>
															<div className="mt-2 flex items-center space-x-4 text-sm text-zinc-400">
																<motion.div
																	className="flex items-center"
																	whileHover={{ scale: 1.05 }}
																>
																	<CurrencyDollarIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-zinc-500" />
																	<span>
																		{new Intl.NumberFormat("us-US", {
																			style: "currency",
																			currency: "USD",
																		}).format(weapon.prix_defaut / 100)}
																	</span>
																</motion.div>
																<motion.div
																	className="flex items-center"
																	whileHover={{ scale: 1.05 }}
																>
																	<FireIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-zinc-500" />
																	<span>
																		{new Intl.NumberFormat("us-US", {
																			style: "currency",
																			currency: "USD",
																		}).format(
																			weapon.cout_production_defaut / 100,
																		)}
																	</span>
																</motion.div>
																<motion.div
																	className="flex items-center"
																	whileHover={{ scale: 1.05 }}
																>
																	<span
																		className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getProfitClass(
																			Number.parseFloat(
																				calculateProfit(
																					weapon.prix_defaut,
																					weapon.cout_production_defaut,
																				),
																			),
																		)}`}
																	>
																		Marge:{" "}
																		{calculateProfit(
																			weapon.prix_defaut,
																			weapon.cout_production_defaut,
																		)}
																		%
																	</span>
																</motion.div>
															</div>
														</motion.div>
														<div className="flex items-center space-x-2">
															<Button
																onClick={() => startEditing(weapon)}
																variant="ghost"
																className="text-red-400 hover:bg-zinc-800 hover:text-red-300"
																disabled={isSubmitting}
															>
																<PencilIcon className="h-5 w-5" />
															</Button>
															<Button
																onClick={() => handleDeleteWeapon(weapon.id)}
																variant="ghost"
																className="text-red-400 hover:bg-zinc-800 hover:text-red-300"
																disabled={isSubmitting}
															>
																<TrashIcon className="h-5 w-5" />
															</Button>
														</div>
													</div>
												</motion.div>
											))}
										</AnimatePresence>
										{paginatedWeapons.length === 0 && (
											<motion.div
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												exit={{ opacity: 0 }}
												className="p-4 text-center text-zinc-400"
											>
												Aucune arme trouvée
											</motion.div>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
};
