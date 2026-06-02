import React from 'react';
import { Calendar } from 'lucide-react';
import { getMonthNameSpanish } from '../../utils/formatters';

/**
 * PeriodHistorySelector — Selector de meses históricos para informes de IA.
 *
 * @param {Array} history - Historial de reportes disponibles
 * @param {string} selectedPeriod - Período seleccionado actualmente
 * @param {Function} onSelectPeriod - Callback al cambiar el período
 */
const PeriodHistorySelector = ({ history = [], selectedPeriod, onSelectPeriod }) => {
  if (!history || history.length === 0) return null;

  return (
    <div className="period-history-selector" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Calendar size={16} style={{ color: 'var(--text-secondary)' }} />
      <select
        value={selectedPeriod || ''}
        onChange={(e) => onSelectPeriod(e.target.value)}
        className="form-select"
        style={{
          padding: '0.4rem 2rem 0.4rem 0.75rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {history.map((report) => (
          <option key={report.period} value={report.period}>
            {getMonthNameSpanish(report.period)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default React.memo(PeriodHistorySelector);
