import React from 'react';
import { motion } from 'framer-motion';
import { WeaponStats } from './types';
import StatCard from './StatCard';
import { CurrencyDollarIcon, FireIcon } from '@heroicons/react/24/outline';
import { formatDollars } from './utils';

interface OverviewTabProps {
  weaponStats: WeaponStats;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ weaponStats }) => {
  return (
    <motion.div
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
            staggerChildren: 0.1,
          },
        },
      }}
      className="grid grid-cols-2 gap-3 lg:grid-cols-3"
    >
      <StatCard
        title="Prix moyen"
        value={formatDollars(weaponStats.averagePrice)}
        icon={CurrencyDollarIcon}
      />
      <StatCard
        title="Coût moyen de production"
        value={formatDollars(weaponStats.averageCostProduction)}
        icon={FireIcon}
      />
      <StatCard
        title="Bénéfice moyen"
        value={formatDollars(weaponStats.averageProfit)}
        icon={CurrencyDollarIcon}
        subtitle={`${weaponStats.profitMargin.toFixed(1)}% de marge`}
      />
    </motion.div>
  );
};

export default OverviewTab;
