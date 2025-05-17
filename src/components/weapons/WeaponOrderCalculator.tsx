"use client";

import OrderForm from "@/components/orders/OrderForm";
import type { CatalogEntry } from "@/components/orders/OrderForm";
import { getBaseWeapons } from "@/services/api";
import type { BaseWeapon } from "@prisma/client";
import { AlertCircle, Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";

// Get CatalogEntry interface from OrderForm to keep types consistent
// We'll import it by modifying OrderForm to export the interface

export function WeaponOrderCalculator() {
	const [allBaseWeapons, setAllBaseWeapons] = useState<BaseWeapon[]>([]);
	const [weaponCatalogEntries, setWeaponCatalogEntries] = useState<
		CatalogEntry[]
	>([]);
	const [loadingBaseWeapons, setLoadingBaseWeapons] = useState(true);
	const [loadingCatalog, setLoadingCatalog] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchAllData = async () => {
			try {
				// setLoadingBaseWeapons(true); // Commented: Handled by Suspense at page level
				// setLoadingCatalog(true);  // Commented: Handled by Suspense at page level
				setError(null);

				const baseWeaponsData = await getBaseWeapons(1, 100); // API only allows max pageSize of 100
				console.log(
					"WeaponOrderCalculator fetched baseWeaponsData:",
					baseWeaponsData,
				);
				if (
					baseWeaponsData?.baseWeapons &&
					Array.isArray(baseWeaponsData.baseWeapons)
				) {
					setAllBaseWeapons(baseWeaponsData.baseWeapons);
				} else if (Array.isArray(baseWeaponsData)) {
					// Handle direct array response
					setAllBaseWeapons(baseWeaponsData);
				} else {
					console.error(
						"Unexpected API response format for baseWeapons:",
						baseWeaponsData,
					);
					setError("Received unexpected base weapons data format.");
					setAllBaseWeapons([]);
				}
			} catch (err) {
				console.error("Error fetching base weapons:", err);
				setError("Failed to load base weapons data.");
			} finally {
				setLoadingBaseWeapons(false); // Keep for initialLoading prop logic
			}

			try {
				const catalogRes = await fetch("/api/weapons/catalog");
				if (!catalogRes.ok) {
					throw new Error(`Failed to fetch catalog: ${catalogRes.statusText}`);
				}
				const catalogData = await catalogRes.json();
				console.log("WeaponOrderCalculator fetched catalogData:", catalogData);
				if (Array.isArray(catalogData)) {
					setWeaponCatalogEntries(catalogData);
				} else {
					console.error(
						"Unexpected API response format for catalog:",
						catalogData,
					);
					setError((prevError) =>
						prevError
							? `${prevError} And unexpected catalog data format.`
							: "Unexpected catalog data format.",
					);
					setWeaponCatalogEntries([]);
				}
			} catch (err) {
				console.error("Error fetching weapon catalog:", err);
				setError((prevError) =>
					prevError
						? `${prevError} And failed to load catalog data.`
						: "Failed to load catalog data.",
				);
			} finally {
				setLoadingCatalog(false); // Keep for initialLoading prop logic
			}
		};

		fetchAllData();
	}, []);

	// isLoading and error states are primarily for internal logic or to be passed to OrderForm if needed.
	// The main loading UI is handled by WeaponOrderSkeleton via Suspense in the parent page.
	// Critical data fetching errors before rendering OrderForm might need an ErrorBoundary at the page level or a specific UI here if OrderForm cannot render.

	if ((loadingBaseWeapons || loadingCatalog) && !error) {
		// This component is wrapped in Suspense, so it shouldn't render its own full-component loader.
		// The WeaponOrderSkeleton from the page will be shown.
		// If there's a scenario where this component *must* render something minimal before data, it's unusual with Suspense.
		// For now, we assume OrderForm can handle potentially empty initial props or OrderForm itself shows specific feedback.
		return null; // Or a very minimal placeholder if absolutely necessary, but Suspense should cover it.
	}

	if (
		error &&
		(allBaseWeapons.length === 0 || weaponCatalogEntries.length === 0)
	) {
		// This error state means essential data for OrderForm is missing.
		// Displaying an error within the card content area.
		return (
			<div className="flex flex-col items-center justify-center py-10 text-red-600 dark:text-red-400">
				<AlertCircle className="h-10 w-10 mb-3" />
				<p className="font-semibold text-lg">
					Erreur de chargement des données
				</p>
				<p className="text-sm mt-2 text-center text-zinc-600 dark:text-zinc-300">
					{error}
				</p>
				<p className="text-xs mt-3 text-zinc-500 dark:text-zinc-400">
					Veuillez essayer de rafraîchir la page.
				</p>
			</div>
		);
	}

	// If data is partially loaded but still an error occurred (e.g., catalog failed but base weapons loaded),
	// OrderForm will receive potentially incomplete data and should handle it gracefully (e.g. disable parts of the form).

	return (
		<div className="w-full">
			<OrderForm
				baseWeapons={allBaseWeapons}
				weaponCatalogItems={weaponCatalogEntries}
				initialLoading={loadingBaseWeapons || loadingCatalog} // Pass loading state if OrderForm needs it
				dataError={error} // Pass error state if OrderForm needs to display specific messages
			/>
		</div>
	);
}
