import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Save, AlertTriangle, Plus } from 'lucide-react';
import AmountInput from '../ui/AmountInput';
import { formatCurrency } from '../../utils/formatters';
import ConsistencyIndicators from './ConsistencyIndicators';
import BudgetItemConfigRow from './BudgetItemConfigRow';

/**
 * BudgetModelConfig — Ajuste de plantilla y distribución de límites.
 * Refactorizado en subcomponentes pequeños y optimizado bajo Vercel React Best Practices.
 */
const BudgetModelConfig = ({ categories = [], initialModel, onSave, isSaving }) => {
  // Helper para verificar recursivamente la jerarquía de categorías
  const isOrInheritsFrom = useCallback((cat, targetName) => {
    let current = cat;
    while (current) {
      if (current.name?.toLowerCase() === targetName.toLowerCase()) {
        return true;
      }
      if (!current.parentCategoryId) {
        break;
      }
      current = categories.find(c => c.id === current.parentCategoryId);
    }
    return false;
  }, [categories]);

  // Las categorías permitidas para presupuesto: de tipo EXPENSE que sean o hereden de Vida, Ocio o Inversion-Deuda
  const baseCategories = useMemo(() => {
    return categories.filter(cat => 
      cat.type === 'EXPENSE' && 
      (isOrInheritsFrom(cat, 'Vida') || 
       isOrInheritsFrom(cat, 'Ocio') || 
       isOrInheritsFrom(cat, 'Inversion-Deuda'))
    );
  }, [categories, isOrInheritsFrom]);

  // Estados del formulario
  const [globalLimit, setGlobalLimit] = useState('');
  const [percentVida, setPercentVida] = useState('50');
  const [percentOcio, setPercentOcio] = useState('30');
  const [percentInversionDeuda, setPercentInversionDeuda] = useState('20');
  
  // Estado para la lista dinámica de ítems
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  // Sincronizar datos al recibir initialModel
  useEffect(() => {
    if (initialModel) {
      setGlobalLimit(initialModel.totalLimit?.toString() || '');
      setPercentVida(initialModel.percentVida?.toString() || '50');
      setPercentOcio(initialModel.percentOcio?.toString() || '30');
      setPercentInversionDeuda(initialModel.percentInversionDeuda?.toString() || '20');

      if (initialModel.items && initialModel.items.length > 0) {
        setItems(initialModel.items.map(item => ({
          id: item.id || Math.random().toString(),
          name: item.name || '',
          categoryId: item.categoryId || '',
          amountLimit: item.amountLimit?.toString() || '',
          dueDay: item.dueDay?.toString() || ''
        })));
      } else {
        setItems([]);
      }
    }
  }, [initialModel]);

  // Asegurar que haya al menos una categoría seleccionable por defecto al agregar ítems
  const defaultCategoryId = useMemo(() => {
    return baseCategories[0]?.id || '';
  }, [baseCategories]);

  // Cálculos dinámicos
  const limitValue = Number(globalLimit) || 0;
  const pVida = Number(percentVida) || 0;
  const pOcio = Number(percentOcio) || 0;
  const pInv = Number(percentInversionDeuda) || 0;

  const totalPercent = pVida + pOcio + pInv;
  const isPercentValid = totalPercent === 100;

  const maxVida = (limitValue * pVida) / 100;
  const maxOcio = (limitValue * pOcio) / 100;
  const maxInv = (limitValue * pInv) / 100;

  // Totales de ítems agrupados por categoría base
  const { sumVida, sumOcio, sumInv } = useMemo(() => {
    let sv = 0, so = 0, si = 0;
    items.forEach(item => {
      const amt = Number(item.amountLimit) || 0;
      const cat = baseCategories.find(c => c.id === item.categoryId);
      if (cat) {
        if (isOrInheritsFrom(cat, 'Vida')) sv += amt;
        else if (isOrInheritsFrom(cat, 'Ocio')) so += amt;
        else if (isOrInheritsFrom(cat, 'Inversion-Deuda')) si += amt;
      }
    });
    return { sumVida: sv, sumOcio: so, sumInv: si };
  }, [items, baseCategories, isOrInheritsFrom]);

  // Advertencias de límites
  const warningVida = sumVida > maxVida;
  const warningOcio = sumOcio > maxOcio;
  const warningInv = sumInv > maxInv;

  // Acciones en la lista de ítems estables con useCallback
  const handleAddItem = useCallback(() => {
    setItems(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        name: '',
        categoryId: defaultCategoryId,
        amountLimit: '',
        dueDay: ''
      }
    ]);
  }, [defaultCategoryId]);

  const handleRemoveItem = useCallback((id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleUpdateItem = useCallback((id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  }, []);

  // Enviar formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!isPercentValid) {
      setError(`La suma de los porcentajes debe ser exactamente 100% (Actualmente: ${totalPercent}%). Ajusta la distribución.`);
      return;
    }

    const filteredItems = items
      .filter(item => item.name.trim() !== '' && Number(item.amountLimit) > 0)
      .map(item => ({
        name: item.name.trim(),
        categoryId: item.categoryId,
        amountLimit: parseFloat(item.amountLimit),
        dueDay: item.dueDay ? parseInt(item.dueDay, 10) : null
      }));

    onSave({
      totalLimit: limitValue,
      percentVida: pVida,
      percentOcio: pOcio,
      percentInversionDeuda: pInv,
      items: filteredItems
    });
  };

  return (
    <form onSubmit={handleSubmit} className="budget-model-config animate-fade-in" style={{ display: 'grid', gap: '2rem' }}>
      
      {error && (
        <div className="alert alert-error animate-fade-in" style={{ padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <AlertTriangle size={20} />
          <div>
            <h4 style={{ margin: 0, fontWeight: 700 }}>Distribución Inválida</h4>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>{error}</p>
          </div>
        </div>
      )}

      {/* SECCIÓN 1: LÍMITE GLOBAL */}
      <div className="card glass-container" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Meta Global de Gastos</span>
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.925rem', lineHeight: '1.5' }}>
          Define el presupuesto total mensual disponible. Este monto servirá de base para distribuir tus gastos utilizando la regla de consistencia 50/30/20.
        </p>

        <div className="form-group" style={{ maxWidth: '320px' }}>
          <label htmlFor="globalLimitInput" className="form-label" style={{ fontWeight: 600 }}>Límite Total Mensual ($)</label>
          <div style={{ marginTop: '0.5rem' }}>
            <AmountInput
              id="globalLimitInput"
              placeholder="Ej: 1500.00"
              value={globalLimit}
              onChange={(e) => setGlobalLimit(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: DISTRIBUCIÓN POR CATEGORÍAS */}
      <div className="card glass-container" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
          Distribución de Categorías
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.925rem', lineHeight: '1.5' }}>
          Asigna porcentajes a cada una de tus tres categorías base de egresos. La suma de estos porcentajes debe ser exactamente <strong>100%</strong>.
        </p>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          {/* Vida */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label htmlFor="percentVidaInput" className="form-label" style={{ fontWeight: 600 }}>Vida (Necesidades)</label>
              <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700 }}>{formatCurrency(maxVida)}</span>
            </div>
            <input
              id="percentVidaInput"
              type="number"
              className="form-input"
              value={percentVida}
              onChange={(e) => setPercentVida(e.target.value)}
              min="0"
              max="100"
              required
            />
          </div>

          {/* Ocio */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label htmlFor="percentOcioInput" className="form-label" style={{ fontWeight: 600 }}>Ocio (Gustos)</label>
              <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700 }}>{formatCurrency(maxOcio)}</span>
            </div>
            <input
              id="percentOcioInput"
              type="number"
              className="form-input"
              value={percentOcio}
              onChange={(e) => setPercentOcio(e.target.value)}
              min="0"
              max="100"
              required
            />
          </div>

          {/* Inversión y Deuda */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label htmlFor="percentInvInput" className="form-label" style={{ fontWeight: 600 }}>Inversión y Deuda</label>
              <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700 }}>{formatCurrency(maxInv)}</span>
            </div>
            <input
              id="percentInvInput"
              type="number"
              className="form-input"
              value={percentInversionDeuda}
              onChange={(e) => setPercentInversionDeuda(e.target.value)}
              min="0"
              max="100"
              required
            />
          </div>
        </div>

        {/* Indicador de Suma y Estado */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: isPercentValid ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)',
          border: `1px solid ${isPercentValid ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          fontSize: '0.9rem',
          fontWeight: 600,
          color: isPercentValid ? 'var(--success)' : 'var(--error)',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <span>Sumatoria Total de Porcentajes:</span>
          <span>{totalPercent}% {isPercentValid ? ' (Válido)' : ' (Debe sumar exactamente 100%)'}</span>
        </div>
      </div>

      {/* SECCIÓN 3: ÍTEMS ESPECÍFICOS DE GASTO */}
      <div className="card glass-container" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Planificación de Ítems del Molde
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.925rem', lineHeight: '1.5' }}>
          Agrega los ítems puntuales que deseas planificar (ej. "luz", "alquiler", "internet"). 
          Cada ítem debe estar vinculado a una de tus categorías base o a la categoría Comida.
        </p>

        {baseCategories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            <AlertTriangle size={28} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
            <p>No se encontraron las categorías base sembradas (`Vida`, `Ocio`, `Inversion-Deuda`).</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Contacta al administrador o re-siembra los datos en base de datos.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {items.map((item) => (
              <BudgetItemConfigRow 
                key={item.id}
                item={item}
                baseCategories={baseCategories}
                onUpdateItem={handleUpdateItem}
                onRemoveItem={handleRemoveItem}
              />
            ))}

            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddItem}
                style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
              >
                <Plus size={16} />
                <span>Agregar Ítem de Gasto</span>
              </button>
            </div>
          </div>
        )}

        {/* Métrica de Asignación y Alertas No Bloqueantes */}
        {items.length > 0 && (
          <ConsistencyIndicators 
            sumVida={sumVida} maxVida={maxVida} percentVida={percentVida} warningVida={warningVida}
            sumOcio={sumOcio} maxOcio={maxOcio} percentOcio={percentOcio} warningOcio={warningOcio}
            sumInv={sumInv} maxInv={maxInv} percentInversionDeuda={percentInversionDeuda} warningInv={warningInv}
          />
        )}
      </div>

      {/* BOTÓN DE ENVIAR */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSaving || !isPercentValid}
          style={{ width: 'auto', padding: '0.8rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
        >
          {isSaving ? (
            <>
              <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTop: '2px solid transparent', marginRight: '0.25rem' }}></div>
              Guardando Cambios...
            </>
          ) : (
            <>
              <Save size={18} />
              Guardar Presupuesto Modelo
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default BudgetModelConfig;
