import React from 'react';
import { Trash2 } from 'lucide-react';
import AmountInput from '../ui/AmountInput';

/**
 * BudgetItemConfigRow — Fila individual de configuración para un ítem del presupuesto.
 * Optimizado con React.memo.
 */
const BudgetItemConfigRow = React.memo(({ 
  item, 
  baseCategories = [], 
  onUpdateItem, 
  onRemoveItem 
}) => {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '1rem', 
      paddingBottom: '1rem', 
      borderBottom: '1px solid var(--border-color)',
      flexWrap: 'wrap'
    }}>
      {/* Nombre del Ítem */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: '2 1 200px' }}>
        <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nombre del Ítem</label>
        <input
          type="text"
          className="form-input"
          placeholder="Ej: Luz, Suscripción Netflix, Cuota Gimnasio..."
          value={item.name}
          onChange={(e) => onUpdateItem(item.id, 'name', e.target.value)}
          required
        />
      </div>

      {/* Categoría Base */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: '1 1 150px' }}>
        <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Categoría Base</label>
        <select
          className="form-input"
          value={item.categoryId}
          onChange={(e) => onUpdateItem(item.id, 'categoryId', e.target.value)}
          style={{ appearance: 'auto', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          required
        >
          {baseCategories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Día Vence */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: '1 1 80px' }}>
        <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Día Vence</label>
        <input
          type="number"
          className="form-input"
          placeholder="Opcional"
          value={item.dueDay || ''}
          onChange={(e) => onUpdateItem(item.id, 'dueDay', e.target.value)}
          min="1"
          max="31"
        />
      </div>

      {/* Límite */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: '1 1 120px' }}>
        <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Límite ($)</label>
        <AmountInput
          placeholder="0.00"
          value={item.amountLimit}
          onChange={(e) => onUpdateItem(item.id, 'amountLimit', e.target.value)}
          required
        />
      </div>

      {/* Botón Eliminar */}
      <button
        type="button"
        className="btn-icon btn-icon-danger"
        onClick={() => onRemoveItem(item.id)}
        style={{ alignSelf: 'flex-end', marginBottom: '0.4rem', padding: '0.6rem' }}
        title="Eliminar ítem"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
});

BudgetItemConfigRow.displayName = 'BudgetItemConfigRow';

export default BudgetItemConfigRow;
