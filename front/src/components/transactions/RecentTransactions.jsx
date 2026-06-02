import React from 'react';
import { TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

/**
 * RecentTransactions — listado de los últimos N movimientos del mes.
 *
 * @param {object[]} transactions
 * @param {number} limit
 * @param {() => void} onViewAll
 */
const RecentTransactions = ({ transactions, limit = 5, onViewAll }) => {
  const items = transactions.slice(0, limit);

  return (
    <div className="recent-transactions-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem' }}>Movimientos Recientes</h3>
        <button
          onClick={onViewAll}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          Ver todos <ArrowRightLeft size={12} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            No hay movimientos registrados en este mes.
          </div>
        ) : (
          items.map((tx) => (
            <div className="recent-transaction-row" key={tx.id}>
              <div className="recent-transaction-left">
                <div
                  className="recent-transaction-icon"
                  style={{
                    backgroundColor: tx.type === 'INCOME' ? 'var(--success-glow)' : 'rgba(239, 68, 68, 0.08)',
                    color: tx.type === 'INCOME' ? 'var(--success)' : 'var(--error)',
                  }}
                >
                  {tx.type === 'INCOME' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </div>
                <div className="recent-transaction-info">
                  <span className="recent-transaction-desc">{tx.description || 'Sin descripción'}</span>
                  <span className="recent-transaction-meta">
                    <span className="badge badge-neutral" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', marginRight: '0.35rem' }}>
                      {tx.categoryName}
                    </span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', marginRight: '0.5rem', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', borderColor: 'rgba(99, 102, 241, 0.1)' }}>
                      {tx.accountName || 'Principal'}
                    </span>
                    {formatDate(tx.date, { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
              <div className="recent-transaction-right">
                <span className={tx.type === 'INCOME' ? 'amount-income' : 'amount-expense'}>
                  {formatCurrency(tx.amount, tx.type === 'INCOME' ? 'income' : 'expense')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;
