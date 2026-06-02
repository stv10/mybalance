import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import BudgetItemRow from './BudgetItemRow';

/**
 * CategoryGroupCard — Contenedor para una categoría base (Vida, Ocio o Inversión-Deuda).
 * Muestra el progreso de asignaciones e items hijos.
 * Optimizado con React.memo.
 */
const CategoryGroupCard = React.memo(({ catName, data, onGoToConfig, onPay, onUnpay }) => {
  // Calcular cuánto se ha gastado realmente bajo esta categoría base
  const spentInCat = data.items
    .reduce((sum, i) => {
      if (i.categoryName?.toLowerCase() === 'comida' || i.paid) {
        return sum + (i.paidAmount || 0);
      }
      return sum;
    }, 0);

  const isCatExceeded = spentInCat > data.maxLimit;
  const catProgress = data.maxLimit > 0 ? (spentInCat / data.maxLimit) * 100 : 0;

  return (
    <div className="card glass-container" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
      {/* Encabezado de la Categoría Base */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid var(--border-color)', 
        paddingBottom: '1rem', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>{catName}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Límite asignado: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(data.maxLimit)}</strong> ({data.percent}%)
          </p>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Gastado:</span>
          <span style={{ 
            fontSize: '1.2rem', 
            fontWeight: 800, 
            color: isCatExceeded ? 'var(--error)' : 'var(--success)' 
          }}>
            {formatCurrency(spentInCat)}
          </span>
        </div>
      </div>

      {/* Barra de Progreso de Categoría */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem', fontWeight: 600 }}>
          <span style={{ color: 'var(--text-muted)' }}>Ejecución del límite sugerido</span>
          <span style={{ color: isCatExceeded ? 'var(--error)' : 'var(--success)' }}>{catProgress.toFixed(1)}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '100px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${Math.min(catProgress, 100)}%`, 
            height: '100%', 
            backgroundColor: isCatExceeded ? 'var(--error)' : 'var(--success)',
            borderRadius: '100px',
            transition: 'width 0.6s ease'
          }} />
        </div>
        
        {/* Alerta de Sobre-presupuesto */}
        {isCatExceeded && (
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.25rem', 
            fontSize: '0.75rem', 
            color: 'var(--error)', 
            fontWeight: 700, 
            marginTop: '0.5rem' 
          }}>
            ⚠️ Excede límite en {formatCurrency(spentInCat - data.maxLimit)}
          </span>
        )}
      </div>

      {/* LISTADO DE ÍTEMS BAJO ESTA CATEGORÍA */}
      {data.items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          <p style={{ fontStyle: 'italic' }}>No hay ítems configurados bajo {catName} para este mes.</p>
          <button 
            className="btn btn-secondary" 
            onClick={onGoToConfig}
            style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.8rem', marginTop: '0.75rem' }}
          >
            Configurar en la Plantilla
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {data.items.map(item => (
            <BudgetItemRow 
              key={item.id} 
              item={item} 
              onPay={onPay} 
              onUnpay={onUnpay} 
            />
          ))}
        </div>
      )}
    </div>
  );
});

CategoryGroupCard.displayName = 'CategoryGroupCard';

export default CategoryGroupCard;
