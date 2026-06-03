import React, { useState } from 'react';
import { CreditCard, Edit2, Trash2, AlertCircle, ArrowLeftRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import AmountInput from '../../components/ui/AmountInput';
import TransferModal from '../../components/accounts/TransferModal';

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)', // Indigo-Blue
  'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Emerald
  'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', // Violet-Pink
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', // Amber
];

/**
 * AccountsTab — Pestaña premium para gestionar las cuentas del usuario.
 */
const AccountsTab = ({ accounts, onCreateAccount, onUpdateAccount, onDeleteAccount, onTransfer }) => {
  const [formData, setFormData] = useState({ name: '', balance: '' });
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isTransferSubmitting, setIsTransferSubmitting] = useState(false);

  const handleTransferConfirm = async (transferData) => {
    setIsTransferSubmitting(true);
    try {
      if (onTransfer) {
        await onTransfer(transferData);
        setIsTransferModalOpen(false);
      }
    } catch {
      // Errores gestionados por el parent y mostrados vía toast
    } finally {
      setIsTransferSubmitting(false);
    }
  };

  const handleEditClick = (account) => {
    setEditingId(account.id);
    setFormData({ name: account.name, balance: account.balance.toString() });
    setErrors({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: '', balance: '' });
    setErrors({});
  };

  const handleInputChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'El nombre de la cuenta es obligatorio';
    } else if (formData.name.trim().length > 100) {
      errs.name = 'El nombre no debe exceder los 100 caracteres';
    }

    if (formData.balance === '' || isNaN(formData.balance)) {
      errs.balance = 'El saldo debe ser un número válido';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await onUpdateAccount(editingId, {
          name: formData.name.trim(),
          balance: parseFloat(formData.balance),
        });
      } else {
        await onCreateAccount({
          name: formData.name.trim(),
          balance: parseFloat(formData.balance),
        });
      }
      handleCancel();
    } catch {
      // Errores gestionados por el hook global y mostrados vía Toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="accounts-tab-container animate-fade-in" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      {/* List of accounts on the left */}
      <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Mis Cuentas</h2>
            {accounts.length > 1 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsTransferModalOpen(true)}
                style={{
                  width: 'auto',
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 600
                }}
              >
                <ArrowLeftRight size={14} />
                <span>Transferencia Rápida</span>
              </button>
            )}
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {accounts.length} {accounts.length === 1 ? 'cuenta activa' : 'cuentas activas'}
          </span>
        </div>

        <div className="accounts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {accounts.map((acc, idx) => {
            const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
            return (
              <div
                key={acc.id}
                className="account-card"
                style={{
                  background: gradient,
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.75rem',
                  color: '#ffffff',
                  boxShadow: 'var(--shadow-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '180px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Visual card chip & credit card layout */}
                <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.1, transform: 'translate(10%, -10%)', pointerEvents: 'none' }}>
                  <CreditCard size={150} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8, fontWeight: 600 }}>
                      Cuenta
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.1rem', color: '#ffffff' }}>
                      {acc.name}
                    </h3>
                  </div>
                  <CreditCard size={24} style={{ opacity: 0.8 }} />
                </div>

                <div style={{ margin: '1.5rem 0 0.5rem 0', zIndex: 1 }}>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Saldo Disponible</span>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                    {formatCurrency(acc.balance)}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1, borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>
                    Creada: {acc.createdAt ? formatDate(acc.createdAt.split('T')[0]) : '---'}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn-icon"
                      onClick={() => handleEditClick(acc)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.35rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Editar cuenta"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => onDeleteAccount(acc.id, acc.name)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.25)',
                        color: '#ff8a8a',
                        border: 'none',
                        padding: '0.35rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Eliminar cuenta"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Informative Alert about Constraints */}
        <div
          className="alert"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-secondary)',
            marginTop: '1rem',
            padding: '1rem 1.25rem',
            border: '1px solid var(--border-color)',
          }}
        >
          <AlertCircle size={20} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
            <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Reglas de Negocio de Cuentas:</strong>
            <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
              <li>Las transacciones están vinculadas obligatoriamente a una cuenta.</li>
              <li>No se pueden transferir movimientos entre cuentas directamente (el backend lo prohíbe para asegurar la consistencia; debes borrar y recrear la transacción en caso de error).</li>
              <li>Una cuenta no podrá ser eliminada si tiene transacciones registradas de forma activa.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Account form on the right */}
      <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          {editingId ? 'Modificar Cuenta' : 'Nueva Cuenta'}
        </h2>
        <div className="card" style={{ padding: '2rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="account-name">Nombre de la Cuenta</label>
              <input
                id="account-name"
                type="text"
                className={`form-input ${errors.name ? 'error-border' : ''}`}
                style={{ paddingLeft: '1rem' }}
                placeholder="Ej. Banco Galicia, MercadoPago, Efectivo..."
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={isSubmitting}
                maxLength={100}
              />
              {errors.name && (
                <span style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: '0.25rem', display: 'block' }}>
                  {errors.name}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="account-balance">
                {editingId ? 'Saldo Actual ($)' : 'Saldo Inicial ($)'}
              </label>
              <AmountInput
                id="account-balance"
                value={formData.balance}
                onChange={(e) => handleInputChange('balance', e.target.value)}
                disabled={isSubmitting}
                error={!!errors.balance}
                placeholder="0.00"
              />
              {errors.balance && (
                <span style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: '0.25rem', display: 'block' }}>
                  {errors.balance}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancel}
                  style={{ flex: 1, padding: '0.75rem' }}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2, padding: '0.75rem' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : editingId ? 'Guardar' : 'Crear Cuenta'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* Modal de Transferencia Rápida */}
      <TransferModal
        isOpen={isTransferModalOpen}
        accounts={accounts}
        onClose={() => setIsTransferModalOpen(false)}
        onConfirm={handleTransferConfirm}
        isSubmitting={isTransferSubmitting}
      />
    </div>
  );
};
 
export default AccountsTab;
