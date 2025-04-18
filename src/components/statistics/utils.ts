import { DateRange } from './types';

/**
 * Normalise un nom d'arme pour la classification
 */
export const normalizeWeaponName = (name: string): string => {
  name = name.toLowerCase().trim();
  // Normaliser les noms d'armes communs
  const mapping: { [key: string]: string } = {
    scofield: 'Scofield',
    pompe: 'Fusil à Pompe',
    verrou: 'Fusil à Verrou',
    navy: 'Revolver Navy',
    volcanic: 'Pistolet Volcanic',
    henry: 'Carabine Henry',
    winchester: 'Carabine Winchester',
    cattleman: 'Revolver Cattleman',
    'rolling block': 'Fusil Rolling Block',
    'double action': 'Revolver Double Action',
  };

  for (const [key, value] of Object.entries(mapping)) {
    if (name.includes(key)) {
      return value;
    }
  }
  return name.charAt(0).toUpperCase() + name.slice(1);
};

/**
 * Formatte une date pour l'utilisation dans les champs de type date
 */
export const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formatte un montant en centimes en dollars
 */
export const formatDollars = (amount: number) => {
  // Conversion des centimes en dollars (division par 100)
  const dollars = amount / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(dollars);
};

/**
 * Formatte une date en format localisé (jour/mois/année)
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('us-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

/**
 * Génère les presets de périodes pour les statistiques
 */
export const getPresets = (): Array<DateRange & { label: string }> => {
  const now = new Date();
  now.setHours(23, 59, 59, 999); // Fin de journée

  const firstDayOfWeek = new Date(now);
  const day = now.getDay() || 7; // Convertir 0 (dimanche) en 7
  firstDayOfWeek.setDate(now.getDate() - day + 1); // Lundi de la semaine courante
  firstDayOfWeek.setHours(0, 0, 0, 0); // Début de journée

  const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
  firstDayOfYear.setHours(0, 0, 0, 0);

  return [
    {
      label: 'Cette semaine',
      startDate: firstDayOfWeek,
      endDate: now,
    },
    {
      label: '7 derniers jours',
      startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      endDate: now,
    },
    {
      label: '30 derniers jours',
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: now,
    },
    {
      label: '3 derniers mois',
      startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      endDate: now,
    },
    {
      label: 'Cette année',
      startDate: firstDayOfYear,
      endDate: now,
    },
  ];
};

/**
 * Animations pour Framer Motion
 */
export const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const chartVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
    },
  },
};
