import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

/**
 * TransactionTable — tabla de transacciones con acciones de editar/eliminar.
 *
 * @param {object[]} transactions
 * @param {(tx: object) => void} onEdit
 * @param {(id: string) => void} onDelete
 */
const TransactionTable = ({ transactions, onEdit, onDelete }) => {
  return (
    <div className="transactions-table-container">
      {/* Vista de Escritorio */}
      <div className="transactions-desktop-view">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Descripción</th>
              <th>Categoría</th>
              <th>Cuenta</th>
              <th>Tipo</th>
              <th>Monto</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td style={{ fontWeight: 500 }}>
                  {formatDate(tx.date)}
                </td>
                <td style={{ verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {tx.description || (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 400 }}>Sin título</span>
                      )}
                    </span>
                    {tx.notes && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem', fontWeight: 400 }}>
                        {tx.notes}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <span className="badge badge-neutral">{tx.categoryName}</span>
                </td>
                <td>
                  <span className="badge badge-neutral" style={{ backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', borderColor: 'rgba(99, 102, 241, 0.1)' }}>
                    {tx.accountName || 'Principal'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${tx.type === 'INCOME' ? 'badge-income' : 'badge-expense'}`}>
                    {tx.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                  </span>
                </td>
                <td>
                  <span className={tx.type === 'INCOME' ? 'amount-income' : 'amount-expense'}>
                    {formatCurrency(tx.amount, tx.type === 'INCOME' ? 'income' : 'expense')}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                    <button
                      className="btn-icon"
                      onClick={() => onEdit(tx)}
                      title="Editar transacción"
                      aria-label={`Editar transacción ${tx.description || ''}`}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn-icon btn-icon-danger"
                      onClick={() => onDelete(tx.id)}
                      title="Eliminar transacción"
                      aria-label={`Eliminar transacción ${tx.description || ''}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista de Mobile */}
      <div className="transactions-mobile-view">
        <div className="transactions-mobile-list">
          {transactions.map((tx) => (
            <div key={tx.id} className="transaction-mobile-card">
              <div className="tx-card-header">
                <span className="tx-card-date">{formatDate(tx.date)}</span>
                <span className={`badge ${tx.type === 'INCOME' ? 'badge-income' : 'badge-expense'}`}>
                  {tx.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                </span>
              </div>
              
              <div className="tx-card-body">
                <div className="tx-card-main-info">
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <h4 className="tx-card-description" style={{ margin: 0 }}>
                      {tx.description || (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 400 }}>Sin título</span>
                      )}
                    </h4>
                    {tx.notes && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tx.notes}
                      </span>
                    )}
                  </div>
                  <div className="tx-card-badges">
                    <span className="badge badge-neutral">{tx.categoryName}</span>
                    <span className="badge badge-neutral" style={{ backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', borderColor: 'rgba(99, 102, 241, 0.1)' }}>
                      {tx.accountName || 'Principal'}
                    </span>
                  </div>
                </div>
                
                <div className="tx-card-right-info">
                  <span className={tx.type === 'INCOME' ? 'amount-income' : 'amount-expense'}>
                    {formatCurrency(tx.amount, tx.type === 'INCOME' ? 'income' : 'expense')}
                  </span>
                  <div className="tx-card-actions">
                    <button
                      className="btn-icon"
                      onClick={() => onEdit(tx)}
                      title="Editar"
                      aria-label={`Editar transacción ${tx.description || ''}`}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="btn-icon btn-icon-danger"
                      onClick={() => onDelete(tx.id)}
                      title="Eliminar"
                      aria-label={`Eliminar transacción ${tx.description || ''}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TransactionTable;
