import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { X } from 'lucide-react';

/**
 * ConfirmDialog — modal de confirmación estilizado.
 * Reemplaza window.confirm() en acciones destructivas.
 *
 * @param {boolean} isOpen
 * @param {string} title
 * @param {string} message
 * @param {string} confirmLabel
 * @param {() => void} onConfirm
 * @param {() => void} onCancel
 */
const ConfirmDialog = ({
  isOpen,
  title = '¿Confirmar acción?',
  message,
  confirmLabel = 'Eliminar',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div className="modal-card animate-fade-in" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h3 className="modal-title" id="confirm-dialog-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} style={{ color: 'var(--error)' }} />
            {title}
          </h3>
          <button className="modal-close-btn" onClick={onCancel} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            style={{ width: 'auto' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn"
            onClick={onConfirm}
            style={{
              width: 'auto',
              backgroundColor: 'var(--error)',
              color: '#fff',
              border: 'none',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmDialog;
