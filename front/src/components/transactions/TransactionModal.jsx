import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import SegmentedControl from '../ui/SegmentedControl';
import { formatCurrency } from '../../utils/formatters';
import AmountInput from '../ui/AmountInput';
import DatePicker from '../ui/DatePicker';

const TX_TYPE_OPTIONS = [
  { value: 'EXPENSE', label: 'Gasto (-)' },
  { value: 'INCOME', label: 'Ingreso (+)' },
];

/**
 * TransactionModal — modal de creación/edición de transacciones.
 */
const TransactionModal = ({
  isOpen,
  txEditing,
  formData,
  formErrors,
  isSaving,
  categories,
  accounts = [],
  onFormChange,
  onTypeChange,
  onSubmit,
  onClose,
}) => {
  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === formData.type);

  return createPortal(
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="tx-modal-title">
      <div className="modal-card animate-fade-in">
        <div className="modal-header">
          <h3 className="modal-title" id="tx-modal-title">
            {txEditing ? 'Editar Movimiento' : 'Crear Movimiento'}
          </h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="modal-body">
            {/* Transaction Type */}
            <div className="form-group">
              <label className="form-label">Tipo de Transacción</label>
              <SegmentedControl
                options={TX_TYPE_OPTIONS}
                value={formData.type}
                onChange={onTypeChange}
                disabled={isSaving}
              />
            </div>

            {/* Amount */}
            <div className="form-group">
              <label className="form-label">Monto ($)</label>
              <AmountInput
                value={formData.amount}
                onChange={(e) => onFormChange({ amount: e.target.value })}
                disabled={isSaving}
                error={!!formErrors.amount}
                placeholder="0.00"
              />
              {formErrors.amount && (
                <span style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: '0.25rem', display: 'block' }}>
                  {formErrors.amount}
                </span>
              )}
            </div>

            {/* Account Selection */}
            <div className="form-group">
              <label className="form-label">Cuenta</label>
              {txEditing ? (
                <div>
                  <select
                    className="form-select"
                    value={formData.accountId || ''}
                    disabled={true}
                    style={{ opacity: 0.75, cursor: 'not-allowed' }}
                  >
                    <option value={formData.accountId || ''}>
                      {accounts.find((a) => a.id === formData.accountId)?.name || 'Cuenta Vinculada'}
                    </option>
                  </select>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    No se permite cambiar la cuenta de un movimiento guardado.
                  </span>
                </div>
              ) : (
                <select
                  className={`form-select ${formErrors.accountId ? 'error-border' : ''}`}
                  value={formData.accountId || ''}
                  onChange={(e) => onFormChange({ accountId: e.target.value })}
                  disabled={isSaving}
                >
                  <option value="">Selecciona una cuenta</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(acc.balance)})
                    </option>
                  ))}
                </select>
              )}
              {formErrors.accountId && (
                <span style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: '0.25rem', display: 'block' }}>
                  {formErrors.accountId}
                </span>
              )}
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select
                className={`form-select ${formErrors.categoryId ? 'error-border' : ''}`}
                value={formData.categoryId}
                onChange={(e) => onFormChange({ categoryId: e.target.value })}
                disabled={isSaving}
              >
                {filteredCategories.length === 0 ? (
                  <option value="">No hay categorías de este tipo. Créalas en Ajustes.</option>
                ) : (
                  filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))
                )}
              </select>
              {formErrors.categoryId && (
                <span style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: '0.25rem', display: 'block' }}>
                  {formErrors.categoryId}
                </span>
              )}
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label">Fecha</label>
              <DatePicker
                value={formData.date}
                onChange={(e) => onFormChange({ date: e.target.value })}
                disabled={isSaving}
                error={!!formErrors.date}
              />
              {formErrors.date && (
                <span style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: '0.25rem', display: 'block' }}>
                  {formErrors.date}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Descripción / Comentario</label>
              <textarea
                placeholder="Ej: Compra mensual supermercado, Pago consultoría..."
                className="form-textarea"
                value={formData.description}
                onChange={(e) => onFormChange({ description: e.target.value })}
                maxLength={255}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ width: 'auto' }}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
              style={{ width: 'auto' }}
            >
              {isSaving ? 'Guardando...' : txEditing ? 'Modificar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default TransactionModal;
