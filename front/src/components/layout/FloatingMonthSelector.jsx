import React from 'react';
import { Calendar } from 'lucide-react';
import { getMonthOptions } from '../../utils/formatters';

const MONTH_OPTIONS = getMonthOptions();

const FloatingMonthSelector = ({ activeMonth, onMonthChange }) => {
  return (
    <div className="floating-month-selector">
      <Calendar size={20} style={{ color: 'var(--primary)' }} />
      <select
        value={activeMonth}
        onChange={(e) => onMonthChange(e.target.value)}
        aria-label="Filtrar por mes"
      >
        {MONTH_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ backgroundColor: 'var(--bg-secondary)' }}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FloatingMonthSelector;
