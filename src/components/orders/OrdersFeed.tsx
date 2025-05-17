"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { type Order, updateOrderStatus } from "@/services/api";
import { formatDate, formatPrice } from "@/utils/formatters";
import {
	AlertTriangle,
	CheckCircle,
	ExternalLink,
	ListOrdered,
	Loader2,
	UserCircle,
	XCircle,
} from "lucide-react";
import { useState } from "react";

interface OrdersFeedProps {
	orders: Order[];
	isAdmin: boolean;
	onStatusChange: (
		orderId: number,
		newStatus: "PENDING" | "COMPLETED" | "CANCELLED",
	) => void;
}

export default function OrdersFeed({
	orders,
	isAdmin,
	onStatusChange,
}: OrdersFeedProps) {
	const [processingOrderIds, setProcessingOrderIds] = useState<number[]>([]);

	const handleComplete = async (orderId: number) => {
		try {
			setProcessingOrderIds((prev) => [...prev, orderId]);
			await updateOrderStatus(orderId, "COMPLETED");
			toast({
				title: "Commande Traitée",
				description: `La commande #${orderId} a été marquée comme terminée.`,
			});
			onStatusChange(orderId, "COMPLETED");
		} catch (error) {
			console.error("Échec de la finalisation de la commande:", error);
			toast({
				title: "Action Échouée",
				description: "Impossible de terminer la commande. Veuillez réessayer.",
				variant: "destructive",
			});
		} finally {
			setProcessingOrderIds((prev) => prev.filter((id) => id !== orderId));
		}
	};

	const handleCancel = async (orderId: number) => {
		try {
			setProcessingOrderIds((prev) => [...prev, orderId]);
			await updateOrderStatus(orderId, "CANCELLED");
			toast({
				title: "Commande Annulée",
				description: `La commande #${orderId} a été annulée.`,
			});
			onStatusChange(orderId, "CANCELLED");
		} catch (error) {
			console.error("Échec de l'annulation de la commande:", error);
			toast({
				title: "Action Échouée",
				description: "Impossible d'annuler la commande. Veuillez réessayer.",
				variant: "destructive",
			});
		} finally {
			setProcessingOrderIds((prev) => prev.filter((id) => id !== orderId));
		}
	};

	if (orders.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[calc(100vh-320px)] text-center p-6">
				<div className="flex flex-col items-center justify-center p-10 md:p-16 bg-white dark:bg-zinc-800/30 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ease-out transform hover:-translate-y-1 ring-1 ring-zinc-200 dark:ring-zinc-700/50 w-full max-w-lg">
					<ListOrdered className="h-20 w-20 text-red-500/70 dark:text-red-400/70 mb-8 opacity-90" />
					<h3 className="text-2xl font-semibold text-zinc-700 dark:text-zinc-200 mb-3">
						Flux de commandes vide
					</h3>
					<p className="text-base text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed">
						Aucune commande en attente. Dès qu'une nouvelle commande sera créée,
						elle s'affichera ici.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 pb-6">
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{orders.map((order, index) => (
					<Card
						key={order.id}
						style={{ animationDelay: `${index * 80}ms` }}
						className="group opacity-0 bg-white dark:bg-zinc-800/80 shadow-lg hover:shadow-xl border border-zinc-200/80 dark:border-zinc-700/60 rounded-2xl flex flex-col transition-all duration-300 ease-out hover:-translate-y-1.5 animate-fadeInUpCard"
					>
						<CardHeader className="p-5 border-b border-zinc-100 dark:border-zinc-700/40">
							<div className="flex justify-between items-start gap-2">
								<CardTitle className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200">
									Cmd{" "}
									<span className="font-mono bg-zinc-100 dark:bg-zinc-700/60 px-1.5 py-0.5 rounded-md">
										#{order.id}
									</span>
								</CardTitle>
								<Badge
									variant="outline"
									className="text-xs font-medium px-2.5 py-1 rounded-full border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 shrink-0"
								>
									En attente
								</Badge>
							</div>
							<div className="text-sm text-zinc-500 dark:text-zinc-400 pt-2 flex items-center">
								<UserCircle className="h-4 w-4 mr-2 text-zinc-400 dark:text-zinc-500 shrink-0" />
								<span className="truncate">{order.user?.name || "N/A"}</span>
								<span className="mx-1.5 text-zinc-300 dark:text-zinc-600">
									&bull;
								</span>
								<span className="shrink-0">
									{formatDate(new Date(order.createdAt))}
								</span>
							</div>
						</CardHeader>
						<CardContent className="p-5 space-y-4 flex-grow">
							<div>
								<h4 className="font-medium text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
									Articles :
								</h4>
								<ul className="space-y-1.5 text-sm">
									{order.items?.slice(0, 2).map((item) => (
										<li
											key={item.id}
											className="flex justify-between items-center text-zinc-600 dark:text-zinc-300"
										>
											<span className="flex items-center truncate max-w-[180px]">
												<Badge
													variant="secondary"
													className="mr-2 px-1.5 py-0.5 text-[10px] rounded-md bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-normal shrink-0"
												>
													{item.quantity}x
												</Badge>
												<span
													className="truncate"
													title={
														item.baseWeapon?.nom || `Arme #${item.baseWeaponId}`
													}
												>
													{item.baseWeapon?.nom || `Arme #${item.baseWeaponId}`}
												</span>
											</span>
											<span className="font-semibold text-zinc-700 dark:text-zinc-200">
												{formatPrice(item.pricePerItem * item.quantity)}
											</span>
										</li>
									))}
									{order.items && order.items.length > 2 && (
										<li className="text-sm text-red-500 dark:text-red-400 hover:underline pt-1 text-center cursor-pointer group/seemore flex items-center justify-center gap-1">
											(+ {order.items.length - 2} de plus)
											<ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover/seemore:opacity-100 transition-opacity" />
										</li>
									)}
								</ul>
							</div>
							<div className="pt-4 mt-auto border-t border-dashed border-zinc-200 dark:border-zinc-700/50 flex justify-between items-baseline">
								<span className="text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold">
									Total
								</span>
								<span className="font-bold text-xl text-zinc-800 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200">
									{formatPrice(order.totalPrice)}
								</span>
							</div>
						</CardContent>
						{isAdmin && (
							<CardFooter className="p-3 flex gap-2 justify-end bg-zinc-50/70 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-700/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
								<Button
									title="Marquer comme Annulée"
									variant="ghost"
									size="icon"
									disabled={processingOrderIds.includes(order.id)}
									onClick={() => handleCancel(order.id)}
									className="h-9 w-9 text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/15 focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:ring-offset-0 dark:focus-visible:ring-offset-zinc-800 rounded-lg"
								>
									{processingOrderIds.includes(order.id) &&
									order.status !== "COMPLETED" ? (
										<Loader2 className="h-4.5 w-4.5 animate-spin" />
									) : (
										<XCircle className="h-5 w-5" />
									)}
									<span className="sr-only">Annuler</span>
								</Button>
								<Button
									title="Marquer comme Terminée"
									variant="ghost"
									size="icon"
									disabled={processingOrderIds.includes(order.id)}
									onClick={() => handleComplete(order.id)}
									className="h-9 w-9 text-green-600 hover:bg-green-500/10 dark:hover:bg-green-500/15 focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-0 dark:focus-visible:ring-offset-zinc-800 rounded-lg"
								>
									{processingOrderIds.includes(order.id) &&
									order.status !== "CANCELLED" ? (
										<Loader2 className="h-4.5 w-4.5 animate-spin" />
									) : (
										<CheckCircle className="h-5 w-5" />
									)}
									<span className="sr-only">Terminer</span>
								</Button>
							</CardFooter>
						)}
					</Card>
				))}
			</div>
		</div>
	);
}
