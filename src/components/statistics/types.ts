import type { BaseWeapon, Weapon as PrismaWeapon, User } from "@prisma/client";

export type Weapon = Omit<
	PrismaWeapon & {
		user: Pick<User, "name" | "role" | "commission">;
		base_weapon?: Pick<
			BaseWeapon,
			"nom" | "prix_defaut" | "cout_production_defaut"
		>;
		nom_arme?: string;
	},
	"horodateur"
> & {
	horodateur: string;
};

export function normalizeWeapon(weapon: Partial<Weapon>): Weapon {
	return {
		id: weapon.id || 0,
		horodateur: weapon.horodateur || new Date().toISOString(),
		user_id: weapon.user_id || 0,
		user: weapon.user || { name: "Inconnu", role: "EMPLOYEE" },
		detenteur: weapon.detenteur || "",
		bp: weapon.bp,
		nom_arme: weapon.nom_arme || weapon.base_weapon?.nom || "",
		serigraphie: weapon.serigraphie || "",
		prix: weapon.prix || 0,
		cout_production:
			weapon.cout_production ?? weapon.base_weapon?.cout_production_defaut ?? 0,
		base_weapon: weapon.base_weapon,
	} as Weapon;
}

// Interfaces pour les statistiques
export interface WeaponStats {
	totalWeapons: number;
	totalValue: number;
	totalCostProduction: number;
	totalProfit: number;
	totalTaxes: number;
	profitAfterTaxes: number;
	averagePrice: number;
	averageCostProduction: number;
	averageProfit: number;
	profitMargin: number;
	weaponTypes: { name: string; count: number }[];
	dailyStats: {
		day: string;
		totalValue: number;
		totalCost: number;
		totalProfit: number;
		count: number;
	}[];
	profitByType: { name: string; profit: number; count: number }[];
}

export interface EmployeeStats {
	totalEmployees: number;
	employeeWeaponCounts: { [key: string]: number };
	employeeValueTotals: { [key: string]: number };
	employeeProfits: {
		name: string;
		profit: number;
		sales: number;
		commission: number;
		role: string;
		commissionRate: number;
	}[];
	topEmployee: { name: string; count: number } | null;
	employeePerformance: { name: string; count: number }[];
}

export interface StatCardProps {
	title: string;
	value: string | number;
	icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
	subtitle?: string;
}

export interface DateRange {
	startDate: Date;
	endDate: Date;
}

export type TabType = "overview" | "weapons" | "employees" | "income";
