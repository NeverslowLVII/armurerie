import React, { useState, useEffect, useCallback } from 'react';
import { getWeapons, getEmployees } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import {
    ChartBarIcon,
    CurrencyDollarIcon,
    FireIcon,
    LockClosedIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import { getCommissionRate } from '@/utils/roles';
import { Role } from '@/services/api';
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { SkeletonLoading } from '@/components/ui/loading';
import { Skeleton } from '@/components/ui/skeleton';
import { useShouldDisplayLoading } from '../context/DataContext';

interface WeaponStats {
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
        count: number 
    }[];
    profitByType: { name: string; profit: number; count: number }[];
}

interface BaseWeapon {
    id: number;
    nom: string;
    prix_defaut: number;
    cout_production_defaut: number;
}

interface Weapon {
    id: number;
    horodateur: string;
    user_id: number;
    user: { name: string };
    detenteur: string;
    nom_arme: string;
    serigraphie: string;
    prix: number;
    base_weapon?: BaseWeapon;
}

interface EmployeeStats {
    totalEmployees: number;
    employeeWeaponCounts: { [key: string]: number };
    employeeValueTotals: { [key: string]: number };
    employeeProfits: { name: string; profit: number; sales: number; commission: number; role: string }[];
    topEmployee: { name: string; count: number } | null;
    employeePerformance: { name: string; count: number }[];
}

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
    subtitle?: string;
}

interface DateRange {
    startDate: Date;
    endDate: Date;
}

type TabType = 'overview' | 'weapons' | 'employees' | 'income';

const normalizeWeaponName = (name: string): string => {
    name = name.toLowerCase().trim();
    // Normaliser les noms d'armes communs
    const mapping: { [key: string]: string } = {
        'scofield': 'Scofield',
        'pompe': 'Fusil à Pompe',
        'verrou': 'Fusil à Verrou',
        'navy': 'Revolver Navy',
        'volcanic': 'Pistolet Volcanic',
        'henry': 'Carabine Henry',
        'winchester': 'Carabine Winchester',
        'cattleman': 'Revolver Cattleman',
        'rolling block': 'Fusil Rolling Block',
        'double action': 'Revolver Double Action'
    };
    
    for (const [key, value] of Object.entries(mapping)) {
        if (name.includes(key)) {
            return value;
        }
    }
    return name.charAt(0).toUpperCase() + name.slice(1);
};

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const chartVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
        opacity: 1, 
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 200,
            damping: 20
        }
    }
};

const StatCard = ({ title, value, icon: Icon }: StatCardProps) => (
    <motion.div
        variants={cardVariants}
        className="relative overflow-hidden bg-white dark:bg-neutral-800 backdrop-blur-xl rounded-lg p-3 shadow-lg border border-neutral-200 dark:border-neutral-700 hover:shadow-xl transition-shadow duration-300"
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
        <div className="relative flex items-center">
            <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-lg p-2 shadow-lg shadow-red-500/20">
                <Icon className="h-4 w-4 text-white" />
            </div>
            <div className="ml-3 flex-1 min-w-0">
                <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300 truncate">{title}</p>
                <p className="text-lg font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mt-0.5 truncate">
                    {value}
                </p>
            </div>
        </div>
    </motion.div>
);

const PERIOD_PRESETS = [
    { label: 'Cette semaine', days: 0 },
    { label: '7 derniers jours', days: 7 },
    { label: '30 derniers jours', days: 30 },
    { label: '3 derniers mois', days: 90 },
    { label: 'Cette année', days: 365 }
];

