"use client";

import { LoadingOverlay } from "@/components/ui/loading";
import { useSession } from "next-auth/react";
import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	type ReactNode,
	useRef,
} from "react";
import {
	type BaseWeapon,
	type User,
	type Weapon,
	getBaseWeapons,
	getUsers,
	getWeapons,
} from "../services/api";

interface DataContextType {
	weapons: Weapon[];
	users: User[];
	baseWeapons: BaseWeapon[];
	loading: boolean;
	error: string | null;
	currentPage: number;
	pageSize: number;
	totalWeapons: number;

	baseWeaponsCurrentPage: number;
	baseWeaponsPageSize: number;
	totalBaseWeapons: number;
	refreshWeapons: (page: number, pageSize: number) => Promise<void>;
	refreshUsers: () => Promise<void>;

	refreshBaseWeapons: (page: number, pageSize: number) => Promise<void>;
	refreshAll: () => Promise<void>;
	setCurrentPage: (page: number) => void;

	setBaseWeaponsCurrentPage: (page: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const LoadingDisplayContext = createContext<boolean>(true);

export function DataProvider({
	children,
	useOverlay = true,
}: {
	children: ReactNode;
	useOverlay?: boolean;
}) {
	const { status } = useSession();
	const [weapons, setWeapons] = useState<Weapon[]>([]);
	const [users, setUsers] = useState<User[]>([]);
	const [baseWeapons, setBaseWeapons] = useState<BaseWeapon[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [currentPage, setCurrentPageInternal] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [totalWeapons, setTotalWeapons] = useState(0);

	const [baseWeaponsCurrentPage, setBaseWeaponsCurrentPageInternal] =
		useState(1);
	const [baseWeaponsPageSize, setBaseWeaponsPageSize] = useState(50);
	const [totalBaseWeapons, setTotalBaseWeapons] = useState(0);

	const initialLoadDone = useRef(false);

	const refreshWeapons = useCallback(async (page: number, size: number) => {
		setLoading(true);
		setError(null);
		try {
			const data = await getWeapons(page, size);
			setWeapons(data.weapons);
			setTotalWeapons(data.totalCount);
			setCurrentPageInternal(page);
			setPageSize(size);
		} catch (error) {
			console.error(`Error fetching weapons page ${page}:`, error);
			setError("Error fetching weapons");
		} finally {
			setLoading(false);
		}
	}, []);

	const refreshUsers = useCallback(async () => {
		try {
			const data = await getUsers();
			setUsers(data);
		} catch (error) {
			console.error("Error fetching users:", error);
			setError("Error fetching users");
		}
	}, []);

	const refreshBaseWeapons = useCallback(async (page: number, size: number) => {
		try {
			const data = await getBaseWeapons(page, size);
			setBaseWeapons(data.baseWeapons);
			setTotalBaseWeapons(data.totalCount);
			setBaseWeaponsCurrentPageInternal(page);
			setBaseWeaponsPageSize(size);
		} catch (error) {
			console.error(`Error fetching base weapons page ${page}:`, error);
			setError("Error fetching base weapons");
		}
	}, []);

	const refreshAll = useCallback(async () => {
		if (status !== "authenticated") {
			setLoading(false);
			initialLoadDone.current = false;
			return;
		}

		setLoading(true);
		setError(null);
		initialLoadDone.current = true;
		try {
			await refreshWeapons(1, pageSize);
		} catch (error) {
			console.error("Error refreshing data:", error);
			setError("Error refreshing data");
		} finally {
			setLoading(false);
		}
	}, [status, pageSize, refreshWeapons]);

	useEffect(() => {
		if (status === "authenticated" && !initialLoadDone.current) {
			refreshAll();
		}
	}, [status, refreshAll]);

	const setCurrentPage = useCallback((page: number) => {
		setCurrentPageInternal(page);
	}, []);

	const setBaseWeaponsCurrentPage = useCallback((page: number) => {
		setBaseWeaponsCurrentPageInternal(page);
	}, []);

	const content = (
		<DataContext.Provider
			value={{
				weapons,
				users,
				baseWeapons,
				loading,
				error,

				currentPage,
				pageSize,
				totalWeapons,

				baseWeaponsCurrentPage,
				baseWeaponsPageSize,
				totalBaseWeapons,

				refreshWeapons,
				refreshUsers,
				refreshBaseWeapons,
				refreshAll,
				setCurrentPage,
				setBaseWeaponsCurrentPage,
			}}
		>
			<LoadingDisplayContext.Provider value={!useOverlay}>
				{children}
			</LoadingDisplayContext.Provider>
		</DataContext.Provider>
	);

	return useOverlay ? (
		<LoadingOverlay loading={loading} text="Chargement des données...">
			{content}
		</LoadingOverlay>
	) : (
		content
	);
}

export function useData() {
	const context = useContext(DataContext);
	if (context === undefined) {
		throw new Error("useData must be used within a DataProvider");
	}
	return context;
}

export function useShouldDisplayLoading() {
	return useContext(LoadingDisplayContext);
}
