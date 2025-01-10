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
    ShieldCheckIcon,
    FireIcon
} from '@heroicons/react/24/outline';

interface WeaponStats {
    totalWeapons: number;
    totalValue: number;
    averagePrice: number;
    weaponTypes: { name: string; count: number }[];
    dailyStats: { day: string; totalValue: number; count: number }[];
    policeWeapons: number;
    civilianWeapons: number;
}

interface EmployeeStats {
    totalEmployees: number;
    employeeWeaponCounts: { [key: string]: number };
    employeeValueTotals: { [key: string]: number };
    topEmployee: { name: string; count: number } | null;
    employeePerformance: { name: string; count: number }[];
    employeeSpecialties: { name: string; policeCount: number; civilianCount: number }[];
}

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    subtitle?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

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

export default function Statistics() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [weaponStats, setWeaponStats] = useState<WeaponStats>({
        totalWeapons: 0,
        totalValue: 0,
        averagePrice: 0,
        weaponTypes: [],
        dailyStats: [],
        policeWeapons: 0,
        civilianWeapons: 0
    });
    const [employeeStats, setEmployeeStats] = useState<EmployeeStats>({
        totalEmployees: 0,
        employeeWeaponCounts: {},
        employeeValueTotals: {},
        topEmployee: null,
        employeePerformance: [],
        employeeSpecialties: []
    });
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [weapons, employees] = await Promise.all([getWeapons(), getEmployees()]);
            
            // Normaliser et calculer les statistiques des armes
            const weaponTypeMap = new Map<string, number>();
            let policeWeapons = 0;
            let civilianWeapons = 0;

            weapons.forEach(weapon => {
                const normalizedName = normalizeWeaponName(weapon.nom_arme);
                weaponTypeMap.set(normalizedName, (weaponTypeMap.get(normalizedName) || 0) + 1);
                
                if (isPoliceWeapon(weapon.detenteur)) {
                    policeWeapons++;
                } else {
                    civilianWeapons++;
                }
            });

            const weaponTypes = Array.from(weaponTypeMap.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);

            // Calculer les statistiques quotidiennes
            const dailyStatsMap = new Map<string, { totalValue: number; count: number }>();
            weapons.forEach(weapon => {
                const date = new Date(weapon.horodateur);
                const day = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
                const existing = dailyStatsMap.get(day) || { totalValue: 0, count: 0 };
                dailyStatsMap.set(day, {
                    totalValue: existing.totalValue + weapon.prix,
                    count: existing.count + 1
                });
            });

            const dailyStats = Array.from(dailyStatsMap.entries())
                .map(([day, stats]) => ({
                    day,
                    ...stats
                }))
                .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());

            // Calculer les statistiques des employés
            const employeeStats = employees.reduce((acc, emp) => {
                const empWeapons = weapons.filter(w => w.employee.name === emp.name);
                const policeCount = empWeapons.filter(w => isPoliceWeapon(w.detenteur)).length;
                const civilianCount = empWeapons.length - policeCount;
                
                acc.employeeSpecialties.push({
                    name: emp.name,
                    policeCount,
                    civilianCount
                });
                
                acc.employeePerformance.push({
                    name: emp.name,
                    count: empWeapons.length
                });
                
                return acc;
            }, {
                employeeSpecialties: [] as { name: string; policeCount: number; civilianCount: number }[],
                employeePerformance: [] as { name: string; count: number }[]
            });

            setWeaponStats({
                totalWeapons: weapons.length,
                totalValue: weapons.reduce((sum, w) => sum + w.prix, 0),
                averagePrice: weapons.reduce((sum, w) => sum + w.prix, 0) / weapons.length,
                weaponTypes,
                dailyStats,
                policeWeapons,
                civilianWeapons
            });

            setEmployeeStats({
                totalEmployees: employees.length,
                employeeWeaponCounts: {},
                employeeValueTotals: {},
                topEmployee: employeeStats.employeePerformance.reduce((max, emp) => 
                    !max || emp.count > max.count ? { name: emp.name, count: emp.count } : max
                , null as { name: string; count: number } | null),
                employeePerformance: employeeStats.employeePerformance.sort((a, b) => b.count - a.count),
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

    const StatCard = ({ title, value, icon: Icon, subtitle }: StatCardProps) => (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 shadow"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
                    {subtitle && (
                        <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
                    )}
                </div>
                <div className="bg-indigo-100 rounded-full p-3">
                    <Icon className="h-6 w-6 text-indigo-600" />
                </div>
            </div>
        </motion.div>
    );

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
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center mb-8">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Statistiques</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Analyse détaillée du registre des armes
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <div className="mb-8">
                <nav className="flex space-x-4">
                    {(['overview', 'weapons', 'employees'] as TabType[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                                activeTab === tab
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab === 'overview' ? 'Vue d\'ensemble' : 
                             tab === 'weapons' ? 'Armes' : 'Employés'}
                        </button>
                    ))}
                </nav>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                    >
                        <StatCard
                            title="Armes totales"
                            value={weaponStats.totalWeapons}
                            icon={ChartBarIcon}
                        />
                        <StatCard
                            title="Valeur totale"
                            value={(weaponStats.totalValue / 100).toLocaleString('fr-FR', {
                                style: 'currency',
                                currency: 'USD'
                            })}
                            icon={CurrencyDollarIcon}
                        />
                        <StatCard
                            title="Armes de Police"
                            value={weaponStats.policeWeapons}
                            icon={ShieldCheckIcon}
                            subtitle={`${((weaponStats.policeWeapons / weaponStats.totalWeapons) * 100).toFixed(1)}% du total`}
                        />
                        <StatCard
                            title="Type le plus vendu"
                            value={weaponStats.weaponTypes[0]?.name || 'N/A'}
                            icon={FireIcon}
                            subtitle={`${weaponStats.weaponTypes[0]?.count || 0} unités`}
                        />
                    </motion.div>
                )}

                {activeTab === 'weapons' && (
                    <motion.div
                        key="weapons"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Daily Trends */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Ventes quotidiennes</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={weaponStats.dailyStats}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="day" />
                                        <YAxis />
                                        <Tooltip />
                                        <Area
                                            type="monotone"
                                            dataKey="count"
                                            name="Nombre d'armes"
                                            stroke="#82ca9d"
                                            fill="#82ca9d"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Weapon Types Distribution */}
                        <div className="bg-white p-6 rounded-lg shadow">
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
                                            {weaponStats.weaponTypes.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Police vs Civilian */}
                        <div className="bg-white p-6 rounded-lg shadow">
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
                                            <Cell fill="#0088FE" />
                                            <Cell fill="#00C49F" />
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'employees' && (
                    <motion.div
                        key="employees"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Employee Performance */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Ventes par employé</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={employeeStats.employeePerformance}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar
                                            dataKey="count"
                                            name="Nombre d'armes vendues"
                                            fill="#8884d8"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Employee Specialties */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Spécialités des employés</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={employeeStats.employeeSpecialties}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="policeCount" name="Ventes Police" stackId="a" fill="#0088FE" />
                                        <Bar dataKey="civilianCount" name="Ventes Civil" stackId="a" fill="#00C49F" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
} 