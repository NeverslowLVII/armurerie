import type { Weapon as PrismaWeapon, BaseWeapon, User, Role } from '@prisma/client';
import type { ReactElement } from 'react';

// Types étendus basés sur Prisma pour les données reçues de l'API
export type WeaponWithRelations = PrismaWeapon & {
  user: Pick<User, 'name' | 'role' | 'commission'>;
  base_weapon?: Pick<BaseWeapon, 'nom' | 'prix_defaut' | 'cout_production_defaut'>;
  nom_arme?: string; // Champ supplémentaire fourni par l'API
};

// Type utilitaire pour traiter la structure des données JSON/API
export type ApiWeapon = Omit<WeaponWithRelations, 'horodateur'> & {
  horodateur: string; // La date est reçue comme string du frontend/JSON
};

// Type principal utilisé dans les composants statistiques
export type Weapon = ApiWeapon;

/**
 * Normalise les données d'arme pour qu'elles soient cohérentes
 * Garanti que cout_production utilise la valeur par défaut de base_weapon si non défini
 */
export function normalizeWeapon(weapon: Partial<Weapon>): Weapon {
  return {
    id: weapon.id || 0,
    horodateur: weapon.horodateur || new Date().toISOString(),
    user_id: weapon.user_id || 0,
    user: weapon.user || { name: 'Inconnu', role: 'EMPLOYEE' },
    detenteur: weapon.detenteur || '',
    bp: weapon.bp,
    nom_arme: weapon.nom_arme || (weapon.base_weapon?.nom || ''),
    serigraphie: weapon.serigraphie || '',
    prix: weapon.prix || 0,
    cout_production: weapon.cout_production ?? (weapon.base_weapon?.cout_production_defaut ?? 0),
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

export type TabType = 'overview' | 'weapons' | 'employees' | 'income';
