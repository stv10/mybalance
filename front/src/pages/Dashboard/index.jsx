import React, { useState, useEffect, useMemo, useCallback, startTransition } from 'react';
import { Sparkles } from 'lucide-react';
import { apiService } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { useAccounts } from '../../hooks/useAccounts';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import FloatingMonthSelector from '../../components/layout/FloatingMonthSelector';
import OverviewTab from './OverviewTab';
import TransactionsTab from './TransactionsTab';
import AccountsTab from './AccountsTab';
import SettingsTab from './SettingsTab';
import BudgetsTab from '../../components/budgets/BudgetsTab';
import EmptyState from '../../components/ui/EmptyState';
import GoalsTab from './GoalsTab';
import TransactionModal from '../../components/transactions/TransactionModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Toast from '../../components/ui/Toast';
import { getCurrentMonth, CATEGORY_COLORS } from '../../utils/formatters';
import { AlertTriangle } from 'lucide-react';

// Initial form state factory
const makeInitialForm = (categories = [], accounts = []) => {
  const expenseCats = categories.filter((c) => c.type === 'EXPENSE');
  return {
    categoryId: expenseCats[0]?.id ?? categories[0]?.id ?? '',
    accountId: accounts[0]?.id ?? '',
    type: 'EXPENSE',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  };
};

