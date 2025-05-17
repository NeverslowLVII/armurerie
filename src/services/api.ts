import type { Role } from "@prisma/client";
import axiosInstance from "axios";

export { Role } from "@prisma/client";

const getBaseUrl = () => {
	if (typeof globalThis !== "undefined") {
		return "/api";
	}
	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}/api`;
	}
	if (process.env.NEXT_PUBLIC_API_URL) {
		return process.env.NEXT_PUBLIC_API_URL;
	}

	return "http://localhost:3000/api";
};

const baseURL = getBaseUrl();
axiosInstance.defaults.baseURL = baseURL;

export interface User {
	id: number;
	name: string;
	email: string;
	username?: string;
	color: string | null;
	role: Role;
	contractUrl?: string;
	commission: number;
	lastLogin?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface Weapon {
	id: number;
	horodateur: string;
	user_id: number;
	detenteur: string;
	bp: string | null;
	nom_arme: string;
	serigraphie: string;
	prix: number;
	cout_production: number;
	user: User;
	base_weapon?: BaseWeapon;
}

interface WeaponCreate {
	horodateur: string;
	user_id: number;
	detenteur: string;
	bp?: string;
	nom_arme: string;
	serigraphie: string;
	prix: number;
	cout_production: number;
}

export interface BaseWeapon {
	id: number;
	nom: string;
	prix_defaut: number;
	cout_production_defaut: number;
}

interface BaseWeaponCreate {
	nom: string;
	prix_defaut: number;
	cout_production_defaut: number;
}

interface PaginatedWeaponsResponse {
	weapons: Weapon[];
	totalCount: number;
	page: number;
	pageSize: number;
}

export interface PaginatedBaseWeaponsResponse {
	baseWeapons: BaseWeapon[];
	totalCount: number;
	page: number;
	pageSize: number;
}

export const getUsers = async (): Promise<User[]> => {
	const response = await axiosInstance.get("/employees");
	return response.data;
};

export const getWeapons = async (
	page = 1,
	pageSize = 10,
): Promise<PaginatedWeaponsResponse> => {
	const response = await axiosInstance.get("/weapons", {
		params: {
			page,
			pageSize,
		},
	});

	return response.data;
};

export const createWeapon = async (weapon: WeaponCreate): Promise<Weapon> => {
	try {
		const response = await axiosInstance.post("/weapons", weapon);

		if (response.status !== 201 && response.status !== 200) {
			throw new Error(`Failed to create weapon: ${response.statusText}`);
		}

		return response.data;
	} catch (error: unknown) {
		if (axiosInstance.isAxiosError(error)) {
			const errorData = error.response?.data;

			if (error.response?.status === 409) {
				throw new Error(
					errorData?.error ||
						"Ce numéro de série est déjà utilisé par une autre arme",
				);
			}

			if (
				errorData?.code === "P2002" &&
				errorData?.meta?.target?.includes("serigraphie")
			) {
				throw new Error(
					"Ce numéro de série est déjà utilisé par une autre arme",
				);
			}

			if (
				error.response?.data?.error?.includes(
					"Unique constraint failed on the fields: (`serigraphie`)",
				) ||
				error.message?.includes(
					"Unique constraint failed on the fields: (`serigraphie`)",
				)
			) {
				throw new Error(
					"Ce numéro de série est déjà utilisé par une autre arme",
				);
			}

			if (error.response?.status === 400) {
				throw new Error("Données invalides pour la création de l'arme");
			}
			if (process.env.NODE_ENV !== "test") {
				console.error("Create weapon error:", {
					status: error.response?.status,
					statusText: error.response?.statusText,
					data: error.response?.data,
				});
			}
			throw new Error(
				`Erreur lors de la création: ${errorData?.error || error.message}`,
			);
		}
		throw error;
	}
};

export const updateWeapon = async (
	id: number,
	weapon: WeaponCreate,
): Promise<Weapon> => {
	const response = await axiosInstance.put(`/weapons/${id}`, weapon);
	return response.data;
};

export const getBaseWeapons = async (
	page = 1,
	pageSize = 50,
): Promise<PaginatedBaseWeaponsResponse> => {
	try {
		const response = await axiosInstance.get("/base-weapons", {
			params: {
				page,
				pageSize,
			},
			withCredentials: true,
		});

		return response.data;
	} catch (error: unknown) {
		if (axiosInstance.isAxiosError(error)) {
			if (process.env.NODE_ENV !== "test") {
				console.error("Error fetching base weapons:", {
					status: error.response?.status,
					statusText: error.response?.statusText,
					data: error.response?.data,
				});
			}
			throw new Error(
				`Failed to fetch base weapons: ${error.response?.data?.error || error.message}`,
			);
		}
		console.error("Error fetching base weapons:", error);
		throw error;
	}
};

export const createBaseWeapon = async (
	baseWeapon: BaseWeaponCreate,
): Promise<BaseWeapon> => {
	try {
		const response = await axiosInstance.post("/base-weapons", baseWeapon, {
			withCredentials: true,
		});

		if (response.status !== 201 && response.status !== 200) {
			throw new Error(`Failed to create base weapon: ${response.statusText}`);
		}

		return response.data;
	} catch (error: unknown) {
		if (axiosInstance.isAxiosError(error)) {
			if (error.response?.status === 401) {
				throw new Error("Failed to create base weapon: Unauthorized");
			}
			if (error.response?.status === 403) {
				throw new Error(
					"Vous n'avez pas les permissions nécessaires pour créer une arme de base",
				);
			}
			if (process.env.NODE_ENV !== "test") {
				console.error("Create base weapon error:", {
					status: error.response?.status,
					statusText: error.response?.statusText,
					data: error.response?.data,
				});
			}
			throw new Error(
				`Failed to create base weapon: ${error.response?.data?.error || error.message}`,
			);
		}
		throw error;
	}
};

export const updateBaseWeapon = async (
	id: number,
	baseWeapon: BaseWeaponCreate,
): Promise<BaseWeapon> => {
	try {
		const response = await axiosInstance.put(
			`/base-weapons/${id}`,
			baseWeapon,
			{
				withCredentials: true,
			},
		);

		if (response.status !== 200) {
			throw new Error(`Failed to update base weapon: ${response.statusText}`);
		}

		return response.data;
	} catch (error: unknown) {
		if (axiosInstance.isAxiosError(error)) {
			if (error.response?.status === 401) {
				throw new Error("Failed to update base weapon: Unauthorized");
			}
			if (error.response?.status === 403) {
				throw new Error(
					"Vous n'avez pas les permissions nécessaires pour modifier une arme de base",
				);
			}
			if (process.env.NODE_ENV !== "test") {
				console.error(`Error updating base weapon ${id}:`, {
					status: error.response?.status,
					statusText: error.response?.statusText,
					data: error.response?.data,
				});
			}
			throw new Error(
				`Failed to update base weapon: ${error.response?.data?.error || error.message}`,
			);
		}
		throw error;
	}
};

export interface OrderItem {
	id: number;
	orderId: number;
	baseWeaponId: number;
	quantity: number;
	pricePerItem: number;
	costPerItem: number;
	baseWeapon?: {
		id: number;
		nom: string;
		prix_defaut: number;
		cout_production_defaut: number;
	};
}

export interface Order {
	id: number;
	createdAt: string;
	userId: number;
	totalPrice: number;
	status: "PENDING" | "COMPLETED" | "CANCELLED";
	user?: {
		id: number;
		name: string;
		role: string;
	};
	items?: OrderItem[];
}

export interface OrdersResponse {
	orders: Order[];
	pagination: {
		totalCount: number;
		totalPages: number;
		currentPage: number;
		pageSize: number;
	};
}

export const getOrders = async (
	page = 1,
	pageSize = 10,
): Promise<OrdersResponse> => {
	try {
		const response = await fetch(
			`/api/orders?page=${page}&pageSize=${pageSize}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
			},
		);

		if (!response.ok) {
			throw new Error(`Failed to fetch orders: ${response.statusText}`);
		}

		return await response.json();
	} catch (error) {
		console.error("Error fetching orders:", error);
		throw error;
	}
};

export const createOrder = async (
	items: { baseWeaponId: number; quantity: number }[],
): Promise<Order> => {
	try {
		const response = await fetch("/api/orders", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify({ items }),
		});

		if (!response.ok) {
			throw new Error(`Failed to create order: ${response.statusText}`);
		}

		return await response.json();
	} catch (error) {
		console.error("Error creating order:", error);
		throw error;
	}
};

export const updateOrderStatus = async (
	orderId: number,
	status: "PENDING" | "COMPLETED" | "CANCELLED",
): Promise<Order> => {
	try {
		const response = await fetch(`/api/orders/${orderId}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify({ status }),
		});

		if (!response.ok) {
			throw new Error(`Failed to update order status: ${response.statusText}`);
		}

		return await response.json();
	} catch (error) {
		console.error(`Error updating order ${orderId}:`, error);
		throw error;
	}
};

export const deleteOrder = async (
	orderId: number,
): Promise<{ message: string }> => {
	try {
		const response = await fetch(`/api/orders/${orderId}`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
		});

		if (!response.ok) {
			throw new Error(`Failed to delete order: ${response.statusText}`);
		}

		return await response.json();
	} catch (error) {
		console.error(`Error deleting order ${orderId}:`, error);
		throw error;
	}
};
