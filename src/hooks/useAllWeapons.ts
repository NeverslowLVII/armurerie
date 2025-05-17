import type { Weapon } from "@/services/api";
import { useCallback, useEffect, useState } from "react";

export function useAllWeapons() {
	const [weapons, setWeapons] = useState<Weapon[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchAllWeapons = useCallback(async () => {
		try {
			setLoading(true);

			const pageSize = 1000;
			const response = await fetch(`/api/weapons?page=1&pageSize=${pageSize}`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch weapons: ${response.statusText}`);
			}

			const data = await response.json();

			if (data?.weapons && Array.isArray(data.weapons)) {
				setWeapons(data.weapons);
			} else {
				console.error("Unexpected data format:", data);
				setError("Format de réponse inattendu");
			}
		} catch (err) {
			console.error("Error fetching all weapons:", err);
			setError("Impossible de charger la liste complète des armes");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchAllWeapons();
	}, [fetchAllWeapons]);

	return {
		weapons,
		loading,
		error,
		refresh: fetchAllWeapons,
	};
}
