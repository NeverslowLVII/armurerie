import React from 'react';
import { motion } from 'framer-motion';
import { CubeIcon, ArrowDownIcon, BanknotesIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import StatCard from './StatCard';
import { formatDollars } from './utils';

interface IncomeStatementProps {
  incomeStatementStats: {
    incomeStatementByPeriod: Array<{
      period: string;
      revenue: number;
      productionCost: number;
      grossProfit: number;
      commissions: number;
      taxes: number;
      netProfit: number;
      count: number;
      margin: number;
    }>;
    totals: {
      revenue: number;
      productionCost: number;
      grossProfit: number;
      commissions: number;
      taxes: number;
      netProfit: number;
      count: number;
    };
  };
}

// Calculate percentage
const calculatePercentage = (value: number, total: number) => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

const IncomeStatementTab: React.FC<IncomeStatementProps> = ({ incomeStatementStats }) => {
  const { totals } = incomeStatementStats;
  
  // Calcul correct des taxes à 10% du bénéfice d'exploitation
  const operatingProfit = totals.grossProfit - totals.commissions;
  const taxesAt10Percent = Math.round(operatingProfit * 0.1); // 10% des bénéfices d'exploitation
  const netProfitAt10Percent = operatingProfit - taxesAt10Percent;
  
  // Fonction pour exporter les données en CSV
  const exportToCSV = () => {
    // Entêtes CSV
    const headers = ['Poste', 'Montant', '% du CA'];
    
    // Données du tableau avec taxes à 10%
    const data = [
      ['Chiffre d\'affaires', totals.revenue / 100, '100'],
      ['Coût de production', totals.productionCost / 100, Math.round(calculatePercentage(totals.productionCost, totals.revenue))],
      ['Marge brute', totals.grossProfit / 100, Math.round(calculatePercentage(totals.grossProfit, totals.revenue))],
      ['Charges du personnel', totals.commissions / 100, Math.round(calculatePercentage(totals.commissions, totals.revenue))],
      ['Bénéfice d\'exploitation', operatingProfit / 100, Math.round(calculatePercentage(operatingProfit, totals.revenue))],
      ['Taxes (10%)', taxesAt10Percent / 100, Math.round(calculatePercentage(taxesAt10Percent, totals.revenue))],
      ['Résultat net', netProfitAt10Percent / 100, Math.round(calculatePercentage(netProfitAt10Percent, totals.revenue))]
    ];
    
    // Création du contenu CSV
    let csvContent = headers.join(';') + '\n';
    
    // Ajouter chaque ligne de données
    for (const row of data) {
      // Formatter les valeurs numériques pour le format français (virgule pour les décimales)
      const formattedRow = row.map((cell, index) => {
        if (index === 1) {
          // Pour les montants, formatage avec 2 décimales et virgule
          return typeof cell === 'number' ? cell.toFixed(2).replace('.', ',') : cell;
        } else {
          return cell;
        }
      });
      csvContent += formattedRow.join(';') + '\n';
    }
    
    // Création du blob et téléchargement
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Aujourd'hui au format YYYY-MM-DD
    const today = new Date().toISOString().slice(0, 10);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `compte_resultat_${today}.csv`);
    link.style.visibility = 'hidden';
    document.body.append(link);
    link.click();
    link.remove();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
          Compte de résultat détaillé
        </h3>
        
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-200 transition-colors"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          <span>Exporter CSV</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
          title="Chiffre d'affaires" 
          value={formatDollars(totals.revenue)} 
          icon={BanknotesIcon}
          subtitle={`Total pour ${totals.count} armes`}
        />
        <StatCard 
          title="Coût de production" 
          value={formatDollars(totals.productionCost)} 
          icon={CubeIcon}
          subtitle={`${Math.round(calculatePercentage(totals.productionCost, totals.revenue))}% du CA`}
        />
        <StatCard 
          title="Marge brute" 
          value={formatDollars(totals.grossProfit)} 
          icon={ArrowDownIcon}
          subtitle={`${Math.round(calculatePercentage(totals.grossProfit, totals.revenue))}% du CA`}
        />
      </div>
      
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
          <thead className="bg-neutral-50 dark:bg-neutral-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Poste
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Montant
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                % du CA
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
            {/* Chiffre d'affaires */}
            <tr className="font-semibold">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                Chiffre d&apos;affaires
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-900 dark:text-white">
                {formatDollars(totals.revenue)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-900 dark:text-white">
                100%
              </td>
            </tr>
            
            {/* Coût de production */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                Coût de production
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-500 dark:text-neutral-400">
                {formatDollars(totals.productionCost)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-500 dark:text-neutral-400">
                {Math.round(calculatePercentage(totals.productionCost, totals.revenue))}%
              </td>
            </tr>
            
            {/* Marge brute */}
            <tr className="bg-neutral-50 dark:bg-neutral-700/20 font-medium">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                Marge brute
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-900 dark:text-white">
                {formatDollars(totals.grossProfit)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-900 dark:text-white">
                {Math.round(calculatePercentage(totals.grossProfit, totals.revenue))}%
              </td>
            </tr>
            
            {/* Charges du personnel (Commissions) */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                Charges du personnel
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-500 dark:text-neutral-400">
                {formatDollars(totals.commissions)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-500 dark:text-neutral-400">
                {Math.round(calculatePercentage(totals.commissions, totals.revenue))}%
              </td>
            </tr>
            
            {/* Bénéfice d'exploitation */}
            <tr className="bg-neutral-50 dark:bg-neutral-700/20 font-medium">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                Bénéfice d&apos;exploitation
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-900 dark:text-white">
                {formatDollars(operatingProfit)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-900 dark:text-white">
                {Math.round(calculatePercentage(operatingProfit, totals.revenue))}%
              </td>
            </tr>
            
            {/* Taxes - maintenant calculées à 10% */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                Taxes (10%)
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-500 dark:text-neutral-400">
                {formatDollars(taxesAt10Percent)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-500 dark:text-neutral-400">
                {Math.round(calculatePercentage(taxesAt10Percent, totals.revenue))}%
              </td>
            </tr>
            
            {/* Résultat net - recalculé avec les taxes à 10% */}
            <tr className="bg-neutral-100 dark:bg-neutral-700/40 font-bold">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                Résultat net
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-900 dark:text-white">
                {formatDollars(netProfitAt10Percent)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-900 dark:text-white">
                {Math.round(calculatePercentage(netProfitAt10Percent, totals.revenue))}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          <span className="font-medium">Note:</span> Ce compte de résultat est basé sur les {totals.count} ventes d&apos;armes réalisées durant la période sélectionnée.
          Les charges de personnel représentent les commissions versées aux employés selon leur rôle.
        </p>
      </div>
    </motion.div>
  );
};

export default IncomeStatementTab; 