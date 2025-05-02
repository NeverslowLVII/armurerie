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

// Define BaseWeapon here, unexported, as it's used by the Weapon interface below
interface BaseWeapon {
  id: number;
  nom: string;
  prix_defaut: number;
  cout_production_defaut: number;
}

export interface Weapon {
  id: number;
  horodateur: string;
  user_id: number;
  user: {
    name: string;
    role: string;
    commission?: number;
  };
  detenteur: string;
  bp?: string;
  nom_arme: string;
  serigraphie: string;
  prix: number;
  base_weapon?: BaseWeapon;
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
