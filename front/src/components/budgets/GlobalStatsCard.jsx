import React from 'react';
import { Wallet, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

/**
 * GlobalStatsCard — Muestra los indicadores y barras de progreso globales del mes.
 * Optimizado con React.memo para evitar re-renders innecesarios.
 */
const GlobalStatsCard = React.memo(({ totalLimit, totalSpent }) => {
  const remaining = totalLimit - totalSpent;
  const isExceeded = remaining < 0;
  const progressPercent = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

  return (
    <>
      {/* GRID DE ESTADÍSTICAS GLOBALES */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        {/* Límite Total */}
        <div className="stat-card glass-container">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--primary-glow)' }}>
            <Wallet size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Meta Global Planeada</span>
            <h3 className="stat-value">{formatCurrency(totalLimit)}</h3>
            <span className="stat-desc" style={{ color: 'var(--text-muted)' }}>
              Límite total del mes
            </span>
          </div>
        </div>

        {/* Total Gastado Real (Items Pagados) */}
        <div className="stat-card glass-container">
          <div className="stat-icon-wrapper" style={{ backgroundColor: isExceeded ? 'var(--error-glow)' : 'var(--success-glow)' }}>
            <TrendingDown size={20} style={{ color: isExceeded ? 'var(--error)' : 'var(--success)' }} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Gastos Reales (Ítems Pagados)</span>
            <h3 className="stat-value">{formatCurrency(totalSpent)}</h3>
            <span className="stat-desc" style={{ color: 'var(--text-muted)' }}>
              Total abonado del presupuesto
            </span>
          </div>
        </div>

        {/* Disponible o Excedido */}
        <div className="stat-card glass-container" style={{ 
          borderLeft: `4px solid ${isExceeded ? 'var(--error)' : 'var(--success)'}` 
        }}>
          <div className="stat-icon-wrapper" style={{ 
            backgroundColor: isExceeded ? 'var(--error-glow)' : 'var(--success-glow)' 
          }}>
            {isExceeded ? (
              <AlertTriangle size={20} style={{ color: 'var(--error)' }} />
            ) : (
              <CheckCircle size={20} style={{ color: 'var(--success)' }} />
            )}
          </div>
          <div className="stat-info">
            <span className="stat-label">{isExceeded ? 'Presupuesto Superado' : 'Margen Disponible'}</span>
            <h3 className="stat-value" style={{ color: isExceeded ? 'var(--error)' : 'var(--success)' }}>
              {formatCurrency(Math.abs(remaining))}
            </h3>
            <span className="stat-desc">
              {isExceeded ? 'Has gastado más de la meta global' : 'Margen libre para gastos planificados'}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Progreso Global */}
      <div className="card glass-container" style={{ padding: '1.25rem 2rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>
          <span>Ejecución del Presupuesto</span>
          <span style={{ color: isExceeded ? 'var(--error)' : 'var(--success)' }}>{progressPercent.toFixed(1)}%</span>
        </div>
        <div style={{ width: '100%', height: '12px', backgroundColor: 'var(--border-color)', borderRadius: '100px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${Math.min(progressPercent, 100)}%`, 
            height: '100%', 
            backgroundColor: isExceeded ? 'var(--error)' : 'var(--primary)',
            borderRadius: '100px',
            transition: 'width 0.6s ease'
          }} />
        </div>
      </div>
    </>
  );
});

GlobalStatsCard.displayName = 'GlobalStatsCard';

export default GlobalStatsCard;
