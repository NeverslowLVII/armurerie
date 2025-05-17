import { getBaseWeapons } from "@/services/api";
import type { BaseWeapon } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";

export function useBaseWeapons(pageSize = 100) {
	const [weapons, setWeapons] = useState<BaseWeapon[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchWeapons = useCallback(
		async (page = 1) => {
			try {
				setLoading(true);

				const data = await getBaseWeapons(page, pageSize);

				if (data?.baseWeapons && Array.isArray(data.baseWeapons)) {
					setWeapons(data.baseWeapons);
				} else {
					console.error("Unexpected data format:", data);
					setError("Format de réponse inattendu");
				}
			} catch (err) {
				console.error("Error fetching base weapons:", err);
				setError("Impossible de charger les armes de base");
			} finally {
				setLoading(false);
			}
		},
		[pageSize],
	);

	useEffect(() => {
		fetchWeapons();
	}, [fetchWeapons]);

	return {
		weapons,
		loading,
		error,
		refresh: fetchWeapons,
	};
}
