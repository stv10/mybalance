import StatsGrid from '../../components/overview/StatsGrid';
import CategoryDistribution from '../../components/overview/CategoryDistribution';
import RecentTransactions from '../../components/transactions/RecentTransactions';
import { getMonthNameSpanish } from '../../utils/formatters';
import WeeklyFoodExpense from '../../components/overview/WeeklyFoodExpense';

/**
 * OverviewTab — vista de resumen financiero del mes.
 */
const OverviewTab = ({
  monthTransactions,
  totalIncome,
  totalExpense,
  balanceTotal,
  categoryDistribution,
  activeMonth,
  wealthTotal = null,
  showToast,
  onNewTransaction,
  onViewAllTransactions,
  categories = [],
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

      <WeeklyFoodExpense
        monthTransactions={monthTransactions}
        activeMonth={activeMonth}
        showToast={showToast}
        categories={categories}
      />

      <div className="dashboard-grid">
        <RecentTransactions
          transactions={monthTransactions}
          onViewAll={onViewAllTransactions}
        />
        <CategoryDistribution
          distribution={categoryDistribution}
          onNewTransaction={onNewTransaction}
        />
      </div>
    </>
  );
};

export default OverviewTab;
