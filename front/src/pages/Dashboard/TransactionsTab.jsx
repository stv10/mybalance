import React from 'react';
import { Filter } from 'lucide-react';
import StatsGrid from '../../components/overview/StatsGrid';
import TransactionFilters from '../../components/transactions/TransactionFilters';
import TransactionTable from '../../components/transactions/TransactionTable';
import EmptyState from '../../components/ui/EmptyState';
import { getMonthNameSpanish } from '../../utils/formatters';

/**
 * TransactionsTab — vista de historial de transacciones con filtros y tabla.
 */
const TransactionsTab = ({
  filteredTransactions,
  totalIncome,
  totalExpense,
  balanceTotal,
  activeMonth,
  search,
  typeFilter,
  categoryFilter,
  accountFilter,
  categories,
  accounts = [],
  wealthTotal = null,
  onSearchChange,
  onTypeChange,
  onCategoryChange,
  onAccountChange,
  onNew,
  onEdit,
  onDelete,
}) => {
  const monthLabel = getMonthNameSpanish(activeMonth);

  return (
    <>
      <StatsGrid
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        balanceTotal={balanceTotal}
        monthLabel={monthLabel}
        wealthTotal={wealthTotal}
      />

      <TransactionFilters
        search={search}
        typeFilter={typeFilter}
        categoryFilter={categoryFilter}
        accountFilter={accountFilter}
        categories={categories}
        accounts={accounts}
        onSearchChange={onSearchChange}
        onTypeChange={onTypeChange}
        onCategoryChange={onCategoryChange}
        onAccountChange={onAccountChange}
        onNew={onNew}
      />

      {filteredTransactions.length === 0 ? (
        <EmptyState
          icon={<Filter size={32} />}
          title="Sin resultados"
          description={
            <>
              No se encontraron movimientos que coincidan con los filtros aplicados en el mes de{' '}
              <strong>{monthLabel}</strong>.
            </>
          }
          style={{ minHeight: '300px' }}
        />
      ) : (
        <TransactionTable
          transactions={filteredTransactions}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </>
  );
};

export default TransactionsTab;
