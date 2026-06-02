import React from 'react';
import { Trash2 } from 'lucide-react';

/**
 * CategoryList — lista de categorías activas con opción de eliminar las personalizadas.
 *
 * @param {object[]} categories
 * @param {(id: string, name: string) => void} onDelete
 */
const CategoryList = ({ categories = [], onDelete }) => {
  return (
    <div className="settings-card animate-fade-in">
      <h3 className="settings-card-title">Categorías Activas</h3>
      <p className="settings-card-description">
        Categorías disponibles actualmente ({categories.length}). Las categorías base del sistema no se pueden eliminar.
      </p>

      <div className="category-list-container">
        {categories.map((cat) => {
          const isDeletable = cat.isUserCreated;
          return (
            <div className="category-item animate-fade-in" key={cat.id}>
              <div className="category-details">
                <span className={`badge ${cat.type === 'INCOME' ? 'badge-income' : 'badge-expense'}`}>
                  {cat.type === 'INCOME' ? 'IN' : 'OUT'}
                </span>
                <span className="category-name-text" style={{ fontWeight: !isDeletable ? 700 : 500 }}>
                  {cat.name}
                </span>
                {cat.parentCategoryName && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                    (Subcategoría de {cat.parentCategoryName})
                  </span>
                )}
                {!isDeletable && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', marginLeft: '0.5rem' }}>
                    (Base)
                  </span>
                )}
              </div>

              {isDeletable && (
                <button
                  className="btn-icon btn-icon-danger"
                  style={{ padding: '0.35rem' }}
                  onClick={() => onDelete(cat.id, cat.name)}
                  title={`Eliminar categoría ${cat.name}`}
                  aria-label={`Eliminar categoría ${cat.name}`}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryList;
