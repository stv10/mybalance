import React, { useState, useMemo, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import SegmentedControl from '../ui/SegmentedControl';

const TYPE_OPTIONS = [
  { value: 'EXPENSE', label: 'Gastos (-)' },
  { value: 'INCOME', label: 'Ingresos (+)' },
];

/**
 * CategoryForm — formulario para crear una nueva categoría personalizada.
 */
const CategoryForm = ({ categories = [], onCreate }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filtrar posibles categorías padre: del mismo tipo y que no superen los 2 niveles de anidación.
  // Esto significa que su propio padre (si lo tiene) no debe tener padre (el abuelo debe ser nulo).
  const potentialParents = useMemo(() => {
    return categories.filter((cat) => {
      if (cat.type !== type) return false;
      if (!cat.parentCategoryId) return true; // Las categorías raíz siempre pueden ser padres
      
      const parentCat = categories.find(p => p.id === cat.parentCategoryId);
      return !parentCat || !parentCat.parentCategoryId; // El padre no debe tener padre
    });
  }, [categories, type]);

  // Limpiar selección de padre al cambiar tipo
  useEffect(() => {
    setParentCategoryId('');
  }, [type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError('El nombre de la categoría es obligatorio');
      return;
    }

    const exists = categories.some(
      (cat) => cat.name.toLowerCase() === trimmed.toLowerCase() && cat.type === type
    );
    if (exists) {
      setError(`Ya existe una categoría de tipo ${type === 'INCOME' ? 'Ingreso' : 'Gasto'} llamada "${trimmed}"`);
      return;
    }

    setIsSaving(true);
    try {
      await onCreate({ 
        name: trimmed, 
        type, 
        parentCategoryId: parentCategoryId || null 
      });
      setName('');
      setParentCategoryId('');
    } catch (err) {
      setError(err.message || 'No se pudo crear la categoría');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-card animate-fade-in">
      <h3 className="settings-card-title">Nueva Categoría</h3>
      <p className="settings-card-description">
        Crea categorías de flujo de caja personalizadas para tus transacciones.
      </p>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
          <AlertTriangle className="alert-icon" size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="cat-name-input">Nombre de Categoría</label>
          <input
            id="cat-name-input"
            type="text"
            className="form-input"
            placeholder="Ej: Gasolina, Freelance, Cine..."
            style={{ paddingLeft: '1rem' }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSaving}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Tipo de Flujo</label>
          <SegmentedControl
            options={TYPE_OPTIONS}
            value={type}
            onChange={setType}
            disabled={isSaving}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="cat-parent-select">Categoría Padre (Opcional)</label>
          <select
            id="cat-parent-select"
            className="form-input"
            value={parentCategoryId}
            onChange={(e) => setParentCategoryId(e.target.value)}
            disabled={isSaving}
            style={{ paddingLeft: '1rem', appearance: 'auto', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          >
            <option value="">Ninguna (Es una categoría raíz)</option>
            {potentialParents.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ marginTop: '0.5rem' }}>
          {isSaving ? 'Guardando...' : 'Crear Categoría'}
        </button>
      </form>
    </div>
  );
};

export default CategoryForm;
