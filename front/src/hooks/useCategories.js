import { useState, useCallback } from 'react';
import { apiService } from '../services/api';

/**
 * Categories CRUD hook.
 * Encapsulates all category state and API interactions.
 */
export const useCategories = (showToast) => {
  const [categories, setCategories] = useState([]);

  const loadCategories = useCallback(async () => {
    const catRes = await apiService.getCategories();
    if (catRes.success) {
      setCategories(catRes.data);
    }
  }, []);

  const createCategory = useCallback(async ({ name, type, parentCategoryId }) => {
    const res = await apiService.createCategory({ name, type, parentCategoryId });
    if (res.success) {
      showToast('Categoría personalizada creada con éxito', 'success');
      await loadCategories();
    }
    return res;
  }, [loadCategories, showToast]);

  const deleteCategory = useCallback(async (id, name) => {
    const res = await apiService.deleteCategory(id);
    if (res.success) {
      showToast(`Categoría "${name}" eliminada correctamente`, 'success');
      await loadCategories();
    }
    return res;
  }, [loadCategories, showToast]);

  return {
    categories,
    setCategories,
    loadCategories,
    createCategory,
    deleteCategory,
  };
};
