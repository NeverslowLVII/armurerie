"use client";

import OrdersFeed from "@/components/orders/OrdersFeed";
import OrdersList from "@/components/orders/OrdersList";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserRole } from "@/hooks/useUserRole";
import { type Order, getOrders } from "@/services/api";
import { AlertCircle, Loader2, ServerCrash } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function OrdersPage() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);

	const { isAdmin, isAuthenticated, isLoading: authIsLoading } = useUserRole();

	const fetchOrders = useCallback(
		async (page = 1) => {
			try {
				setLoading(true);
				setError(null);

				if (!isAuthenticated) {
					setError("Accès non autorisé. Veuillez vous connecter.");
					setLoading(false);
					return;
				}

				const data = await getOrders(page, 10);
				setOrders(data.orders);
				setTotalPages(data.pagination.totalPages);
				setCurrentPage(data.pagination.currentPage);
			} catch (err) {
				console.error("Échec de récupération des commandes:", err);
				setError(
					"Oups ! Impossible de charger les commandes pour le moment. Vérifiez votre connexion ou réessayez plus tard.",
				);
			} finally {
				setLoading(false);
			}
		},
		[isAuthenticated],
	);

	useEffect(() => {
		if (isAuthenticated) {
			fetchOrders();
		} else if (!authIsLoading) {
			setError(
				"Accès non autorisé. Veuillez vous connecter pour voir les commandes.",
			);
			setLoading(false);
		}
	}, [isAuthenticated, authIsLoading, fetchOrders]);

	const handlePageChange = (newPage: number) => {
		fetchOrders(newPage);
	};

	const handleStatusChange = async (
		_orderId: number,
		_newStatus: "PENDING" | "COMPLETED" | "CANCELLED",
	) => {
		fetchOrders(currentPage);
	};

	return (
		<div className="min-h-screen p-4 sm:p-6 lg:p-8">
			<div className="container mx-auto max-w-screen-xl">
				<header className="mb-10 text-center md:text-left">
					<h1 className="text-3xl sm:text-4xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">
						Gestion des Commandes
					</h1>
					<p className="text-base text-zinc-500 dark:text-zinc-400 mt-2 max-w-2xl md:max-w-none mx-auto md:mx-0">
						Suivez, gérez et traitez toutes les commandes de votre système avec
						précision et efficacité.
					</p>
				</header>

				{error && !loading && (
					<Alert
						variant="destructive"
						className="my-8 max-w-3xl mx-auto bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700/40 text-red-700 dark:text-red-300 rounded-lg shadow-md p-5"
					>
						<ServerCrash className="h-5 w-5 mr-2.5 text-red-500 dark:text-red-400" />
						<AlertTitle className="font-semibold text-md">
							Erreur de Chargement des Commandes
						</AlertTitle>
						<AlertDescription className="mt-1">{error}</AlertDescription>
					</Alert>
				)}

				{!error && !isAuthenticated && !authIsLoading && (
					<Alert
						variant="destructive"
						className="my-8 max-w-3xl mx-auto bg-yellow-50 dark:bg-yellow-800/20 border-yellow-300 dark:border-yellow-700/40 text-yellow-700 dark:text-yellow-300 rounded-lg shadow-md p-5"
					>
						<AlertCircle className="h-5 w-5 mr-2.5 text-yellow-500 dark:text-yellow-400" />
						<AlertTitle className="font-semibold text-md">
							Accès Non Autorisé
						</AlertTitle>
						<AlertDescription className="mt-1">
							Veuillez vous connecter pour accéder à la gestion des commandes.
						</AlertDescription>
					</Alert>
				)}

				{isAuthenticated && (
					<Tabs defaultValue="list" className="w-full">
						<TabsList className="flex items-center justify-start border-b border-zinc-200 dark:border-zinc-700/60 mb-8 space-x-2">
							<TabsTrigger
								value="list"
								className="relative px-4 py-2.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-500 data-[state=active]:font-semibold transition-all duration-150 after:content-[''] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2.5px] after:bg-red-600 dark:after:bg-red-500 after:scale-x-0 after:transition-transform after:duration-200 after:ease-out data-[state=active]:after:scale-x-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 ring-offset-zinc-50 dark:ring-offset-zinc-950 rounded-none"
							>
								Liste Détaillée
							</TabsTrigger>
							<TabsTrigger
								value="feed"
								className="relative px-4 py-2.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-500 data-[state=active]:font-semibold transition-all duration-150 after:content-[''] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2.5px] after:bg-red-600 dark:after:bg-red-500 after:scale-x-0 after:transition-transform after:duration-200 after:ease-out data-[state=active]:after:scale-x-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 ring-offset-zinc-50 dark:ring-offset-zinc-950 rounded-none"
							>
								Flux Actif
							</TabsTrigger>
						</TabsList>

						<TabsContent value="list">
							{loading && orders.length === 0 ? (
								<div className="flex flex-col justify-center items-center min-h-[400px] bg-zinc-100/50 dark:bg-zinc-800/30 rounded-xl p-6">
									<Loader2 className="h-10 w-10 animate-spin text-red-500 mb-4" />
									<p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
										Chargement des commandes...
									</p>
								</div>
							) : !loading && orders.length === 0 && !error ? (
								<div className="text-center py-10">
									<p className="text-zinc-500 dark:text-zinc-400">
										Aucune commande à afficher dans la liste.
									</p>
								</div>
							) : (
								<OrdersList
									orders={orders}
									isAdmin={isAdmin}
									currentPage={currentPage}
									totalPages={totalPages}
									onPageChange={handlePageChange}
									onStatusChange={handleStatusChange}
								/>
							)}
						</TabsContent>

						<TabsContent value="feed">
							{loading &&
							orders.filter((o) => o.status === "PENDING").length === 0 ? (
								<div className="flex flex-col justify-center items-center min-h-[400px] bg-zinc-100/50 dark:bg-zinc-800/30 rounded-xl p-6">
									<Loader2 className="h-10 w-10 animate-spin text-red-500 mb-4" />
									<p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
										Chargement du flux des commandes...
									</p>
								</div>
							) : (
								<OrdersFeed
									orders={orders.filter((order) => order.status === "PENDING")}
									isAdmin={isAdmin}
									onStatusChange={handleStatusChange}
								/>
							)}
						</TabsContent>
					</Tabs>
				)}
			</div>
		</div>
	);
}
