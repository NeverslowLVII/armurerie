import React, { useState, useMemo } from 'react';
import { Tab } from '@headlessui/react';
import { TabType, Weapon, DateRange } from './types';
import { AnimatePresence } from 'framer-motion';
import { formatDate, getPresets, normalizeWeaponName } from './utils';
import OverviewTab from './OverviewTab';
import WeaponsTab from './WeaponsTab';
import EmployeesTab from './EmployeesTab';
import IncomeStatementTab from './IncomeStatementTab';
import DateRangeSelector from './DateRangeSelector';
import { ChartBarIcon, UsersIcon, CurrencyDollarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface StatisticsProps {
    weapons: Weapon[];
}

const TAX_RATE = 0.1; // 10%

const Statistics: React.FC<StatisticsProps> = ({ weapons }) => {
    const [selectedTab, setSelectedTab] = useState<TabType>('overview');
    const [activeDatePreset, setActiveDatePreset] = useState<number>(0); // Début avec "Cette semaine"
    
    // Initialiser la plage de dates avec le premier préréglage (Cette semaine)
    const initialPreset = getPresets()[0];
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: initialPreset.startDate,
        endDate: initialPreset.endDate
    });
    
    // Gestionnaire de changement de plage de dates
    const handleDateRangeChange = (newDateRange: DateRange) => {
        setDateRange(newDateRange);
        setActiveDatePreset(-1); // Désélectionner les préréglages lorsque les dates sont modifiées manuellement
    };
    
    // Gestionnaire de clic sur préréglage
    const handlePresetClick = (presetIndex: number) => {
        const preset = getPresets()[presetIndex];
        setDateRange({
            startDate: preset.startDate,
            endDate: preset.endDate
        });
        setActiveDatePreset(presetIndex);
    };
    
    // Filtrer les armes en fonction de la plage de dates sélectionnée
    const filteredWeapons = useMemo(() => {
        return weapons.filter(weapon => {
            const weaponDate = new Date(weapon.horodateur);
            return weaponDate >= dateRange.startDate && weaponDate <= dateRange.endDate;
        });
    }, [weapons, dateRange]);
    
    // Calculate weapon statistics
    const weaponStats = useMemo(() => {
        // Early return if no weapons
        if (filteredWeapons.length === 0) {
            return {
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
            };
        }

        // Calculate totals
        const totalWeapons = filteredWeapons.length;
        const totalValue = filteredWeapons.reduce((sum, weapon) => sum + weapon.prix, 0);
        const totalCostProduction = filteredWeapons.reduce((sum, weapon) => {
            return sum + (weapon.base_weapon?.cout_production_defaut ?? 0);
        }, 0);
        
        const totalProfit = totalValue - totalCostProduction;
        const totalTaxes = Math.round(totalProfit * TAX_RATE);
        const profitAfterTaxes = totalProfit - totalTaxes;

        // Calculate averages
        const averagePrice = Math.round(totalValue / totalWeapons);
        const averageCostProduction = Math.round(totalCostProduction / totalWeapons);
        const averageProfit = Math.round(totalProfit / totalWeapons);
        const profitMargin = totalValue > 0 ? (totalProfit / totalValue) * 100 : 0;

        // Group weapons by type (normalized name)
        const weaponsByType = filteredWeapons.reduce((acc, weapon) => {
            const normalizedName = normalizeWeaponName(weapon.nom_arme);
            if (!acc[normalizedName]) {
                acc[normalizedName] = [];
            }
            acc[normalizedName].push(weapon);
            return acc;
        }, {} as Record<string, Weapon[]>);

        // Create weapon types statistics
        const weaponTypes = Object.entries(weaponsByType).map(([name, typeWeapons]) => ({
            name,
            count: typeWeapons.length,
        })).sort((a, b) => b.count - a.count);

        // Calculate profit by weapon type
        const profitByType = Object.entries(weaponsByType).map(([name, typeWeapons]) => {
            const totalTypeValue = typeWeapons.reduce((sum, weapon) => sum + weapon.prix, 0);
            const totalTypeCost = typeWeapons.reduce((sum, weapon) => sum + (weapon.base_weapon?.cout_production_defaut || 0), 0);
            const typeProfit = totalTypeValue - totalTypeCost;
            
            return {
                name,
                profit: typeProfit,
                count: typeWeapons.length
            };
        }).sort((a, b) => b.profit - a.profit);

        // Group sales by day
        const salesByDay = filteredWeapons.reduce((acc, weapon) => {
            const day = formatDate(new Date(weapon.horodateur));
            if (!acc[day]) {
                acc[day] = {
                    totalValue: 0,
                    totalCost: 0,
                    totalProfit: 0,
                    count: 0
                };
            }
            
            acc[day].totalValue += weapon.prix;
            acc[day].totalCost += (weapon.base_weapon?.cout_production_defaut ?? 0);
            acc[day].totalProfit += weapon.prix - (weapon.base_weapon?.cout_production_defaut ?? 0);
            acc[day].count += 1;
            
            return acc;
        }, {} as Record<string, { totalValue: number; totalCost: number; totalProfit: number; count: number; }>);

        // Convert to array and sort by date
        const dailyStats = Object.entries(salesByDay).map(([day, stats]) => ({
            day,
            ...stats
        })).sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());

        return {
            totalWeapons,
            totalValue,
            totalCostProduction,
            totalProfit,
            totalTaxes,
            profitAfterTaxes,
            averagePrice,
            averageCostProduction,
            averageProfit,
            profitMargin,
            weaponTypes,
            dailyStats,
            profitByType
        };
    }, [filteredWeapons]);

    // Calculate employee statistics
    const employeeStats = useMemo(() => {
        // Group weapons by employee
        const employeeWeapons = filteredWeapons.reduce((acc, weapon) => {
            const employeeName = weapon.user?.name || 'Inconnu';
            if (!acc[employeeName]) {
                acc[employeeName] = [];
            }
            acc[employeeName].push(weapon);
            return acc;
        }, {} as Record<string, Weapon[]>);

        // Calculate counts by employee
        const employeeWeaponCounts = Object.entries(employeeWeapons).reduce((acc, [name, empWeapons]) => {
            acc[name] = empWeapons.length;
            return acc;
        }, {} as Record<string, number>);

        // Calculate value totals by employee
        const employeeValueTotals = Object.entries(employeeWeapons).reduce((acc, [name, empWeapons]) => {
            acc[name] = empWeapons.reduce((sum, weapon) => sum + weapon.prix, 0);
            return acc;
        }, {} as Record<string, number>);

        // Calculate profits by employee
        const employeeProfits = Object.entries(employeeWeapons).map(([name, empWeapons]) => {
            const totalValue = empWeapons.reduce((sum, weapon) => sum + weapon.prix, 0);
            const totalCost = empWeapons.reduce((sum, weapon) => sum + (weapon.base_weapon?.cout_production_defaut ?? 0), 0);
            const profit = totalValue - totalCost;
            
            // Get commission rate from first weapon's user (should be the same for all weapons)
            const commissionRate = empWeapons[0]?.user?.commission ?? 0.1; // Default 10% if not set
            const commission = Math.round(profit * commissionRate);
            
            return {
                name,
                profit,
                sales: empWeapons.length,
                commission,
                role: empWeapons[0]?.user?.role || "EMPLOYEE",
                commissionRate
            };
        }).sort((a, b) => b.profit - a.profit);

        // Determine top employee
        const topEmployee = Object.entries(employeeWeaponCounts).reduce((top, [name, count]) => {
            if (!top || count > top.count) {
                return { name, count };
            }
            return top;
        }, null as { name: string; count: number } | null);

        // Create employee performance data for chart
        const employeePerformance = Object.entries(employeeWeaponCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        return {
            totalEmployees: Object.keys(employeeWeaponCounts).length,
            employeeWeaponCounts,
            employeeValueTotals,
            employeeProfits,
            topEmployee,
            employeePerformance
        };
    }, [filteredWeapons]);

    // Calculate income statement statistics
    const incomeStatementStats = useMemo(() => {
        // Créer un compte de résultat pour la période sélectionnée
        const revenue = filteredWeapons.reduce((sum, weapon) => sum + weapon.prix, 0);
        const productionCost = filteredWeapons.reduce((sum, weapon) => 
            sum + (weapon.base_weapon?.cout_production_defaut ?? 0), 0);
        const grossProfit = revenue - productionCost;
        
        // Calculer les commissions en utilisant le taux stocké dans weapon.user.commission
        const commissions = filteredWeapons.reduce((sum, weapon) => {
            const weaponProfit = weapon.prix - (weapon.base_weapon?.cout_production_defaut ?? 0);
            const commissionRate = weapon.user?.commission ?? 0.1; // Default 10% if not set
            return sum + (weaponProfit * commissionRate);
        }, 0);
        
        const operatingProfit = grossProfit - commissions;
        const taxes = Math.round(operatingProfit * TAX_RATE);
        const netProfit = operatingProfit - taxes;
                
        return {
            incomeStatementByPeriod: [{
                period: `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`,
                revenue,
                productionCost,
                grossProfit,
                taxes,
                commissions,
                netProfit,
                count: filteredWeapons.length,
                margin: revenue > 0 ? (netProfit / revenue) * 100 : 0
            }],
            totals: {
                revenue,
                productionCost,
                commissions,
                grossProfit,
                taxes,
                netProfit,
                count: filteredWeapons.length
            }
        };
    }, [filteredWeapons, dateRange]);
    
    // Tabs configuration
    const tabs = [
        { key: 'overview', name: 'Vue d\'ensemble', icon: ChartBarIcon },
        { key: 'weapons', name: 'Armes', icon: CheckCircleIcon },
        { key: 'employees', name: 'Employés', icon: UsersIcon },
        { key: 'income', name: 'Compte de résultat', icon: CurrencyDollarIcon }
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 border border-neutral-200 dark:border-neutral-700">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
                    Statistiques
                </h2>

                {/* Date Range Selector */}
                <DateRangeSelector 
                    dateRange={dateRange}
                    onDateRangeChange={handleDateRangeChange}
                    activePreset={activeDatePreset}
                    onPresetClick={handlePresetClick}
                />
                
                {filteredWeapons.length === 0 ? (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
                        <p className="text-yellow-600 dark:text-yellow-400">Aucune donnée disponible pour cette période.</p>
                    </div>
                ) : (
                    <Tab.Group 
                        selectedIndex={tabs.findIndex(tab => tab.key === selectedTab)}
                        onChange={(index) => setSelectedTab(tabs[index].key as TabType)}
                    >
                        <Tab.List className="flex space-x-2 rounded-xl bg-neutral-100 dark:bg-neutral-700 p-1 overflow-x-auto">
                            {tabs.map((tab) => (
                                <Tab
                                    key={tab.key}
                                    className={({ selected }) => `
                                        flex items-center space-x-2 py-2.5 px-3 text-sm font-medium leading-5 
                                        ${
                                            selected
                                                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow'
                                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                                        }
                                        outline-none ring-0 ring-offset-0 rounded-lg whitespace-nowrap
                                    `}
                                >
                                    <tab.icon className="h-5 w-5" aria-hidden="true" />
                                    <span>{tab.name}</span>
                                </Tab>
                            ))}
                        </Tab.List>

                        <Tab.Panels className="mt-6">
                            <AnimatePresence mode="wait">
                                {selectedTab === 'overview' && (
                                    <OverviewTab weaponStats={weaponStats} />
                                )}
                                
                                {selectedTab === 'weapons' && (
                                    <WeaponsTab weaponStats={weaponStats} />
                                )}
                                
                                {selectedTab === 'employees' && (
                                    <EmployeesTab employeeStats={employeeStats} />
                                )}
                                
                                {selectedTab === 'income' && (
                                    <IncomeStatementTab incomeStatementStats={incomeStatementStats} />
                                )}
                            </AnimatePresence>
                        </Tab.Panels>
                    </Tab.Group>
                )}
            </div>
        </div>
    );
};

export default Statistics; 