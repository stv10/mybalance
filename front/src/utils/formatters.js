/**
 * Centralized formatting helpers.
 * Extracted from Dashboard.jsx to eliminate repetition across 8+ call sites.
 */

/**
 * Format a numeric amount as currency string.
 * @param {number} amount
 * @param {'income'|'expense'|null} sign - prefix sign automatically
 * @returns {string}
 */
export const formatCurrency = (amount, sign = null) => {
  const formatted = Number(amount).toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (sign === 'income') return `+$${formatted}`;
  if (sign === 'expense') return `-$${formatted}`;
  return `$${formatted}`;
};

/**
 * Format a YYYY-MM-DD date string for display.
 * Appends T00:00:00 to avoid timezone offset issues.
 * @param {string} dateString - e.g. "2025-05-20"
 * @param {Intl.DateTimeFormatOptions} options
 * @returns {string}
 */
export const formatDate = (dateString, options = { day: '2-digit', month: '2-digit', year: 'numeric' }) => {
  if (!dateString) return '';
  return new Date(`${dateString}T00:00:00`).toLocaleDateString('es-ES', options);
};

/**
 * Format a YYYY-MM string as a capitalized month + year label in Spanish.
 * @param {string} ymString - e.g. "2025-05"
 * @returns {string} - e.g. "Mayo 2025"
 */
export const getMonthNameSpanish = (ymString) => {
  if (!ymString) return '';
  const [year, month] = ymString.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  const name = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  return name.charAt(0).toUpperCase() + name.slice(1);
};

/**
 * Generate last 12 months as options for a month selector.
 * @returns {{ value: string, label: string }[]}
 */
export const getMonthOptions = () => {
  const options = [];
  const date = new Date();
  for (let i = 0; i < 12; i++) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const val = `${y}-${m}`;
    options.push({
      value: val,
      label: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
    });
    date.setMonth(date.getMonth() - 1);
  }
  return options;
};

/**
 * Get the current month as YYYY-MM string.
 * @returns {string}
 */
export const getCurrentMonth = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

/** Colors used for category distribution chart segments */
export const CATEGORY_COLORS = [
  '#6366f1', '#a855f7', '#ec4899', '#f43f5e',
  '#10b981', '#f59e0b', '#3b82f6',
];
