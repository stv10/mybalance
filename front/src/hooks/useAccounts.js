import { useState, useCallback } from 'react';
import { apiService } from '../services/api';

/**
 * Accounts CRUD hook.
 * Encapsulates all account state and API interactions.
 */
export const useAccounts = (showToast) => {
  const [accounts, setAccounts] = useState([]);

  const loadAccounts = useCallback(async () => {
    const res = await apiService.getAccounts();
    if (res.success) {
      setAccounts(res.data);
    }
  }, []);

  const createAccount = useCallback(async ({ name, balance }) => {
    const res = await apiService.createAccount({ name, balance: Number(balance) });
    if (res.success) {
      showToast('Cuenta creada con éxito', 'success');
      await loadAccounts();
    }
    return res;
  }, [loadAccounts, showToast]);

  const updateAccount = useCallback(async (id, { name, balance }) => {
    const res = await apiService.updateAccount(id, { name, balance: Number(balance) });
    if (res.success) {
      showToast('Cuenta modificada con éxito', 'success');
      await loadAccounts();
    }
    return res;
  }, [loadAccounts, showToast]);

  const deleteAccount = useCallback(async (id, name) => {
    const res = await apiService.deleteAccount(id);
    if (res.success) {
      showToast(`Cuenta "${name}" eliminada correctamente`, 'success');
      await loadAccounts();
    }
    return res;
  }, [loadAccounts, showToast]);

  return {
    accounts,
    setAccounts,
    loadAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  };
};
