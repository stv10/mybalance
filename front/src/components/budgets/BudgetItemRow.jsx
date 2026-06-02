import React from 'react';
import { Calendar, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

const getDueDateStatus = (dueDateString) => {
  if (!dueDateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(`${dueDateString}T00:00:00`);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'overdue', label: 'Vencido', days: Math.abs(diffDays) };
  } else if (diffDays === 0) {
    return { status: 'today', label: 'Vence hoy', days: 0 };
  } else if (diffDays <= 3) {
    return { status: 'near', label: `Vence en ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`, days: diffDays };
  } else {
    return { status: 'future', label: `Vence el ${formatDate(dueDateString)}`, days: diffDays };
  }
};

/**
 * BudgetItemRow — Fila individual para un ítem del presupuesto.
 * Aislada y optimizada con React.memo.
 */
const BudgetItemRow = React.memo(({ item, onPay, onUnpay }) => {
  const isComida = item.categoryName?.toLowerCase() === 'comida';
  const isComidaExceeded = isComida && (item.paidAmount || 0) > (item.amountLimit || 0);

  const dateStatus = getDueDateStatus(item.dueDate);
  const itemBorderLeft = isComidaExceeded
    ? '4px solid var(--error)'
    : !item.paid && dateStatus && (dateStatus.status === 'overdue' || dateStatus.status === 'today')
      ? '4px solid var(--error)'
      : !item.paid && dateStatus && dateStatus.status === 'near'
        ? '4px solid #f59e0b'
        : `1px solid ${item.paid ? 'rgba(34, 197, 94, 0.2)' : 'var(--border-color)'}`;

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '1rem', 
      borderRadius: 'var(--radius-md)', 
      backgroundColor: isComida
        ? 'var(--bg-primary)'
        : item.paid 
          ? 'rgba(34, 197, 94, 0.04)' 
          : 'var(--bg-primary)',
      border: `1px solid ${item.paid ? 'rgba(34, 197, 94, 0.2)' : 'var(--border-color)'}`,
      borderLeft: itemBorderLeft,
      flexWrap: 'wrap',
      gap: '1rem',
      transition: 'all 0.2s ease'
    }}>
      {/* Detalles del Ítem */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: '1 1 250px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{item.name}</span>
          {isComida ? (
            <span style={{ 
              fontSize: '0.7rem', 
              fontWeight: 700, 
              padding: '0.15rem 0.5rem', 
              borderRadius: '100px', 
              backgroundColor: 'var(--primary-glow)',
              color: 'var(--primary)',
              textTransform: 'uppercase'
            }}>
              Acumulativo
            </span>
          ) : (
            <span style={{ 
              fontSize: '0.7rem', 
              fontWeight: 700, 
              padding: '0.15rem 0.5rem', 
              borderRadius: '100px', 
              backgroundColor: item.paid ? 'var(--success-glow)' : 'var(--border-color)',
              color: item.paid ? 'var(--success)' : 'var(--text-secondary)',
              textTransform: 'uppercase'
            }}>
              {item.paid ? 'Pagado' : 'Pendiente'}
            </span>
          )}
          {!isComida && !item.paid && dateStatus && (
            <span style={{ 
              fontSize: '0.7rem', 
              fontWeight: 700, 
              padding: '0.15rem 0.5rem', 
              borderRadius: '100px', 
              backgroundColor: dateStatus.status === 'overdue' || dateStatus.status === 'today'
                ? 'var(--error-glow)' 
                : dateStatus.status === 'near' 
                  ? 'rgba(245, 158, 11, 0.1)' 
                  : 'var(--border-color)',
              color: dateStatus.status === 'overdue' || dateStatus.status === 'today'
                ? 'var(--error)' 
                : dateStatus.status === 'near' 
                  ? '#d97706' 
                  : 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <Calendar size={10} />
              <span>{dateStatus.label}</span>
            </span>
          )}
        </div>
        
        {isComida ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Consumido: <strong style={{ color: isComidaExceeded ? 'var(--error)' : 'var(--success)' }}>{formatCurrency(item.paidAmount || 0)}</strong> de <strong>{formatCurrency(item.amountLimit)}</strong>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '80%', maxWidth: '260px' }}>
              <div style={{ flex: 1, height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${Math.min(((item.paidAmount || 0) / (item.amountLimit || 1)) * 100, 100)}%`, 
                  height: '100%', 
                  backgroundColor: isComidaExceeded ? 'var(--error)' : 'var(--success)',
                  borderRadius: '100px',
                  transition: 'width 0.6s ease'
                }} />
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {(((item.paidAmount || 0) / (item.amountLimit || 1)) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ) : item.paid ? (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Abonado: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(item.paidAmount)}</strong> desde cuenta <strong>{item.accountName}</strong>
          </span>
        ) : (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
            <span>Límite sugerido: <strong>{formatCurrency(item.amountLimit)}</strong></span>
            {item.dueDate && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Fecha límite: <strong>{formatDate(item.dueDate)}</strong>
              </span>
            )}
          </span>
        )}
      </div>

      {/* Montos y Acciones */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {isComida ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              {isComidaExceeded ? 'Excedido' : 'Remanente'}
            </span>
            <span style={{ 
              fontSize: '1.15rem', 
              fontWeight: 800, 
              color: isComidaExceeded ? 'var(--error)' : 'var(--success)' 
            }}>
              {isComidaExceeded 
                ? formatCurrency((item.paidAmount || 0) - (item.amountLimit || 0)) 
                : formatCurrency((item.amountLimit || 0) - (item.paidAmount || 0))}
            </span>
          </div>
        ) : !item.paid ? (
          <button
            className="btn btn-primary"
            onClick={() => onPay(item)}
            style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <span>Pagar</span>
            <ArrowRight size={14} />
          </button>
        ) : (
          <button
            className="btn btn-secondary"
            onClick={() => onUnpay(item)}
            style={{ 
              width: 'auto', 
              padding: '0.5rem 1rem', 
              fontSize: '0.85rem', 
              fontWeight: 600, 
              borderColor: 'var(--error)', 
              color: 'var(--error)', 
              backgroundColor: 'transparent' 
            }}
          >
            <span>Desmarcar</span>
          </button>
        )}
      </div>
    </div>
  );
});

BudgetItemRow.displayName = 'BudgetItemRow';

export default BudgetItemRow;