// Move this function outside the component
const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function Statistics() {
    const { data: session } = useSession();
    const shouldDisplayLoading = useShouldDisplayLoading();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [weaponStats, setWeaponStats] = useState<WeaponStats>({
        totalWeapons: 0,
        totalValue: 0,
        totalCostProduction: 0,
        totalProfit: 0,
        totalTaxes: 0,
        profitAfterTaxes: 0,
        averagePrice: 0,
        averageCostProduction: 0,
        averageProfit: 0,
        profitMargin: 0,
        weaponTypes: [],
        dailyStats: [],
        profitByType: []
    });
    const [employeeStats, setEmployeeStats] = useState<EmployeeStats>({
        totalEmployees: 0,
        employeeWeaponCounts: {},
        employeeValueTotals: {},
        employeeProfits: [],
        topEmployee: null,
        employeePerformance: []
    });
    const [filteredWeapons, setFilteredWeapons] = useState<Weapon[]>([]);
    const [employeesData, setEmployeesData] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [dateRange, setDateRange] = useState<DateRange>(() => {
        const endDate = new Date();
        const startDate = new Date();
        // Trouver le lundi de la semaine en cours
        const dayOfWeek = startDate.getDay(); // 0 = dimanche, 1 = lundi, etc.
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Ajustement pour commencer le lundi
        startDate.setDate(startDate.getDate() - diff);
        return { startDate, endDate };
    });

    const filterDataByDateRange = useCallback((data: Weapon[]) => {
        if (!dateRange) return data;
        
        const start = new Date(dateRange.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateRange.endDate);
        end.setHours(23, 59, 59, 999);
        
        return data.filter(weapon => {
            const date = new Date(weapon.horodateur);
            return date >= start && date <= end;
        });
    }, [dateRange]);

    const fetchData = useCallback(async () => {
        if (!session?.user) return;
        
        try {
            setLoading(true);
            setError(null);
            
            const [weaponsData, employees] = await Promise.all([
                getWeapons(),
                getEmployees()
            ]);
            
            const filtered = filterDataByDateRange(weaponsData);
            setFilteredWeapons(filtered);
            setEmployeesData(employees);
            
            // Normaliser et calculer les statistiques des armes
            const weaponTypeMap = new Map<string, number>();
            const profitByTypeMap = new Map<string, { profit: number; count: number }>();
            let totalCostProduction = 0;

            for (const weapon of filtered) {
                const normalizedName = normalizeWeaponName(weapon.nom_arme);
                weaponTypeMap.set(normalizedName, (weaponTypeMap.get(normalizedName) || 0) + 1);
                
                const productionCost = weapon.base_weapon?.cout_production_defaut || 0;
                const profit = weapon.prix - productionCost;
                const currentProfit = profitByTypeMap.get(normalizedName) || { profit: 0, count: 0 };
                profitByTypeMap.set(normalizedName, {
                    profit: currentProfit.profit + profit,
                    count: currentProfit.count + 1
                });
                
                totalCostProduction += productionCost;
            }

            const weaponTypes = [...weaponTypeMap.entries()]
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);

            const profitByType = [...profitByTypeMap.entries()]
                .map(([name, data]) => ({
                    name,
                    profit: data.profit,
                    count: data.count
                }))
                .sort((a, b) => b.profit - a.profit);

            // Calculer les statistiques quotidiennes
            const dailyStatsMap = new Map<string, { totalValue: number; totalCost: number; totalProfit: number; count: number }>();
            
            for (const weapon of filtered) {
                const date = new Date(weapon.horodateur);
                const day = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
                const existing = dailyStatsMap.get(day) || { totalValue: 0, totalCost: 0, totalProfit: 0, count: 0 };
                const productionCost = weapon.base_weapon?.cout_production_defaut || 0;
                const profit = weapon.prix - productionCost;
                dailyStatsMap.set(day, {
                    totalValue: existing.totalValue + weapon.prix,
                    totalCost: existing.totalCost + productionCost,
                    totalProfit: existing.totalProfit + profit,
                    count: existing.count + 1
                });
            }

            const dailyStats = [...dailyStatsMap.entries()]
                .map(([day, stats]) => ({
                    day,
                    ...stats
                }))
                .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());

            const totalValue = filtered.reduce((sum, w) => sum + w.prix, 0);
            const totalProfit = totalValue - totalCostProduction;
            const totalTaxes = Math.round(totalProfit * 0.1); // 10% d'impôts
            const profitAfterTaxes = totalProfit - totalTaxes;

            setWeaponStats({
                totalWeapons: filtered.length,
                totalValue,
                totalCostProduction,
                totalProfit,
                totalTaxes,
                profitAfterTaxes,
                averagePrice: totalValue / filtered.length || 0,
                averageCostProduction: totalCostProduction / filtered.length || 0,
                averageProfit: totalProfit / filtered.length || 0,
                profitMargin: totalValue > 0 ? (totalProfit / totalValue) * 100 : 0,
                weaponTypes,
                dailyStats,
                profitByType
            });

            // Calculer les statistiques des employés
            const employeeStats = employees.reduce<{
                employeePerformance: { name: string; count: number }[];
                employeeProfits: { name: string; profit: number; sales: number; commission: number; role: string }[];
            }>((acc, emp) => {
                const empWeapons = filtered.filter(w => w.user.name === emp.name);
                
                const totalProfit = empWeapons.reduce((sum, weapon) => {
                    const productionCost = weapon.base_weapon?.cout_production_defaut || 0;
                    return sum + (weapon.prix - productionCost);
                }, 0);

                const commissionRate = getCommissionRate(emp.role);
                const commission = Math.round(totalProfit * commissionRate);
                
                acc.employeePerformance.push({
                    name: emp.name,
                    count: empWeapons.length
                });

                acc.employeeProfits.push({
                    name: emp.name,
                    profit: totalProfit,
                    sales: empWeapons.length,
                    commission: commission,
                    role: emp.role
                });
                
                return acc;
            }, {
                employeePerformance: [],
                employeeProfits: []
            });

            setEmployeeStats({
                totalEmployees: employees.length,
                employeeWeaponCounts: {},
                employeeValueTotals: {},
                employeeProfits: employeeStats.employeeProfits.sort((a, b) => b.profit - a.profit),
                topEmployee: employeeStats.employeePerformance.reduce<{ name: string; count: number } | null>((max, emp) => 
                    !max || emp.count > max.count ? { name: emp.name, count: emp.count } : max
                , null),
                employeePerformance: employeeStats.employeePerformance.sort((a, b) => b.count - a.count)
            });

            console.log('Setting final stats:', { weaponStats, employeeStats });
        } catch (error) {
            console.error('Error fetching statistics:', error);
            setError('Erreur lors du chargement des statistiques');
        } finally {
            setLoading(false);
        }
    }, [session?.user, filterDataByDateRange]);

    useEffect(() => {
        if (!session?.user) return;
        if (session.user.role !== Role.PATRON && 
            session.user.role !== Role.CO_PATRON && 
            session.user.role !== Role.DEVELOPER) return;
        
        fetchData();
    }, [session?.user, fetchData]);

    const handlePresetClick = (days: number) => {
        const endDate = new Date();
        const startDate = new Date();
        
        if (days === 0) {
            // Pour "Cette semaine", on commence au lundi de la semaine en cours
            const dayOfWeek = startDate.getDay(); // 0 = dimanche, 1 = lundi, etc.
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Ajustement pour commencer le lundi
            startDate.setDate(startDate.getDate() - diff);
        } else {
            // Pour les autres presets, on recule de X jours
            startDate.setDate(startDate.getDate() - days);
        }
        
        setDateRange({
            startDate,
            endDate
        });
    };

    const isActivePeriod = (days: number) => {
        const startDate = new Date();
        
        if (days === 0) {
            // Pour "Cette semaine", on commence au lundi de la semaine en cours
            const dayOfWeek = startDate.getDay(); // 0 = dimanche, 1 = lundi, etc.
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Ajustement pour commencer le lundi
            startDate.setDate(startDate.getDate() - diff);
        } else {
            // Pour les autres presets, on recule de X jours
            startDate.setDate(startDate.getDate() - days);
        }
        
        return dateRange.startDate.getTime() === startDate.getTime();
    };

    // Calculer des données du compte de résultat par période (jour, semaine, mois)
    const calculateIncomeStatementData = useCallback(() => {
        if (!filteredWeapons || filteredWeapons.length === 0) return [];
        
        // Créer un map par période
        const periodMap = new Map<string, {
            revenue: number;
            productionCost: number;
            commissions: number;
            grossProfit: number;
            taxes: number;
            netProfit: number;
            count: number;
        }>();
        
        // Définir la période en fonction de la plage de dates
        const diffDays = Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24));
        let periodFormat: 'day' | 'week' | 'month' = 'day';
        
        if (diffDays > 90) {
            periodFormat = 'month';
        } else if (diffDays > 30) {
            periodFormat = 'week';
        }
        
        // Calculer les statistiques par période
        for (const weapon of filteredWeapons) {
            const date = new Date(weapon.horodateur);
            let periodKey: string;
            
            if (periodFormat === 'day') {
                periodKey = formatDateForInput(date);
            } else if (periodFormat === 'week') {
                // Trouver le lundi de la semaine
                const dayOfWeek = date.getDay();
                const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                const monday = new Date(date);
                monday.setDate(date.getDate() - diff);
                periodKey = `Semaine du ${formatDateForInput(monday)}`;
            } else {
                periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }
            
            const price = weapon.prix || 0;
            const productionCost = weapon.base_weapon?.cout_production_defaut || 0;
            const grossProfit = price - productionCost;
            
            // Trouver l'employé et calculer sa commission
            const employee = employeesData.find(emp => emp.id === weapon.user_id);
            const commissionRate = employee ? getCommissionRate(employee.role as Role) : 0;
            const commission = grossProfit * commissionRate;
            
            // Calculer les taxes (10% du bénéfice brut)
            const taxes = grossProfit * 0.1;
            
            // Bénéfice net
            const netProfit = grossProfit - commission - taxes;
            
            if (periodMap.has(periodKey)) {
                const current = periodMap.get(periodKey)!;
                periodMap.set(periodKey, {
                    revenue: current.revenue + price,
                    productionCost: current.productionCost + productionCost,
                    commissions: current.commissions + commission,
                    grossProfit: current.grossProfit + grossProfit,
                    taxes: current.taxes + taxes,
                    netProfit: current.netProfit + netProfit,
                    count: current.count + 1
                });
            } else {
                periodMap.set(periodKey, {
                    revenue: price,
                    productionCost: productionCost,
                    commissions: commission,
                    grossProfit: grossProfit,
                    taxes: taxes,
                    netProfit: netProfit,
                    count: 1
                });
            }
        }
        
        // Convertir Map en tableau pour les graphiques
        return [...periodMap.entries()]
            .map(([period, data]) => ({
                period,
                ...data
            }))
            .sort((a, b) => {
                // Trier par période
                return a.period.localeCompare(b.period);
            });
            
    }, [filteredWeapons, dateRange, employeesData]);

    // Données du compte de résultat
    const incomeStatementData = calculateIncomeStatementData();
    
    // Calcul des totaux pour le compte de résultat
    const incomeStatementTotals = incomeStatementData.reduce((acc, item) => {
        return {
            revenue: acc.revenue + item.revenue,
            productionCost: acc.productionCost + item.productionCost,
            commissions: acc.commissions + item.commissions,
            grossProfit: acc.grossProfit + item.grossProfit,
            taxes: acc.taxes + item.taxes,
            netProfit: acc.netProfit + item.netProfit,
            count: acc.count + item.count
        };
    }, {
        revenue: 0,
        productionCost: 0,
        commissions: 0,
        grossProfit: 0,
        taxes: 0,
        netProfit: 0,
        count: 0
    });

    // Fonction pour formater les montants en dollars
    const formatDollars = (amount: number) => {
        // Conversion des centimes en dollars (division par 100)
        const dollars = amount / 100;
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(dollars);
    };

    if (!session || (session.user.role !== Role.PATRON && 
        session.user.role !== Role.CO_PATRON && 
        session.user.role !== Role.DEVELOPER)) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center p-6 bg-white dark:bg-neutral-900 rounded-lg shadow">
                <LockClosedIcon className="w-12 h-12 text-neutral-400 dark:text-neutral-300 mb-4" />
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Accès Restreint</h2>
                <p className="text-neutral-600 dark:text-neutral-300 mb-4 text-center">
                    Cette section est réservée au patron et aux développeurs.
                </p>
            </div>
        );
    }

    if (loading && shouldDisplayLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <SkeletonLoading isLoading={true} className="space-y-6">
                    {/* Header skeleton */}
                    <div className="sm:flex sm:items-center mb-4">
                        <div className="sm:flex-auto">
                            <Skeleton className="h-8 w-40 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <div className="mt-3 sm:mt-0 sm:ml-4">
                            <div className="flex flex-wrap gap-2 mb-2">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Skeleton key={i} className="h-8 w-24" />
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-10 w-32" />
                                <Skeleton className="h-10 w-32" />
                            </div>
                        </div>
                    </div>
                    
                    {/* Tabs skeleton */}
                    <div className="mb-4">
                        <div className="flex gap-2">
                            <Skeleton className="h-10 w-32" />
                            <Skeleton className="h-10 w-32" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </div>
                    
                    {/* Stats cards skeleton */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-lg" />
                        ))}
                    </div>
                    
                    {/* Charts skeleton */}
                    <Skeleton className="h-80 w-full rounded-xl" />
                    <Skeleton className="h-80 w-full rounded-xl" />
                </SkeletonLoading>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <motion.div 
                className="sm:flex sm:items-center mb-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="sm:flex-auto">
                    <h1 className="text-xl font-semibold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                        Statistiques
                    </h1>
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                        Analyse détaillée du registre des armes
                    </p>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-4">
                    <div className="flex flex-wrap gap-2 mb-2">
                        {PERIOD_PRESETS.map(preset => (
                            <Button
                                key={preset.days}
                                onClick={() => handlePresetClick(preset.days)}
                                className={`px-2 py-1 rounded text-xs font-medium transition-colors duration-200
                                    ${isActivePeriod(preset.days)
                                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm'
                                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-neutral-800 backdrop-blur-sm'}`}
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <div>
                            <label htmlFor="start-date" className="sr-only">Date de début</label>
                            <Input
                                id="start-date"
                                type="date"
                                value={formatDateForInput(dateRange.startDate)}
                                onChange={(e) => setDateRange(prev => ({
                                    ...prev,
                                    startDate: new Date(e.target.value)
                                }))}
                                className="px-2 py-1 text-sm border border-neutral-200 dark:border-neutral-700 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white dark:focus:ring-red-400 dark:focus:border-red-400"
                                aria-label="Date de début"
                            />
                        </div>
                        <div>
                            <label htmlFor="end-date" className="sr-only">Date de fin</label>
                            <Input
                                id="end-date"
                                type="date"
                                value={formatDateForInput(dateRange.endDate)}
                                onChange={(e) => setDateRange(prev => ({
                                    ...prev,
                                    endDate: new Date(e.target.value)
                                }))}
                                className="px-2 py-1 text-sm border border-neutral-200 dark:border-neutral-700 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white dark:focus:ring-red-400 dark:focus:border-red-400"
                                aria-label="Date de fin"
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="border-b border-neutral-200 dark:border-neutral-700">
                <nav className="flex space-x-4 overflow-x-auto hide-scrollbar">
                    <button
                        className={`py-2 px-1 inline-flex items-center gap-1 border-b-2 text-sm font-medium transition-colors ${activeTab === 'overview'
                            ? 'border-red-500 text-red-500'
                            : 'border-transparent text-neutral-600 dark:text-neutral-300 hover:text-red-500 hover:border-red-300'
                            }`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <ChartBarIcon className="h-4 w-4" />
                        Vue d&apos;ensemble
                    </button>
                    <button
                        className={`py-2 px-1 inline-flex items-center gap-1 border-b-2 text-sm font-medium transition-colors ${activeTab === 'weapons'
                            ? 'border-red-500 text-red-500'
                            : 'border-transparent text-neutral-600 dark:text-neutral-300 hover:text-red-500 hover:border-red-300'
                            }`}
                        onClick={() => setActiveTab('weapons')}
                    >
                        <FireIcon className="h-4 w-4" />
                        Armes
                    </button>
                    <button
                        className={`py-2 px-1 inline-flex items-center gap-1 border-b-2 text-sm font-medium transition-colors ${activeTab === 'employees'
                            ? 'border-red-500 text-red-500'
                            : 'border-transparent text-neutral-600 dark:text-neutral-300 hover:text-red-500 hover:border-red-300'
                            }`}
                        onClick={() => setActiveTab('employees')}
                    >
                        <LockClosedIcon className="h-4 w-4" />
                        Employés
                    </button>
                    <button
                        className={`py-2 px-1 inline-flex items-center gap-1 border-b-2 text-sm font-medium transition-colors ${activeTab === 'income'
                            ? 'border-red-500 text-red-500'
                            : 'border-transparent text-neutral-600 dark:text-neutral-300 hover:text-red-500 hover:border-red-300'
                            }`}
                        onClick={() => setActiveTab('income')}
                    >
                        <DocumentTextIcon className="h-4 w-4" />
                        Compte de résultat
                    </button>
                </nav>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
                        role="tabpanel"
                        aria-labelledby="overview-tab"
                        id="overview-panel"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.1
                                }
                            }
                        }}
                        className="grid grid-cols-2 lg:grid-cols-5 gap-3"
                    >
                        <StatCard
                            title="Chiffre d&apos;affaires total"
                            value={new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(weaponStats.totalValue / 100)}
                            icon={CurrencyDollarIcon}
                        />
                        <StatCard
                            title="Coût de production total"
                            value={new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(weaponStats.totalCostProduction / 100)}
                            icon={FireIcon}
                        />
                        <StatCard
                            title="Bénéfice brut"
                            value={new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(weaponStats.totalProfit / 100)}
                            icon={CurrencyDollarIcon}
                        />
                        <StatCard
                            title="Impôts (10%)"
                            value={new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(weaponStats.totalTaxes / 100)}
                            icon={CurrencyDollarIcon}
                            subtitle="10% du bénéfice brut"
                        />
                        <StatCard
                            title="Bénéfice après impôts"
                            value={new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(weaponStats.profitAfterTaxes / 100)}
                            icon={CurrencyDollarIcon}
                        />
                        <StatCard
                            title="Marge bénéficiaire"
                            value={`${weaponStats.profitMargin.toFixed(1)}%`}
                            icon={ChartBarIcon}
                        />
                    </motion.div>
                )}

                {activeTab === 'weapons' && (
                    <motion.div
                        key="weapons"
                        role="tabpanel"
                        aria-labelledby="weapons-tab"
                        id="weapons-panel"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.2
                                }
                            }
                        }}
                        className="space-y-6"
                    >
                        {/* Daily Trends */}
                        <motion.div 
                            variants={chartVariants}
                            className="bg-white dark:bg-neutral-800 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700"
                        >
                            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">Ventes quotidiennes</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={weaponStats.dailyStats}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" className="dark:stroke-neutral-600" />
                                        <XAxis dataKey="day" stroke="#4b5563" className="dark:text-neutral-300" />
                                        <YAxis stroke="#4b5563" className="dark:text-neutral-300" />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'var(--tooltip-bg, rgba(255, 255, 255, 0.8))',
                                                backdropFilter: 'blur(8px)',
                                                borderRadius: '8px',
                                                border: 'var(--tooltip-border, 1px solid #d1d5db)',
                                                color: 'var(--tooltip-color, #1f2937)',
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="count"
                                            name="Nombre d&apos;armes"
                                            stroke="#ef4444"
                                            fillOpacity={1}
                                            fill="url(#colorCount)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Weapon Types Distribution */}
                        <motion.div 
                            variants={chartVariants}
                            className="bg-white dark:bg-neutral-800 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700"
                        >
                            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">Types d&apos;armes vendues</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={weaponStats.weaponTypes}
                                            dataKey="count"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label
                                        >
                                            {weaponStats.weaponTypes.map((_, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={index < 3 
                                                        ? `hsl(${0 + (index * 16)}, 85%, 55%)` 
                                                        : `hsl(${90 + (index * 12)}, 60%, ${65 - (index * 2)}%)`} 
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'var(--tooltip-bg, rgba(255, 255, 255, 0.8))',
                                                backdropFilter: 'blur(8px)',
                                                borderRadius: '8px',
                                                border: 'var(--tooltip-border, 1px solid #d1d5db)',
                                                color: 'var(--tooltip-color, #1f2937)',
                                            }}
                                        />
                                        <Legend className="dark:text-neutral-300" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {activeTab === 'employees' && (
                    <motion.div
                        key="employees"
                        role="tabpanel"
                        aria-labelledby="employees-tab"
                        id="employees-panel"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.2
                                }
                            }
                        }}
                        className="space-y-6"
                    >
                        {/* Employee Profits Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {employeeStats.employeeProfits.map(employee => (
                                <motion.div
                                    key={employee.name}
                                    variants={cardVariants}
                                    className="bg-white dark:bg-neutral-800 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700"
                                >
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg font-medium text-neutral-900 dark:text-white">{employee.name}</h3>
                                            <span className="text-sm text-neutral-600 dark:text-neutral-400">{employee.sales} ventes</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-neutral-600 dark:text-neutral-400">Bénéfice</span>
                                                <span className="font-bold text-lg bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                                                    {new Intl.NumberFormat('fr-FR', { 
                                                        style: 'currency', 
                                                        currency: 'USD' 
                                                    }).format(employee.profit / 100)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-neutral-600 dark:text-neutral-400">Commission ({getCommissionRate(employee.role as Role) * 100}%)</span>
                                                <span className="font-bold text-lg text-green-500 dark:text-green-400">
                                                    {new Intl.NumberFormat('fr-FR', { 
                                                        style: 'currency', 
                                                        currency: 'USD' 
                                                    }).format(employee.commission / 100)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Employee Performance */}
                        <motion.div 
                            variants={chartVariants}
                            className="bg-white dark:bg-neutral-800 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700"
                        >
                            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">Ventes par employé</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={employeeStats.employeePerformance}>
                                        <defs>
                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#EF4444" />
                                                <stop offset="100%" stopColor="#F97316" />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-neutral-600" />
                                        <XAxis dataKey="name" stroke="#6B7280" className="dark:text-neutral-300" />
                                        <YAxis stroke="#6B7280" className="dark:text-neutral-300" />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'var(--tooltip-bg, rgba(255, 255, 255, 0.8))',
                                                backdropFilter: 'blur(8px)',
                                                borderRadius: '8px',
                                                border: 'var(--tooltip-border, 1px solid #E5E7EB)',
                                                color: 'var(--tooltip-color, #1f2937)'
                                            }}
                                        />
                                        <Legend className="dark:text-neutral-300" />
                                        <Bar
                                            dataKey="count"
                                            name="Nombre d&apos;armes vendues"
                                            fill="url(#barGradient)"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {activeTab === 'income' && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={chartVariants}
                        className="space-y-8"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatCard 
                                title="Revenus totaux" 
                                value={formatDollars(incomeStatementTotals.revenue)} 
                                icon={CurrencyDollarIcon} 
                            />
                            <StatCard 
                                title="Bénéfice brut" 
                                value={formatDollars(incomeStatementTotals.grossProfit)} 
                                icon={CurrencyDollarIcon} 
                            />
                            <StatCard 
                                title="Bénéfice net" 
                                value={formatDollars(incomeStatementTotals.netProfit)} 
                                icon={CurrencyDollarIcon} 
                            />
                        </div>

                        {/* Compte de résultat détaillé */}
                        <div className="bg-white dark:bg-neutral-800 rounded-lg overflow-hidden shadow">
                            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                    Compte de résultat détaillé
                                </h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    Période du {formatDateForInput(dateRange.startDate)} au {formatDateForInput(dateRange.endDate)}
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                                    <thead className="bg-neutral-50 dark:bg-neutral-900">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                                Élément
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                                Montant
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                                % du revenu
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                                        <tr>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-white">
                                                Chiffre d&apos;affaires
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-900 dark:text-white">
                                                {formatDollars(incomeStatementTotals.revenue)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-900 dark:text-white">
                                                100%
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-500 dark:text-neutral-400 pl-10">
                                                Coût de production
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-500">
                                                -{formatDollars(incomeStatementTotals.productionCost)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-500 dark:text-neutral-400">
                                                {incomeStatementTotals.revenue > 0 
                                                    ? `${(incomeStatementTotals.productionCost / incomeStatementTotals.revenue * 100).toFixed(1)}%` 
                                                    : "0%"}
                                            </td>
                                        </tr>
                                        <tr className="bg-neutral-50 dark:bg-neutral-900">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-neutral-900 dark:text-white">
                                                Marge brute
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right text-neutral-900 dark:text-white">
                                                {formatDollars(incomeStatementTotals.revenue - incomeStatementTotals.productionCost)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right text-neutral-900 dark:text-white">
                                                {incomeStatementTotals.revenue > 0 
                                                    ? `${((incomeStatementTotals.revenue - incomeStatementTotals.productionCost) / incomeStatementTotals.revenue * 100).toFixed(1)}%` 
                                                    : "0%"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-500 dark:text-neutral-400 pl-10">
                                                Charges du personnel
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-500">
                                                -{formatDollars(incomeStatementTotals.commissions)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-500 dark:text-neutral-400">
                                                {incomeStatementTotals.revenue > 0 
                                                    ? `${(incomeStatementTotals.commissions / incomeStatementTotals.revenue * 100).toFixed(1)}%` 
                                                    : "0%"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-neutral-900 dark:text-white">
                                                Bénéfice d&apos;exploitation
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right text-neutral-900 dark:text-white">
                                                {formatDollars(incomeStatementTotals.grossProfit)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right text-neutral-900 dark:text-white">
                                                {incomeStatementTotals.revenue > 0 
                                                    ? `${(incomeStatementTotals.grossProfit / incomeStatementTotals.revenue * 100).toFixed(1)}%` 
                                                    : "0%"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-500 dark:text-neutral-400 pl-10">
                                                Taxes (10%)
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-500">
                                                -{formatDollars(incomeStatementTotals.taxes)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-500 dark:text-neutral-400">
                                                {incomeStatementTotals.revenue > 0 
                                                    ? `${(incomeStatementTotals.taxes / incomeStatementTotals.revenue * 100).toFixed(1)}%` 
                                                    : "0%"}
                                            </td>
                                        </tr>
                                        <tr className="bg-neutral-50 dark:bg-neutral-900">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-neutral-900 dark:text-white">
                                                Résultat net
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-neutral-900 dark:text-white">
                                                {formatDollars(incomeStatementTotals.netProfit)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-neutral-900 dark:text-white">
                                                {incomeStatementTotals.revenue > 0 
                                                    ? `${(incomeStatementTotals.netProfit / incomeStatementTotals.revenue * 100).toFixed(1)}%` 
                                                    : "0%"}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Graphique d'évolution */}
                        <div className="bg-white dark:bg-neutral-800 rounded-lg overflow-hidden shadow p-6">
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                                Évolution du compte de résultat
                            </h3>
                            <div className="h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={incomeStatementData}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis 
                                            dataKey="period" 
                                            angle={-45} 
                                            textAnchor="end"
                                            height={70}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis />
                                        <Tooltip 
                                            formatter={(value: number) => formatDollars(value)}
                                            labelFormatter={(label) => `Période: ${label}`}
                                        />
                                        <Legend />
                                        <Bar dataKey="revenue" name="Chiffre d&apos;affaires" fill="#60a5fa" />
                                        <Bar dataKey="grossProfit" name="Bénéfice brut" fill="#34d399" />
                                        <Bar dataKey="netProfit" name="Résultat net" fill="#f87171" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Graphique de répartition */}
                        <div className="bg-white dark:bg-neutral-800 rounded-lg overflow-hidden shadow p-6">
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                                Répartition des coûts
                            </h3>
                            <div className="h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Coût de production', value: incomeStatementTotals.productionCost },
                                                { name: 'Charges du personnel', value: incomeStatementTotals.commissions },
                                                { name: 'Taxes', value: incomeStatementTotals.taxes },
                                                { name: 'Bénéfice net', value: incomeStatementTotals.netProfit }
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={120}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, percent }) => 
                                                `${name} : ${(percent * 100).toFixed(0)}%`
                                            }
                                        >
                                            <Cell fill="#ef4444" />
                                            <Cell fill="#f97316" />
                                            <Cell fill="#eab308" />
                                            <Cell fill="#10b981" />
                                        </Pie>
                                        <Tooltip formatter={(value: number) => formatDollars(value)} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
} 