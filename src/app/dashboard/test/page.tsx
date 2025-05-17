"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBaseWeapons } from "@/hooks/useBaseWeapons";
import type { PaginatedBaseWeaponsResponse } from "@/services/api";
import { formatPrice } from "@/utils/formatters";
import { useState } from "react";

export default function TestPage() {
	const { weapons, loading, error, refresh } = useBaseWeapons(100);
	const [directFetchResult, setDirectFetchResult] =
		useState<PaginatedBaseWeaponsResponse | null>(null);
	const [directFetchError, setDirectFetchError] = useState<string | null>(null);
	const [directLoading, setDirectLoading] = useState(false);

	const fetchDirectly = async () => {
		setDirectLoading(true);
		setDirectFetchError(null);
		try {
			const response = await fetch("/api/base-weapons", {
				method: "GET",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(`Erreur ${response.status}: ${response.statusText}`);
			}

			const data = await response.json();
			setDirectFetchResult(data);
		} catch (err) {
			console.error("Direct fetch error:", err);
			setDirectFetchError(
				err instanceof Error ? err.message : "Erreur inconnue",
			);
		} finally {
			setDirectLoading(false);
		}
	};

	return (
		<div className="container mx-auto p-6">
			<h1 className="text-2xl font-bold mb-6">Test de chargement des armes</h1>

			<div className="flex flex-wrap gap-6">
				<div className="flex-1 min-w-[300px]">
					<Card className="mb-6">
						<CardHeader>
							<CardTitle>Via le hook useBaseWeapons</CardTitle>
						</CardHeader>
						<CardContent>
							<Button onClick={() => refresh()} disabled={loading}>
								{loading ? "Chargement..." : "Rafraîchir les données"}
							</Button>

							{error && (
								<div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
									<p className="font-bold">Erreur (hook):</p>
									<p>{error}</p>
								</div>
							)}

							<div className="mt-4">
								<h3 className="font-semibold mb-2">
									Armes chargées via le hook: {weapons.length}
								</h3>
								{loading ? (
									<p>Chargement...</p>
								) : weapons.length === 0 ? (
									<p className="text-zinc-500">Aucune arme trouvée</p>
								) : (
									<ul className="space-y-2">
										{weapons.map((weapon) => (
											<li key={weapon.id} className="border p-3 rounded">
												<div className="font-medium">{weapon.nom}</div>
												<div className="text-sm text-zinc-600">
													Prix: {formatPrice(weapon.prix_defaut)} | Coût:{" "}
													{formatPrice(weapon.cout_production_defaut)}
												</div>
											</li>
										))}
									</ul>
								)}
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="flex-1 min-w-[300px]">
					<Card className="mb-6">
						<CardHeader>
							<CardTitle>Via fetch direct</CardTitle>
						</CardHeader>
						<CardContent>
							<Button onClick={fetchDirectly} disabled={directLoading}>
								{directLoading ? "Chargement..." : "Fetch direct"}
							</Button>

							{directFetchError && (
								<div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
									<p className="font-bold">Erreur (direct):</p>
									<p>{directFetchError}</p>
								</div>
							)}

							<div className="mt-4">
								<h3 className="font-semibold mb-2">Résultat direct:</h3>
								{directLoading ? (
									<p>Chargement...</p>
								) : !directFetchResult ? (
									<p className="text-zinc-500">Aucun résultat</p>
								) : (
									<pre className="bg-zinc-100 p-3 rounded text-xs overflow-auto max-h-[200px]">
										{JSON.stringify(directFetchResult, null, 2)}
									</pre>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
