import { useState, useCallback } from 'react';
import { apiService } from '../services/api';

/**
 * Transactions CRUD hook.
 * Encapsulates all transaction state and API interactions.
 */
export const useTransactions = (showToast) => {
  const [transactions, setTransactions] = useState([]);

  const loadTransactions = useCallback(async () => {
    const txRes = await apiService.getTransactions();
    if (txRes.success) {
      setTransactions(txRes.data);
    }
  }, []);

  const createTransaction = useCallback(async (payload) => {
    const response = await apiService.createTransaction(payload);
    if (response.success) {
      showToast('Transacción creada correctamente', 'success');
      await loadTransactions();
    }
    return response;
  }, [loadTransactions, showToast]);

  const updateTransaction = useCallback(async (id, payload) => {
    const response = await apiService.updateTransaction(id, payload);
    if (response.success) {
      showToast('Transacción modificada correctamente', 'success');
      await loadTransactions();
    }
    return response;
  }, [loadTransactions, showToast]);

  const deleteTransaction = useCallback(async (id) => {
    const response = await apiService.deleteTransaction(id);
    if (response.success) {
      showToast('Transacción eliminada correctamente', 'success');
      await loadTransactions();
    }
    return response;
  }, [loadTransactions, showToast]);

  return {
    transactions,
    setTransactions,
    loadTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
};
