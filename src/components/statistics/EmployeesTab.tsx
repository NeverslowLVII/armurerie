import React from 'react';
import { motion } from 'framer-motion';
import { EmployeeStats } from './types';
import { chartVariants, cardVariants, formatDollars } from './utils';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface EmployeesTabProps {
    employeeStats: EmployeeStats;
}

const EmployeesTab: React.FC<EmployeesTabProps> = ({ employeeStats }) => {
    return (
        <motion.div
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
                                        {formatDollars(employee.profit)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-neutral-600 dark:text-neutral-400">Commission ({(employee.commissionRate * 100).toFixed(0)}%)</span>
                                    <span className="font-bold text-lg text-green-500 dark:text-green-400">
                                        {formatDollars(employee.commission)}
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
    );
};

export default EmployeesTab; 