const Dashboard = () => {
  // ─── State ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('overview');
  const [overviewMonth, setOverviewMonth] = useState(getCurrentMonth);
  const [transactionsMonth, setTransactionsMonth] = useState(getCurrentMonth);
  const [budgetsMonth, setBudgetsMonth] = useState(getCurrentMonth);
  const [goalsMonth, setGoalsMonth] = useState(getCurrentMonth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('ALL');
  const [txCategoryFilter, setTxCategoryFilter] = useState('ALL');
  const [txAccountFilter, setTxAccountFilter] = useState('ALL');

  // Transaction modal
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txEditing, setTxEditing] = useState(null);
  const [txFormData, setTxFormData] = useState(() => makeInitialForm());
  const [txFormErrors, setTxFormErrors] = useState({});
  const [isSavingTx, setIsSavingTx] = useState(false);

  // Confirm dialog
  const [confirm, setConfirm] = useState(null); // { title, message, onConfirm }

  // ─── Custom Hooks ─────────────────────────────────────────────────────────
  const { toast, showToast } = useToast();
  const { transactions, loadTransactions } = useTransactions(showToast);
  const { categories, loadCategories, createCategory, deleteCategory } = useCategories(showToast);
  const { accounts, loadAccounts, createAccount, updateAccount, deleteAccount } = useAccounts(showToast);

  // ─── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([loadTransactions(), loadCategories(), loadAccounts()]);
      } catch (err) {
        setError(err.message || 'Error al conectar con el servidor.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadTransactions, loadCategories, loadAccounts]);

  // ─── Derived state (memoized) ─────────────────────────────────────────────
  // Overview derived state (depends on overviewMonth)
  const overviewTransactions = useMemo(
    () => transactions.filter((tx) => tx.date?.startsWith(overviewMonth)),
    [transactions, overviewMonth]
  );

  const { overviewTotalIncome, overviewTotalExpense, overviewBalanceTotal } = useMemo(() => {
    const income = overviewTransactions
      .filter((tx) => tx.type === 'INCOME')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const expense = overviewTransactions
      .filter((tx) => tx.type === 'EXPENSE')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    return { overviewTotalIncome: income, overviewTotalExpense: expense, overviewBalanceTotal: income - expense };
  }, [overviewTransactions]);

  const overviewCategoryDistribution = useMemo(() => {
    const totals = {};
    overviewTransactions
      .filter((tx) => tx.type === 'EXPENSE')
      .forEach((tx) => {
        const name = tx.categoryName || 'Otros';
        totals[name] = (totals[name] || 0) + Number(tx.amount);
      });
    const totalExpAmt = Object.values(totals).reduce((a, b) => a + b, 0);
    return Object.entries(totals)
      .map(([name, amount], idx) => ({
        name,
        amount,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
        percentage: totalExpAmt > 0 ? (amount / totalExpAmt) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [overviewTransactions]);

  // Transactions derived state (depends on transactionsMonth)
  const transactionsMonthTransactions = useMemo(
    () => transactions.filter((tx) => tx.date?.startsWith(transactionsMonth)),
    [transactions, transactionsMonth]
  );

  const { transactionsTotalIncome, transactionsTotalExpense, transactionsBalanceTotal } = useMemo(() => {
    const income = transactionsMonthTransactions
      .filter((tx) => tx.type === 'INCOME')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const expense = transactionsMonthTransactions
      .filter((tx) => tx.type === 'EXPENSE')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    return { transactionsTotalIncome: income, transactionsTotalExpense: expense, transactionsBalanceTotal: income - expense };
  }, [transactionsMonthTransactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const searchMatch =
        txSearch === '' ||
        tx.description?.toLowerCase().includes(txSearch.toLowerCase()) ||
        tx.categoryName?.toLowerCase().includes(txSearch.toLowerCase());
      const typeMatch = txTypeFilter === 'ALL' || tx.type === txTypeFilter;
      const categoryMatch = txCategoryFilter === 'ALL' || tx.categoryId === txCategoryFilter;
      const accountMatch = txAccountFilter === 'ALL' || tx.accountId === txAccountFilter;
      const monthMatch = tx.date?.startsWith(transactionsMonth);
      return searchMatch && typeMatch && categoryMatch && accountMatch && monthMatch;
    });
  }, [transactions, txSearch, txTypeFilter, txCategoryFilter, txAccountFilter, transactionsMonth]);

  // Goals derived state (depends on goalsMonth)
  const goalsTransactions = useMemo(
    () => transactions.filter((tx) => tx.date?.startsWith(goalsMonth)),
    [transactions, goalsMonth]
  );

  // Month selector context
  const currentMonthContext = useMemo(() => {
    switch (activeTab) {
      case 'overview':
        return { activeMonth: overviewMonth, onMonthChange: setOverviewMonth, show: true };
      case 'transactions':
        return { activeMonth: transactionsMonth, onMonthChange: setTransactionsMonth, show: true };
      case 'budgets':
        return { activeMonth: budgetsMonth, onMonthChange: setBudgetsMonth, show: true };
      case 'goals':
        return { activeMonth: goalsMonth, onMonthChange: setGoalsMonth, show: true };
      default:
        return { activeMonth: null, onMonthChange: null, show: false };
    }
  }, [activeTab, overviewMonth, transactionsMonth, budgetsMonth, goalsMonth]);

  const wealthTotal = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
  }, [accounts]);

  // ─── Tab navigation ───────────────────────────────────────────────────────
  const handleTabChange = useCallback((tab) => {
    startTransition(() => setActiveTab(tab));
  }, []);

  // ─── Transaction Modal ────────────────────────────────────────────────────
  const handleOpenCreateModal = useCallback(() => {
    setTxEditing(null);
    setTxFormData(makeInitialForm(categories, accounts));
    setTxFormErrors({});
    setIsTxModalOpen(true);
  }, [categories, accounts]);

  const handleOpenEditModal = useCallback((tx) => {
    setTxEditing(tx);
    setTxFormData({
      categoryId: tx.categoryId,
      accountId: tx.accountId,
      type: tx.type,
      amount: tx.amount.toString(),
      description: tx.description || '',
      date: tx.date,
    });
    setTxFormErrors({});
    setIsTxModalOpen(true);
  }, []);

  const handleTxTypeChange = useCallback((newType) => {
    const firstCat = categories.find((c) => c.type === newType);
    setTxFormData((prev) => ({ ...prev, type: newType, categoryId: firstCat?.id ?? '' }));
  }, [categories]);

  const handleFormChange = useCallback((patch) => {
    setTxFormData((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!txFormData.amount || Number(txFormData.amount) <= 0) errors.amount = 'El monto debe ser mayor a 0';
    if (!txFormData.categoryId) errors.categoryId = 'Selecciona una categoría';
    if (!txFormData.accountId) errors.accountId = 'Selecciona una cuenta';
    if (!txFormData.date) errors.date = 'La fecha es obligatoria';

    if (Object.keys(errors).length > 0) {
      setTxFormErrors(errors);
      return;
    }

    setIsSavingTx(true);
    try {
      const payload = {
        categoryId: txFormData.categoryId,
        accountId: txFormData.accountId,
        type: txFormData.type,
        amount: parseFloat(txFormData.amount),
        description: txFormData.description.trim(),
        date: txFormData.date,
      };

      if (txEditing) {
        await apiService.updateTransaction(txEditing.id, payload);
        showToast('Transacción modificada correctamente', 'success');
      } else {
        await apiService.createTransaction(payload);
        showToast('Transacción creada correctamente', 'success');
      }

      setIsTxModalOpen(false);
      await Promise.all([loadTransactions(), loadAccounts()]);
    } catch (err) {
      showToast(err.message || 'Error al procesar transacción', 'error');
    } finally {
      setIsSavingTx(false);
    }
  };

  // ─── Confirm Dialog helpers ───────────────────────────────────────────────
  const handleDeleteTransaction = useCallback((id) => {
    setConfirm({
      title: 'Eliminar transacción',
      message: '¿Estás seguro de que deseas eliminar esta transacción? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        setConfirm(null);
        try {
          const res = await apiService.deleteTransaction(id);
          if (res.success) {
            showToast('Transacción eliminada correctamente', 'success');
            await Promise.all([loadTransactions(), loadAccounts()]);
          }
        } catch (err) {
          showToast(err.message || 'Error al eliminar transacción', 'error');
        }
      },
    });
  }, [showToast, loadTransactions, loadAccounts]);

  const handleDeleteCategory = useCallback((id, name) => {
    setConfirm({
      title: 'Eliminar categoría',
      message: `¿Seguro que deseas eliminar la categoría "${name}"? No podrás eliminarla si tiene transacciones activas.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await deleteCategory(id, name);
        } catch (err) {
          showToast(err.message || `No se puede borrar "${name}" porque contiene transacciones activas.`, 'error');
        }
      },
    });
  }, [deleteCategory, showToast]);

  const handleDeleteAccount = useCallback((id, name) => {
    setConfirm({
      title: 'Eliminar cuenta',
      message: `¿Seguro que deseas eliminar la cuenta "${name}"? No podrás eliminarla si tiene transacciones activas.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await deleteAccount(id, name);
        } catch (err) {
          showToast(err.message || `No se puede borrar "${name}" porque contiene transacciones activas.`, 'error');
        }
      },
    });
  }, [deleteAccount, showToast]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-layout">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="dashboard-main">
        <Topbar 
          activeTab={activeTab} 
          activeMonth={currentMonthContext.activeMonth} 
          onMonthChange={currentMonthContext.onMonthChange} 
          showMonthSelector={currentMonthContext.show}
        />

        <div className="dashboard-content-area">
          {loading ? (
            <div className="spinner-container" style={{ minHeight: '40vh', backgroundColor: 'transparent' }}>
              <div className="spinner"></div>
              <p className="loading-text">Cargando tus finanzas...</p>
            </div>
          ) : error ? (
            <div className="alert alert-error animate-fade-in" style={{ maxWidth: '600px', margin: '2rem auto' }}>
              <AlertTriangle className="alert-icon" size={20} />
              <div>
                <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Error de Conexión</h4>
                <p>{error}</p>
                <button
                  className="btn btn-primary"
                  onClick={() => window.location.reload()}
                  style={{ marginTop: '1rem', width: 'auto', padding: '0.5rem 1rem' }}
                >
                  Reintentar
                </button>
              </div>
            </div>
          ) : (
            <div className="tab-content">
              {activeTab === 'overview' && (
                <OverviewTab
                  monthTransactions={overviewTransactions}
                  totalIncome={overviewTotalIncome}
                  totalExpense={overviewTotalExpense}
                  balanceTotal={overviewBalanceTotal}
                  categoryDistribution={overviewCategoryDistribution}
                  activeMonth={overviewMonth}
                  wealthTotal={wealthTotal}
                  showToast={showToast}
                  onNewTransaction={handleOpenCreateModal}
                  onViewAllTransactions={() => handleTabChange('transactions')}
                  categories={categories}
                />
              )}

              {activeTab === 'transactions' && (
                <TransactionsTab
                  filteredTransactions={filteredTransactions}
                  totalIncome={transactionsTotalIncome}
                  totalExpense={transactionsTotalExpense}
                  balanceTotal={transactionsBalanceTotal}
                  activeMonth={transactionsMonth}
                  search={txSearch}
                  typeFilter={txTypeFilter}
                  categoryFilter={txCategoryFilter}
                  accountFilter={txAccountFilter}
                  categories={categories}
                  accounts={accounts}
                  wealthTotal={wealthTotal}
                  onSearchChange={setTxSearch}
                  onTypeChange={setTxTypeFilter}
                  onCategoryChange={setTxCategoryFilter}
                  onAccountChange={setTxAccountFilter}
                  onNew={handleOpenCreateModal}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteTransaction}
                />
              )}

              {activeTab === 'accounts' && (
                <AccountsTab
                  accounts={accounts}
                  onCreateAccount={createAccount}
                  onUpdateAccount={updateAccount}
                  onDeleteAccount={handleDeleteAccount}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsTab
                  categories={categories}
                  onCreateCategory={createCategory}
                  onDeleteCategory={handleDeleteCategory}
                />
              )}

              {activeTab === 'budgets' && (
                <BudgetsTab
                  activeMonth={budgetsMonth}
                  categories={categories}
                  accounts={accounts}
                  showToast={showToast}
                  onRefreshData={() => Promise.all([loadAccounts(), loadTransactions()])}
                />
              )}

              {activeTab === 'goals' && (
                <GoalsTab
                  activeMonth={goalsMonth}
                  transactions={goalsTransactions}
                  allTransactions={transactions}
                />
              )}
            </div>
          )}
        </div>
        
        {currentMonthContext.show && (
          <FloatingMonthSelector 
            activeMonth={currentMonthContext.activeMonth} 
            onMonthChange={currentMonthContext.onMonthChange} 
          />
        )}
      </main>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        txEditing={txEditing}
        formData={txFormData}
        formErrors={txFormErrors}
        isSaving={isSavingTx}
        categories={categories}
        accounts={accounts}
        onFormChange={handleFormChange}
        onTypeChange={handleTxTypeChange}
        onSubmit={handleSaveTransaction}
        onClose={() => setIsTxModalOpen(false)}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel="Eliminar"
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
      />

      {/* Toast */}
      <Toast toast={toast} />
    </div>
  );
};

export default Dashboard;
