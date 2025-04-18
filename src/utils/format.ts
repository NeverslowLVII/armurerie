/**
 * Formats a number as currency in USD using French locale
 * @param value - The number in cents to format
 * @returns Formatted string in USD with French locale
 */
export const formatCurrency = (value: number): string => {
  // Convert cents to dollars
  const dollars = value / 100;
  return new Intl.NumberFormat('us-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    currencyDisplay: 'code',
  }).format(dollars);
};

/**
 * Formats a date in French locale
 * @param date - The date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('us-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
};

/**
 * Formats a percentage in French locale
 * @param value - The decimal value to format as percentage
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('us-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};
