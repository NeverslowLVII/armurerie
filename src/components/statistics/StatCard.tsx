import React from 'react';
import { motion } from 'framer-motion';
import { StatCardProps } from './types';
import { cardVariants } from './utils';

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

export default StatCard; 