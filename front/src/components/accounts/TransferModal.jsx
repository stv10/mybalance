import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeftRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import AmountInput from '../ui/AmountInput';

/**
 * TransferModal — Modal premium para realizar transferencias rápidas entre cuentas.
 * Mantiene su propio estado interno para evitar re-renders costosos.
 */
const TransferModal = React.memo(({ 
  isOpen,
  accounts = [], 
  onClose, 
  onConfirm, 
  isSubmitting 
}) => {
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [error, setError] = useState(null);

  // Inicializar valores por defecto cuando se abre el modal
  useEffect(() => {
    if (isOpen && accounts.length > 0) {
      setError(null);
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      
      // Intentar pre-seleccionar la primera y la segunda cuenta
      setSourceAccountId(accounts[0].id);
      if (accounts.length > 1) {
        setDestinationAccountId(accounts[1].id);
      } else {
        setDestinationAccountId('');
      }
    }
  }, [isOpen, accounts]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (sourceAccountId === destinationAccountId) {
      setError('La cuenta de origen y destino deben ser diferentes.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('El monto a transferir debe ser mayor a cero.');
      return;
    }

    // Validar fondos suficientes (opcional, pero es un buen detalle UX)
    const sourceAcc = accounts.find(a => a.id === sourceAccountId);
    if (sourceAcc && sourceAcc.balance < numAmount) {
      if (!window.confirm(`El monto a transferir excede el saldo actual de "${sourceAcc.name}" (${formatCurrency(sourceAcc.balance)}). ¿Deseas continuar de todas formas?`)) {
        return;
      }
    }

    onConfirm({
      sourceAccountId,
      destinationAccountId,
      amount: numAmount,
      description: description.trim(),
      date
    });
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(5px)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--primary-glow)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <ArrowLeftRight size={20} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Transferencia Rápida</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mover dinero entre tus cuentas</span>
            </div>
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

        {/* Alerta de Error */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
            <span>{error}</span>
          </div>
        )}

        {/* Formulario Modal */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Cuenta Origen */}
          <div className="form-group">
            <label className="form-label" htmlFor="source-account-select" style={{ fontWeight: 600 }}>Cuenta Origen (Debitar)</label>
            <select
              id="source-account-select"
              className="form-input"
              value={sourceAccountId}
              onChange={(e) => setSourceAccountId(e.target.value)}
              style={{ marginTop: '0.4rem', appearance: 'auto', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              required
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (Saldo: {formatCurrency(acc.balance)})
                </option>
              ))}
            </select>
          </div>

          {/* Cuenta Destino */}
          <div className="form-group">
            <label className="form-label" htmlFor="dest-account-select" style={{ fontWeight: 600 }}>Cuenta Destino (Acreditar)</label>
            <select
              id="dest-account-select"
              className="form-input"
              value={destinationAccountId}
              onChange={(e) => setDestinationAccountId(e.target.value)}
              style={{ marginTop: '0.4rem', appearance: 'auto', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              required
            >
              <option value="" disabled>Selecciona cuenta de destino...</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id} disabled={acc.id === sourceAccountId}>
                  {acc.name} (Saldo: {formatCurrency(acc.balance)})
                </option>
              ))}
            </select>
          </div>

          {/* Monto */}
          <div className="form-group">
            <label htmlFor="transferAmountInput" className="form-label" style={{ fontWeight: 600 }}>Monto a Transferir ($)</label>
            <div style={{ marginTop: '0.4rem' }}>
              <AmountInput
                id="transferAmountInput"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Fecha */}
          <div className="form-group">
            <label htmlFor="transferDateInput" className="form-label" style={{ fontWeight: 600 }}>Fecha de la Transferencia</label>
            <div style={{ marginTop: '0.4rem' }}>
              <input
                id="transferDateInput"
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ paddingLeft: '1rem', color: 'var(--text-primary)' }}
                required
              />
            </div>
          </div>

          {/* Descripción Opcional */}
          <div className="form-group">
            <label htmlFor="transferDescInput" className="form-label" style={{ fontWeight: 600 }}>Descripción (Opcional)</label>
            <input
              id="transferDescInput"
              type="text"
              className="form-input"
              placeholder="Ej: Traspaso a ahorros, Pago compartido..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ marginTop: '0.4rem', paddingLeft: '1rem' }}
              maxLength={200}
            />
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
              disabled={isSubmitting || accounts.length < 2}
              style={{ width: 'auto', padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', margin: 0 }} />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <ArrowLeftRight size={16} />
                  <span>Transferir</span>
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

TransferModal.displayName = 'TransferModal';

export default TransferModal;
