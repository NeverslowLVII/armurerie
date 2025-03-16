import React from 'react';
import { motion } from 'framer-motion';
import { WeaponStats } from './types';
import { chartVariants } from './utils';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

interface WeaponsTabProps {
    weaponStats: WeaponStats;
}

const WeaponsTab: React.FC<WeaponsTabProps> = ({ weaponStats }) => {
    return (
        <motion.div
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
    );
};

export default WeaponsTab; 