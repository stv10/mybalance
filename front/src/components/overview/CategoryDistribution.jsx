import React from 'react';
import { PlusCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

/**
 * CategoryDistribution — gráfica segmentada de distribución de gastos por categoría.
 *
 * @param {{ name: string, amount: number, percentage: number, color: string }[]} distribution
 * @param {() => void} onNewTransaction
 */
const CategoryDistribution = ({ distribution, onNewTransaction }) => {
  return (
    <div className="distribution-card">
      <h3 style={{ fontSize: '1.15rem' }}>Distribución de Gastos</h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Donde va tu dinero este mes</p>

      {distribution.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          No hay gastos registrados en este mes para mostrar la distribución.
        </div>
      ) : (
        <>
          {/* Multicolored segmented bar */}
          <div className="progress-bar-container">
            {distribution.map((item, idx) => (
              <div
                key={idx}
                className="progress-bar-segment"
                style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                title={`${item.name}: ${item.percentage.toFixed(1)}%`}
              />
            ))}
          </div>

          {/* Detailed list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            {distribution.map((item, idx) => (
              <div className="distribution-item" key={idx}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="distribution-color-dot" style={{ backgroundColor: item.color }} />
                  <span style={{ fontWeight: 600 }}>{item.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <span style={{ fontWeight: 700 }}>
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <button className="btn btn-primary" style={{ marginTop: 'auto' }} onClick={onNewTransaction}>
        <PlusCircle size={16} />
        Nueva Transacción
      </button>
    </div>
  );
};

export default CategoryDistribution;
