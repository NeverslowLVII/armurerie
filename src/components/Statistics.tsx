import React, { useState, useEffect } from 'react';
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
    LockClosedIcon
} from '@heroicons/react/24/outline';
import { getCommissionRate } from '@/utils/roles';
import { Role } from '@/services/api';
import { LoginDialog } from './LoginDialog';
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';

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
    employe_id: number;
    employee: { name: string };
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

type TabType = 'overview' | 'weapons' | 'employees';

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
    { label: '7 derniers jours', days: 7 },
    { label: '30 derniers jours', days: 30 },
    { label: '3 derniers mois', days: 90 },
    { label: 'Cette année', days: 365 }
];

export default function Statistics() {
    const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
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
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [dateRange, setDateRange] = useState<DateRange>(() => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        return { startDate, endDate };
    });

    // Check authentication on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const patronAuth = localStorage.getItem('patronAuth');
            if (patronAuth === 'true') {
                setIsAuthenticated(true);
                fetchData();
            }
        }
    }, []);

    // Fetch data when date range changes and user is authenticated
    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [dateRange, isAuthenticated]);

    const handleLogin = async (password: string) => {
        setError(null);
        if (password === 'patron123') {
            setIsAuthenticated(true);
            if (typeof window !== 'undefined') {
                localStorage.setItem('patronAuth', 'true');
            }
            setIsLoginDialogOpen(false);
            await fetchData();
        } else {
            setError("Mot de passe incorrect.");
        }
    };

    const filterDataByDateRange = (data: Weapon[]) => {
        return data.filter(weapon => {
            const date = new Date(weapon.horodateur);
            return date >= dateRange.startDate && date <= dateRange.endDate;
        });
    };

    const fetchData = async () => {
        try {
            console.log('Starting data fetch...');
            setLoading(true);
            setError(null);
            
            const [weaponsData, employeesData] = await Promise.all([
                getWeapons(),
                getEmployees()
            ]);
            
            console.log('Data received:', { weaponsCount: weaponsData.length, employeesCount: employeesData.length });
            
            const filteredWeapons = filterDataByDateRange(weaponsData);
            console.log('Filtered weapons:', filteredWeapons.length);
            
            // Normaliser et calculer les statistiques des armes
            const weaponTypeMap = new Map<string, number>();
            const profitByTypeMap = new Map<string, { profit: number; count: number }>();
            let totalCostProduction = 0;

            filteredWeapons.forEach(weapon => {
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
            });

            const weaponTypes = Array.from(weaponTypeMap.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);

            const profitByType = Array.from(profitByTypeMap.entries())
                .map(([name, data]) => ({
                    name,
                    profit: data.profit,
                    count: data.count
                }))
                .sort((a, b) => b.profit - a.profit);

            // Calculer les statistiques quotidiennes
            const dailyStatsMap = new Map<string, { totalValue: number; totalCost: number; totalProfit: number; count: number }>();
            filteredWeapons.forEach(weapon => {
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
            });

            const dailyStats = Array.from(dailyStatsMap.entries())
                .map(([day, stats]) => ({
                    day,
                    ...stats
                }))
                .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());

            const totalValue = filteredWeapons.reduce((sum, w) => sum + w.prix, 0);
            const totalProfit = totalValue - totalCostProduction;
            const totalTaxes = Math.round(totalProfit * 0.10); // 10% d'impôts
            const profitAfterTaxes = totalProfit - totalTaxes;

            setWeaponStats({
                totalWeapons: filteredWeapons.length,
                totalValue,
                totalCostProduction,
                totalProfit,
                totalTaxes,
                profitAfterTaxes,
                averagePrice: totalValue / filteredWeapons.length || 0,
                averageCostProduction: totalCostProduction / filteredWeapons.length || 0,
                averageProfit: totalProfit / filteredWeapons.length || 0,
                profitMargin: totalValue > 0 ? (totalProfit / totalValue) * 100 : 0,
                weaponTypes,
                dailyStats,
                profitByType
            });

            // Calculer les statistiques des employés
            const employeeStats = employeesData.reduce<{
                employeePerformance: { name: string; count: number }[];
                employeeProfits: { name: string; profit: number; sales: number; commission: number; role: string }[];
            }>((acc, emp) => {
                const empWeapons = filteredWeapons.filter(w => w.employee.name === emp.name);
                
                const totalProfit = empWeapons.reduce((sum, weapon) => {
                    const productionCost = weapon.base_weapon?.cout_production_defaut || 0;
                    return sum + (weapon.prix - productionCost);
                }, 0);

                const commissionRate = getCommissionRate(emp.role);
                const commission = Math.round(totalProfit * commissionRate); // Commission calculée sur le bénéfice brut
                
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
                totalEmployees: employeesData.length,
                employeeWeaponCounts: {},
                employeeValueTotals: {},
                employeeProfits: employeeStats.employeeProfits.sort((a, b) => b.profit - a.profit),
                topEmployee: employeeStats.employeePerformance.reduce<{ name: string; count: number } | null>((max, emp) => 
                    !max || emp.count > max.count ? { name: emp.name, count: emp.count } : max
                , null),
                employeePerformance: employeeStats.employeePerformance.sort((a, b) => b.count - a.count)
            });

            console.log('Setting final stats:', { weaponStats, employeeStats });
            setLoading(false);
            setError(null);
        } catch (err) {
            console.error('Error fetching statistics:', err);
            setError('Erreur lors du chargement des statistiques');
            setLoading(false);
        }
    };

    const handlePresetClick = (days: number) => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        setDateRange({
            startDate,
            endDate
        });
    };

    const formatDateForInput = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center p-6 bg-white dark:bg-neutral-900 rounded-lg shadow">
                <LockClosedIcon className="w-12 h-12 text-neutral-400 dark:text-neutral-300 mb-4" />
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Accès Restreint</h2>
                <p className="text-neutral-600 dark:text-neutral-300 mb-4 text-center">
                    Cette section est réservée au patron.
                    <br />
                    Veuillez vous connecter pour accéder aux statistiques.
                </p>
                <Button
                    onClick={() => setIsLoginDialogOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-red-400"
                >
                    Se connecter
                </Button>
                <LoginDialog
                    isOpen={isLoginDialogOpen}
                    onClose={() => setIsLoginDialogOpen(false)}
                    onLogin={handleLogin}
                    error={error}
                />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
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
        <div className="px-2 sm:px-4">
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
                                    ${dateRange.startDate.getTime() === new Date(new Date().setDate(new Date().getDate() - preset.days)).getTime()
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

            <motion.div 
                className="mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <nav className="flex gap-2" role="tablist" aria-label="Sections des statistiques">
                    <button
                        role="tab"
                        aria-selected={activeTab === 'overview'}
                        aria-controls="overview-panel"
                        id="overview-tab"
                        onClick={() => setActiveTab('overview')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200 ${
                            activeTab === 'overview'
                                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm'
                                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-neutral-800 backdrop-blur-sm'
                        }`}
                    >
                        Vue d'ensemble
                    </button>
                    <button
                        role="tab"
                        aria-selected={activeTab === 'weapons'}
                        aria-controls="weapons-panel"
                        id="weapons-tab"
                        onClick={() => setActiveTab('weapons')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200 ${
                            activeTab === 'weapons'
                                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm'
                                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-neutral-800 backdrop-blur-sm'
                        }`}
                    >
                        Armes
                    </button>
                    <button
                        role="tab"
                        aria-selected={activeTab === 'employees'}
                        aria-controls="employees-panel"
                        id="employees-tab"
                        onClick={() => setActiveTab('employees')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200 ${
                            activeTab === 'employees'
                                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm'
                                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-neutral-800 backdrop-blur-sm'
                        }`}
                    >
                        Employés
                    </button>
                </nav>
            </motion.div>

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
                            title="Chiffre d'affaires total"
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
                                            name="Nombre d'armes"
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
                            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">Types d'armes vendues</h3>
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
                                            name="Nombre d'armes vendues"
                                            fill="url(#barGradient)"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
} 