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
import { SelectNative } from "@/components/ui/select-native";
import { Role } from "@/services/api";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";

interface Props {
	open: boolean;
	onClose: () => void;
	userId?: number | undefined;
}

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
		transition: {
			type: "spring",
			stiffness: 300,
			damping: 30,
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
	visible: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: 20 },
};

interface Feedback {
	id: number;
	type: "BUG" | "FEATURE_REQUEST";
	title: string;
	description: string;
	status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
	createdAt: string;
	user: {
		name: string;
		color: string;
	};
}

const getStatusColor = (status: string) => {
	switch (status) {
		case "OPEN": {
			return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
		}
		case "IN_PROGRESS": {
			return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
		}
		case "RESOLVED": {
			return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
		}
		case "REJECTED": {
			return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
		}
		default: {
			return "bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200";
		}
	}
};

const getTypeColor = (type: string) => {
	return type === "BUG"
		? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
		: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
};

export default function FeedbackManager({ open, onClose, userId }: Props) {
	const { data: session } = useSession();
	const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [type, setType] = useState<"BUG" | "FEATURE_REQUEST">("BUG");
	const [status, setStatus] = useState<
		"OPEN" | "IN_PROGRESS" | "RESOLVED" | "REJECTED"
	>("OPEN");
	const [success, setSuccess] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const hasAdminAccess =
		session?.user.role === Role.DEVELOPER ||
		session?.user.role === Role.PATRON ||
		session?.user.role === Role.CO_PATRON;

	const fetchFeedbacks = useCallback(async () => {
		if (!hasAdminAccess) return;

		try {
			if (session?.user.role !== Role.DEVELOPER) {
				setFeedbacks([]);
				return;
			}

			const response = await fetch("/api/feedback");
			if (!response.ok) throw new Error("Failed to fetch feedbacks");
			const data = await response.json();
			setFeedbacks(data);
		} catch (error) {
			console.error("Error fetching feedbacks:", error);
			setError("Erreur lors du chargement des retours");
		}
	}, [hasAdminAccess, session?.user.role]);

	useEffect(() => {
		if (open) {
			fetchFeedbacks();
		}
	}, [open, fetchFeedbacks]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);

		try {
			const response = await fetch("/api/feedback", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					title,
					description,
					type,
					status: hasAdminAccess ? status : "OPEN",
					userId: userId || null,
				}),
			});

			if (!response.ok) throw new Error("Failed to submit feedback");

			setSuccess("Retour soumis avec succès !");
			setTitle("");
			setDescription("");
			setType("BUG");
			setStatus("OPEN");
			fetchFeedbacks();
			setTimeout(() => setSuccess(null), 3000);
		} catch (error) {
			console.error("Error submitting feedback:", error);
			setError("Erreur lors de la soumission du retour");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleStatusChange = async (
		feedbackId: number,
		newStatus: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "REJECTED",
	) => {
		if (session?.user.role !== Role.DEVELOPER) {
			setError(
				"Action non autorisée. Seuls les développeurs peuvent modifier les statuts.",
			);
			return;
		}

		try {
			const response = await fetch("/api/feedback", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					id: feedbackId,
					status: newStatus,
				}),
			});

			if (!response.ok) throw new Error("Failed to update feedback status");

			fetchFeedbacks();
			setSuccess("Statut mis à jour avec succès !");
			setTimeout(() => setSuccess(null), 3000);
		} catch (error) {
			console.error("Error updating feedback status:", error);
			setError("Erreur lors de la mise à jour du statut");
		}
	};

	const handleDelete = async (feedbackId: number) => {
		if (session?.user.role !== Role.DEVELOPER) {
			setError(
				"Action non autorisée. Seuls les développeurs peuvent supprimer les retours.",
			);
			return;
		}

		if (!confirm("Êtes-vous sûr de vouloir supprimer ce retour ?")) return;

		try {
			const response = await fetch(`/api/feedback?id=${feedbackId}`, {
				method: "DELETE",
			});

			if (!response.ok) throw new Error("Failed to delete feedback");

			fetchFeedbacks();
			setSuccess("Retour supprimé avec succès !");
			setTimeout(() => setSuccess(null), 3000);
		} catch (error) {
			console.error("Error deleting feedback:", error);
			setError("Erreur lors de la suppression du retour");
		}
	};

	const filteredFeedbacks = feedbacks.filter(
		(feedback) =>
			feedback.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			feedback.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
			feedback.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
			feedback.status.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	if (!open) return null;

	return (
		<>
			<Dialog open={open} onOpenChange={onClose}>
				<DialogPortal>
					<DialogOverlay className="bg-black/30 backdrop-blur-sm dark:bg-zinc-900/40" />
					<DialogContent className="h-[85vh] max-w-[95vw] border border-zinc-800 bg-zinc-900 p-0 shadow-2xl xl:max-w-[90vw] 2xl:max-w-[85vw]">
						<div className="flex h-full flex-col">
							<div className="border-b border-zinc-700 p-3">
								<div className="flex items-center justify-between">
									<DialogTitle className="text-xl font-semibold text-zinc-100">
										{hasAdminAccess
											? "Gestionnaire de retours"
											: "Soumettre un retour"}
									</DialogTitle>
									<DialogDescription className="sr-only">
										{hasAdminAccess
											? "Gérez les retours des utilisateurs"
											: "Soumettez un retour pour améliorer l'application"}
									</DialogDescription>
									<div className="flex items-center space-x-4">
										{hasAdminAccess && (
											<div className="relative">
												<Input
													type="text"
													placeholder="Rechercher un retour..."
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
										)}
										<Button
											onClick={onClose}
											variant="outline"
											className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
										>
											Fermer
										</Button>
									</div>
								</div>
							</div>

							<div
								className={`flex min-h-0 flex-1 ${hasAdminAccess ? "" : "items-center justify-center"}`}
							>
								<div
									className={
										hasAdminAccess
											? "w-1/3 overflow-y-auto border-r border-zinc-700 bg-zinc-900 p-4"
											: "w-full max-w-lg p-4"
									}
								>
									{error && (
										<div className="mb-3 rounded border-l-4 border-red-700 bg-red-900/50 p-2 text-sm text-red-300">
											{error}
										</div>
									)}

									{success && (
										<motion.div
											initial="hidden"
											animate="visible"
											exit="exit"
											variants={successVariants}
											className="mb-3 rounded border-l-4 border-emerald-700 bg-emerald-900/50 p-2 text-sm text-emerald-300"
										>
											{success}
										</motion.div>
									)}

									<form onSubmit={handleSubmit} className="space-y-3">
										<div>
											<label
												htmlFor="feedbackType"
												className="mb-1 block text-sm font-medium text-zinc-300"
											>
												Type
											</label>
											<SelectNative
												id="feedbackType"
												value={type}
												onChange={(e) =>
													setType(e.target.value as "BUG" | "FEATURE_REQUEST")
												}
												className="w-full rounded-md border border-zinc-600 bg-zinc-800 py-1.5 pl-4 pr-10 text-sm text-zinc-100 placeholder-zinc-400 focus:border-red-500 focus:ring-red-500"
												required
												disabled={isSubmitting}
											>
												<option value="BUG">Bug</option>
												<option value="FEATURE_REQUEST">
													Nouvelle fonctionnalité
												</option>
											</SelectNative>
										</div>

										<div>
											<label
												htmlFor="feedbackTitle"
												className="mb-1 block text-sm font-medium text-zinc-300"
											>
												Titre
											</label>
											<Input
												id="feedbackTitle"
												type="text"
												value={title}
												onChange={(e) => setTitle(e.target.value)}
												className="w-full rounded-md border border-zinc-600 bg-zinc-800 py-1.5 px-4 text-sm text-zinc-100 placeholder-zinc-400 focus:border-red-500 focus:ring-red-500"
												required
												disabled={isSubmitting}
											/>
										</div>

										<div>
											<label
												htmlFor="feedbackDescription"
												className="mb-1 block text-sm font-medium text-zinc-300"
											>
												Description
											</label>
											<textarea
												id="feedbackDescription"
												value={description}
												onChange={(e) => setDescription(e.target.value)}
												rows={4}
												className="w-full rounded-md border border-zinc-600 bg-zinc-800 py-1.5 px-4 text-sm text-zinc-100 placeholder-zinc-400 focus:border-red-500 focus:ring-red-500"
												required
												disabled={isSubmitting}
											/>
										</div>

										{hasAdminAccess && (
											<div>
												<label
													htmlFor="feedbackStatus"
													className="mb-1 block text-sm font-medium text-zinc-300"
												>
													Statut
												</label>
												<SelectNative
													id="feedbackStatus"
													value={status}
													onChange={(e) =>
														setStatus(
															e.target.value as
																| "OPEN"
																| "IN_PROGRESS"
																| "RESOLVED"
																| "REJECTED",
														)
													}
													className="w-full rounded-md border border-zinc-600 bg-zinc-800 py-1.5 pl-4 pr-10 text-sm text-zinc-100 placeholder-zinc-400 focus:border-red-500 focus:ring-red-500"
													required
													disabled={isSubmitting}
												>
													<option value="OPEN">Ouvert</option>
													<option value="IN_PROGRESS">En cours</option>
													<option value="RESOLVED">Résolu</option>
													<option value="REJECTED">Rejeté</option>
												</SelectNative>
											</div>
										)}

										<div className="pt-2">
											<Button
												type="submit"
												className={`flex w-full items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm ${
													isSubmitting
														? "bg-red-500/50"
														: "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500"
												} focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
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
														Soumission...
													</>
												) : (
													<>
														<PlusIcon className="mr-1.5 h-4 w-4" />
														Soumettre le retour
													</>
												)}
											</Button>
										</div>
									</form>
								</div>

								{hasAdminAccess && (
									<div className="flex min-h-0 flex-1 flex-col bg-zinc-900">
										<div className="border-b border-zinc-700 bg-zinc-800 px-4 py-2">
											<div className="flex items-center justify-between">
												<h3 className="text-sm font-medium text-zinc-100">
													Retours existants
													<span className="ml-2 text-xs text-zinc-400">
														({filteredFeedbacks.length} résultats)
													</span>
												</h3>
											</div>
										</div>

										<div className="flex-1 overflow-y-auto">
											<div className="space-y-2 p-4">
												<AnimatePresence mode="popLayout">
													{filteredFeedbacks.map((feedback) => (
														<motion.div
															key={feedback.id}
															variants={listItemVariants}
															initial="hidden"
															animate="visible"
															exit="exit"
															layout
															className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 transition-colors duration-150 hover:bg-zinc-800"
														>
															<div className="space-y-3">
																<div className="flex items-center justify-between">
																	<div className="flex flex-col">
																		<span className="text-lg font-medium text-red-400">
																			{feedback.title}
																		</span>
																		<span className="text-sm text-zinc-400">
																			{feedback.user
																				? `Par ${feedback.user.name}`
																				: "Anonyme"}{" "}
																			-{" "}
																			{new Date(
																				feedback.createdAt,
																			).toLocaleDateString()}
																		</span>
																	</div>
																	<div className="flex items-center space-x-2">
																		<SelectNative
																			value={feedback.status}
																			onChange={(e) =>
																				handleStatusChange(
																					feedback.id,
																					e.target.value as
																						| "OPEN"
																						| "IN_PROGRESS"
																						| "RESOLVED"
																						| "REJECTED",
																				)
																			}
																			className="rounded-md border border-zinc-600 bg-zinc-700 py-1 pl-2 pr-8 text-xs text-zinc-100 placeholder-zinc-400 focus:border-red-500 focus:ring-red-500"
																		>
																			<option value="OPEN">Ouvert</option>
																			<option value="IN_PROGRESS">
																				En cours
																			</option>
																			<option value="RESOLVED">Résolu</option>
																			<option value="REJECTED">Rejeté</option>
																		</SelectNative>
																		<Button
																			onClick={() => handleDelete(feedback.id)}
																			variant="ghost"
																			className="rounded-full p-1 text-red-400 hover:bg-zinc-700 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:ring-offset-zinc-900"
																		>
																			<TrashIcon className="h-5 w-5" />
																		</Button>
																	</div>
																</div>

																<p className="text-sm text-zinc-300">
																	{feedback.description}
																</p>

																<div className="flex items-center space-x-2">
																	<span
																		className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeColor(feedback.type)}`}
																	>
																		{feedback.type === "BUG"
																			? "Bug"
																			: "Nouvelle fonctionnalité"}
																	</span>
																	<span
																		className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(feedback.status)}`}
																	>
																		{feedback.status}
																	</span>
																</div>
															</div>
														</motion.div>
													))}
												</AnimatePresence>
												{filteredFeedbacks.length === 0 && (
													<motion.div
														initial={{ opacity: 0 }}
														animate={{ opacity: 1 }}
														exit={{ opacity: 0 }}
														className="p-4 text-center text-zinc-400"
													>
														Aucun retour trouvé
													</motion.div>
												)}
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					</DialogContent>
				</DialogPortal>
			</Dialog>
		</>
	);
}
