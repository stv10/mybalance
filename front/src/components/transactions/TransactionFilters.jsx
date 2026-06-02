import React from 'react';
import { Search, Plus } from 'lucide-react';

/**
 * TransactionFilters — barra de búsqueda, filtros y botón de nueva transacción.
 *
 * @param {string} search
 * @param {string} typeFilter - 'ALL' | 'INCOME' | 'EXPENSE'
 * @param {string} categoryFilter - 'ALL' | categoryId
 * @param {object[]} categories
 * @param {(value: string) => void} onSearchChange
 * @param {(value: string) => void} onTypeChange
 * @param {(value: string) => void} onCategoryChange
 * @param {() => void} onNew
 */
const TransactionFilters = ({
  search,
  typeFilter,
  categoryFilter,
  accountFilter,
  categories,
  accounts = [],
  onSearchChange,
  onTypeChange,
  onCategoryChange,
  onAccountChange,
  onNew,
}) => {
  return (
    <div className="filter-bar">
      <div className="filter-bar-left">
        {/* Search */}
        <div className="filter-group" style={{ maxWidth: '280px' }}>
          <div className="input-wrapper" style={{ width: '100%' }}>
            <Search className="input-icon" size={16} />
            <input
              type="text"
              id="tx-search"
              placeholder="Buscar descripción..."
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Account filter */}
        <div className="filter-group" style={{ maxWidth: '180px' }}>
          <select
            id="tx-account-filter"
            className="form-select"
            value={accountFilter}
            onChange={(e) => onAccountChange(e.target.value)}
          >
            <option value="ALL">Todas las cuentas</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Type filter */}
        <div className="filter-group" style={{ maxWidth: '180px' }}>
          <select
            id="tx-type-filter"
            className="form-select"
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
          >
            <option value="ALL">Todos los flujos</option>
            <option value="INCOME">Ingresos (+)</option>
            <option value="EXPENSE">Gastos (-)</option>
          </select>
        </div>

        {/* Category filter */}
        <div className="filter-group" style={{ maxWidth: '180px' }}>
          <select
            id="tx-category-filter"
            className="form-select"
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="ALL">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.type === 'INCOME' ? 'Ingreso' : 'Gasto'})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="filter-bar-right">
        <button
          id="btn-new-transaction"
          className="btn btn-primary"
          onClick={onNew}
          style={{ padding: '0.75rem 1.25rem' }}
        >
          <Plus size={18} />
          Nueva Transacción
        </button>
      </div>
    </div>
  );
};

export default TransactionFilters;
