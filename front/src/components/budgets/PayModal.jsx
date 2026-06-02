import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import AmountInput from '../ui/AmountInput';

/**
 * PayModal — Modal encapsulado para registrar el pago de un ítem de presupuesto.
 * Mantiene su propio estado interno para evitar re-renders costosos en el padre.
 */
const PayModal = React.memo(({ 
  payingItem, 
  accounts = [], 
  onClose, 
  onConfirm, 
  isSubmitting 
}) => {
  const [payAccountId, setPayAccountId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Inicializar valores por defecto cuando se abre el modal para un ítem
  useEffect(() => {
    if (payingItem) {
      setPayAmount(payingItem.amountLimit?.toString() || '');
      setPayDate(new Date().toISOString().split('T')[0]);
      
      if (accounts.length > 0) {
        const principal = accounts.find(a => a.name.toLowerCase().includes('principal'));
        setPayAccountId(principal ? principal.id : accounts[0].id);
      } else {
        setPayAccountId('');
      }
    }
  }, [payingItem, accounts]);

  if (!payingItem) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      itemId: payingItem.id,
      accountId: payAccountId,
      amount: parseFloat(payAmount),
      date: payDate
    });
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }} className="animate-fade-in">
      
      <div className="card glass-container animate-scale-up" style={{ 
        width: '100%', 
        maxWidth: '480px', 
        padding: '2rem', 
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-primary)'
      }}>
        
        {/* Encabezado Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Registrar Pago</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ítem: <strong>{payingItem.name}</strong></span>
          </div>
          <button 
            type="button"
            className="btn-icon" 
            onClick={onClose} 
            style={{ padding: '0.35rem' }}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario Modal */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Selector de Cuenta */}
          <div className="form-group">
            <label className="form-label" htmlFor="pay-account-select" style={{ fontWeight: 600 }}>Debitar de la Cuenta</label>
            {accounts.length === 0 ? (
              <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '0.25rem' }}>No tienes cuentas registradas. Crea una cuenta primero.</p>
            ) : (
              <select
                id="pay-account-select"
                className="form-input"
                value={payAccountId}
                onChange={(e) => setPayAccountId(e.target.value)}
                style={{ marginTop: '0.4rem', appearance: 'auto', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                required
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (Saldo: {formatCurrency(acc.balance)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Monto Real (Editable) */}
          <div className="form-group">
            <label htmlFor="payAmountInput" className="form-label" style={{ fontWeight: 600 }}>Monto Real a Pagar ($)</label>
            <div style={{ marginTop: '0.4rem' }}>
              <AmountInput
                id="payAmountInput"
                placeholder="0.00"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
              />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
              Prefill sugerido por el límite del plan: <strong>{formatCurrency(payingItem.amountLimit)}</strong>
            </span>
          </div>

          {/* Fecha de Pago */}
          <div className="form-group">
            <label htmlFor="payDateInput" className="form-label" style={{ fontWeight: 600 }}>Fecha de la Transacción</label>
            <div style={{ marginTop: '0.4rem', position: 'relative' }}>
              <input
                id="payDateInput"
                type="date"
                className="form-input"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                style={{ paddingLeft: '1rem', color: 'var(--text-primary)' }}
                required
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ width: 'auto', padding: '0.6rem 1.5rem' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || accounts.length === 0}
              style={{ width: 'auto', padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', margin: 0 }} />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <DollarSign size={16} />
                  <span>Confirmar Pago</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>,
    document.body
  );
});

PayModal.displayName = 'PayModal';

export default PayModal;
