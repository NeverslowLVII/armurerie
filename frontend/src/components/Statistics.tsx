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
    FireIcon
} from '@heroicons/react/24/outline';

interface WeaponStats {
    totalWeapons: number;
    totalValue: number;
    totalCostProduction: number;
    totalProfit: number;
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
    policeWeapons: number;
    civilianWeapons: number;
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

interface Employee {
    id: number;
    name: string;
    color?: string;
    role: string;
}

interface EmployeeStats {
    totalEmployees: number;
    employeeWeaponCounts: { [key: string]: number };
    employeeValueTotals: { [key: string]: number };
    employeeProfits: { name: string; profit: number; sales: number; commission: number; role: string }[];
    topEmployee: { name: string; count: number } | null;
    employeePerformance: { name: string; count: number }[];
    employeeSpecialties: { name: string; policeCount: number; civilianCount: number }[];
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

const isPoliceWeapon = (detenteur: string): boolean => {
    const policeTerms = ['police', 'sherif', 'sheriff', 'rhodes', 'cabinet'];
    return policeTerms.some(term => detenteur.toLowerCase().includes(term));
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
        className="relative overflow-hidden bg-white/90 backdrop-blur-xl rounded-lg p-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100/50 hover:shadow-[0_8px_40px_rgb(99,102,241,0.12)] transition-shadow duration-300"
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
        <div className="relative flex items-center">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg p-2 shadow-lg shadow-indigo-600/20">
                <Icon className="h-4 w-4 text-white" />
            </div>
            <div className="ml-3 flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 truncate">{title}</p>
                <p className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mt-0.5 truncate">
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

const getCommissionRate = (role: string): number => {
    switch (role.toUpperCase()) {
        case 'PATRON':
        case 'CO_PATRON':
            return 0.3;
        default:
            return 0.2;
    }
};

export default function Statistics() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [weaponStats, setWeaponStats] = useState<WeaponStats>({
        totalWeapons: 0,
        totalValue: 0,
        totalCostProduction: 0,
        totalProfit: 0,
        averagePrice: 0,
        averageCostProduction: 0,
        averageProfit: 0,
        profitMargin: 0,
        weaponTypes: [],
        dailyStats: [],
        policeWeapons: 0,
        civilianWeapons: 0,
        profitByType: []
    });
    const [employeeStats, setEmployeeStats] = useState<EmployeeStats>({
        totalEmployees: 0,
        employeeWeaponCounts: {},
        employeeValueTotals: {},
        employeeProfits: [],
        topEmployee: null,
        employeePerformance: [],
        employeeSpecialties: []
    });
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        endDate: new Date()
    });

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const filterDataByDateRange = (data: Weapon[]) => {
        return data.filter(weapon => {
            const date = new Date(weapon.horodateur);
            return date >= dateRange.startDate && date <= dateRange.endDate;
        });
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [weapons, employees] = await Promise.all([getWeapons(), getEmployees()]) as [Weapon[], Employee[]];
            
            const filteredWeapons = filterDataByDateRange(weapons);
            
            // Normaliser et calculer les statistiques des armes
            const weaponTypeMap = new Map<string, number>();
            const profitByTypeMap = new Map<string, { profit: number; count: number }>();
            let totalCostProduction = 0;
            let policeWeapons = 0;
            let civilianWeapons = 0;

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
                
                if (isPoliceWeapon(weapon.detenteur)) {
                    policeWeapons++;
                } else {
                    civilianWeapons++;
                }
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

            setWeaponStats({
                totalWeapons: filteredWeapons.length,
                totalValue,
                totalCostProduction,
                totalProfit,
                averagePrice: totalValue / filteredWeapons.length,
                averageCostProduction: totalCostProduction / filteredWeapons.length,
                averageProfit: totalProfit / filteredWeapons.length,
                profitMargin: (totalProfit / totalValue) * 100,
                weaponTypes,
                dailyStats,
                policeWeapons,
                civilianWeapons,
                profitByType
            });

            // Calculer les statistiques des employés
            const employeeStats = employees.reduce((acc: { 
                employeeSpecialties: { name: string; policeCount: number; civilianCount: number }[];
                employeePerformance: { name: string; count: number }[];
                employeeProfits: { name: string; profit: number; sales: number; commission: number; role: string }[];
            }, emp: Employee) => {
                const empWeapons = filteredWeapons.filter(w => w.employee.name === emp.name);
                const policeCount = empWeapons.filter(w => isPoliceWeapon(w.detenteur)).length;
                const civilianCount = empWeapons.length - policeCount;
                
                const totalProfit = empWeapons.reduce((sum, weapon) => {
                    const productionCost = weapon.base_weapon?.cout_production_defaut || 0;
                    return sum + (weapon.prix - productionCost);
                }, 0);

                const commissionRate = getCommissionRate(emp.role);
                const commission = totalProfit * commissionRate;
                
                acc.employeeSpecialties.push({
                    name: emp.name,
                    policeCount,
                    civilianCount
                });
                
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
                employeeSpecialties: [],
                employeePerformance: [],
                employeeProfits: []
            });

            setEmployeeStats({
                totalEmployees: employees.length,
                employeeWeaponCounts: {},
                employeeValueTotals: {},
                employeeProfits: employeeStats.employeeProfits.sort((a, b) => b.profit - a.profit),
                topEmployee: employeeStats.employeePerformance.reduce((max: { name: string; count: number } | null, emp: { name: string; count: number }) => 
                    !max || emp.count > max.count ? { name: emp.name, count: emp.count } : max
                , null),
                employeePerformance: employeeStats.employeePerformance.sort((a: { count: number }, b: { count: number }) => b.count - a.count),
                employeeSpecialties: employeeStats.employeeSpecialties
            });

            setError(null);
        } catch (err) {
            setError('Erreur lors du chargement des statistiques');
            console.error('Error fetching statistics:', err);
        } finally {
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-red-600">{error}</div>
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
                    <h1 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Statistiques
                    </h1>
                    <p className="mt-1 text-sm text-gray-700">
                        Analyse détaillée du registre des armes
                    </p>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-4">
                    <div className="flex flex-wrap gap-2 mb-2">
                        {PERIOD_PRESETS.map(preset => (
                            <button
                                key={preset.days}
                                onClick={() => handlePresetClick(preset.days)}
                                className={`px-2 py-1 rounded text-xs font-medium transition-colors duration-200
                                    ${dateRange.startDate.getTime() === new Date(new Date().setDate(new Date().getDate() - preset.days)).getTime()
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 bg-white/80 backdrop-blur-sm'}`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={dateRange.startDate.toISOString().split('T')[0]}
                            onChange={(e) => {
                                const newStartDate = new Date(e.target.value);
                                setDateRange(prev => ({
                                    ...prev,
                                    startDate: newStartDate
                                }));
                            }}
                            className="px-2 py-1 text-sm border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <span className="text-gray-500 text-sm">à</span>
                        <input
                            type="date"
                            value={dateRange.endDate.toISOString().split('T')[0]}
                            onChange={(e) => {
                                const newEndDate = new Date(e.target.value);
                                setDateRange(prev => ({
                                    ...prev,
                                    endDate: newEndDate
                                }));
                            }}
                            className="px-2 py-1 text-sm border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>
            </motion.div>

            <motion.div 
                className="mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <nav className="flex gap-2">
                    {(['overview', 'weapons', 'employees'] as TabType[]).map((tab) => (
                        <motion.button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200 ${
                                activeTab === tab
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 bg-white/80 backdrop-blur-sm'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {tab === 'overview' ? 'Vue d\'ensemble' : 
                             tab === 'weapons' ? 'Armes' : 'Employés'}
                        </motion.button>
                    ))}
                </nav>
            </motion.div>

            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
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
                            title="Bénéfice total"
                            value={new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(weaponStats.totalProfit / 100)}
                            icon={CurrencyDollarIcon}
                        />
                        <StatCard
                            title="Commission (20%)"
                            value={new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format((weaponStats.totalProfit * 0.2) / 100)}
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
                            className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-100"
                        >
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Ventes quotidiennes</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={weaponStats.dailyStats}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="day" stroke="#6B7280" />
                                        <YAxis stroke="#6B7280" />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                                backdropFilter: 'blur(8px)',
                                                borderRadius: '8px',
                                                border: '1px solid #E5E7EB'
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="count"
                                            name="Nombre d'armes"
                                            stroke="#6366F1"
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
                            className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-100"
                        >
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Types d'armes vendues</h3>
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
                                                    fill={`hsl(${(index * 360) / weaponStats.weaponTypes.length}, 70%, 60%)`}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                                backdropFilter: 'blur(8px)',
                                                borderRadius: '8px',
                                                border: '1px solid #E5E7EB'
                                            }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Police vs Civilian */}
                        <motion.div 
                            variants={chartVariants}
                            className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-100"
                        >
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Répartition Police/Civil</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Police', value: weaponStats.policeWeapons },
                                                { name: 'Civil', value: weaponStats.civilianWeapons }
                                            ]}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label
                                        >
                                            <Cell fill="#6366F1" />
                                            <Cell fill="#10B981" />
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                                backdropFilter: 'blur(8px)',
                                                borderRadius: '8px',
                                                border: '1px solid #E5E7EB'
                                            }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {activeTab === 'employees' && (
                    <motion.div
                        key="employees"
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
                                    className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100"
                                >
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg font-medium text-gray-900">{employee.name}</h3>
                                            <span className="text-sm text-gray-500">{employee.sales} ventes</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Bénéfice</span>
                                                <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                                    {new Intl.NumberFormat('fr-FR', { 
                                                        style: 'currency', 
                                                        currency: 'USD' 
                                                    }).format(employee.profit / 100)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Commission ({employee.role === 'PATRON' ? '30%' : '20%'})</span>
                                                <span className="font-bold text-lg text-green-600">
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
                            className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-100"
                        >
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Ventes par employé</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={employeeStats.employeePerformance}>
                                        <defs>
                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#6366F1" />
                                                <stop offset="100%" stopColor="#A78BFA" />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="name" stroke="#6B7280" />
                                        <YAxis stroke="#6B7280" />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                                backdropFilter: 'blur(8px)',
                                                borderRadius: '8px',
                                                border: '1px solid #E5E7EB'
                                            }}
                                        />
                                        <Legend />
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

                        {/* Employee Specialties */}
                        <motion.div 
                            variants={chartVariants}
                            className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-100"
                        >
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Spécialités des employés</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={employeeStats.employeeSpecialties}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="name" stroke="#6B7280" />
                                        <YAxis stroke="#6B7280" />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                                backdropFilter: 'blur(8px)',
                                                borderRadius: '8px',
                                                border: '1px solid #E5E7EB'
                                            }}
                                        />
                                        <Legend />
                                        <Bar 
                                            dataKey="policeCount" 
                                            name="Ventes Police" 
                                            stackId="a" 
                                            fill="#6366F1"
                                            radius={[4, 4, 0, 0]}
                                        />
                                        <Bar 
                                            dataKey="civilianCount" 
                                            name="Ventes Civil" 
                                            stackId="a" 
                                            fill="#10B981"
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