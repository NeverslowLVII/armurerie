import React from 'react';
import { motion } from 'framer-motion';
import { StatCardProps } from './types';
import { cardVariants } from './utils';

const StatCard = ({ title, value, icon: Icon }: StatCardProps) => (
  <motion.div
    variants={cardVariants}
    className="relative overflow-hidden rounded-lg border border-neutral-200 bg-white p-3 shadow-lg backdrop-blur-xl transition-shadow duration-300 hover:shadow-xl dark:border-neutral-700 dark:bg-neutral-800"
    whileHover={{ y: -2, transition: { duration: 0.2 } }}
  >
    <div className="relative flex items-center">
      <div className="rounded-lg bg-gradient-to-br from-red-500 to-orange-500 p-2 shadow-lg shadow-red-500/20">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="ml-3 min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-neutral-600 dark:text-neutral-300">
          {title}
        </p>
        <p className="mt-0.5 truncate bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-lg font-bold text-transparent">
          {value}
        </p>
      </div>
    </div>
  </motion.div>
);

export default StatCard;
