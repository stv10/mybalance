import { useState, useCallback } from 'react';

/**
 * Toast notification hook.
 * Extracted from Dashboard.jsx to make it reusable across any component.
 */
export const useToast = () => {
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' }

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  return { toast, showToast, hideToast };
};
