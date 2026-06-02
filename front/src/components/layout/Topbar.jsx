import React from 'react';
import { Calendar, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getMonthOptions } from '../../utils/formatters';

const TAB_META = {
  overview:     { title: 'Resumen Financiero',          subtitle: 'Balance e indicadores del periodo' },
  transactions: { title: 'Historial de Transacciones',  subtitle: 'Visualiza y filtra tus movimientos' },
  settings:     { title: 'Ajustes y Configuración',     subtitle: 'Gestiona tus categorías y perfil' },
  budgets:      { title: 'Presupuestos Mensuales',      subtitle: 'Límites de gastos por categoría' },
  goals:        { title: 'Metas de Ahorro',             subtitle: 'Planificación de metas financieras' },
};

// Month options computed once at module load (static — doesn't change during session)
const MONTH_OPTIONS = getMonthOptions();

/**
 * Topbar — barra superior del dashboard con título y selector de mes.
 *
 * @param {string} activeTab
 * @param {string} activeMonth - formato YYYY-MM
 * @param {(month: string) => void} onMonthChange
 */
const Topbar = ({ activeTab, activeMonth, onMonthChange, showMonthSelector = true }) => {
  const { logout } = useAuth();
  const { title, subtitle } = TAB_META[activeTab] ?? TAB_META.overview;

  return (
    <header className="dashboard-topbar">
      <div className="topbar-title-section">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{title}</h2>
        <p className="topbar-subtitle">{subtitle}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {showMonthSelector && (
          <div className="month-indicator hide-on-mobile">
            <Calendar size={16} style={{ color: 'var(--primary)' }} />
            <select
              id="month-selector"
              value={activeMonth || ''}
              onChange={(e) => onMonthChange && onMonthChange(e.target.value)}
              aria-label="Filtrar por mes"
              style={{
                border: 'none',
                background: 'transparent',
                fontWeight: 600,
                fontSize: '0.875rem',
                outline: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              {MONTH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <button 
          className="btn-logout show-on-mobile" 
          onClick={logout} 
          aria-label="Cerrar sesión"
          style={{ display: 'none', padding: '0.4rem', border: 'none', borderRadius: '50%' }}
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
