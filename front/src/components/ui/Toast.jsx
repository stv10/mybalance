import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';

/**
 * Toast — notificación de feedback contextual.
 *
 * @param {{ message: string, type: 'success' | 'error' } | null} toast
 */
const Toast = ({ toast }) => {
  if (!toast) return null;

  return (
    <div
      className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}
      role="status"
      aria-live="polite"
    >
      {toast.type === 'success'
        ? <CheckCircle size={18} style={{ color: 'var(--success)' }} />
        : <AlertTriangle size={18} style={{ color: 'var(--error)' }} />
      }
      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{toast.message}</span>
    </div>
  );
};

export default Toast;
