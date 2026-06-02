import React from 'react';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import StatCard from '../ui/StatCard';
import { formatCurrency } from '../../utils/formatters';

/**
 * StatsGrid — grilla de KPIs del mes (Balance, Ingresos, Gastos).
 *
 * @param {number} totalIncome
 * @param {number} totalExpense
 * @param {number} balanceTotal
 * @param {string} monthLabel - Ej: "Mayo 2025"
 */
const StatsGrid = ({ totalIncome, totalExpense, balanceTotal, monthLabel, wealthTotal = null }) => {
  return (
    <div className="stats-grid">
      {wealthTotal !== null && (
        <StatCard
          title="Patrimonio Total"
          value={formatCurrency(wealthTotal)}
          icon={<Wallet size={18} />}
          iconBg="var(--primary-glow)"
          iconColor="var(--primary)"
          footer={<span style={{ fontWeight: 600, color: 'var(--primary)' }}>Riqueza Neta</span>}
        />
      )}

      <StatCard
        title={`Balance Total (${monthLabel})`}
        value={`${balanceTotal < 0 ? '-' : ''}${formatCurrency(Math.abs(balanceTotal))}`}
        icon={<Wallet size={18} />}
        iconBg="var(--primary-glow)"
        iconColor="var(--primary)"
        footer={
          <span style={{ color: balanceTotal < 0 ? 'var(--error)' : 'var(--success)', fontWeight: 600 }}>
            {balanceTotal >= 0 ? 'Saldo Positivo' : 'Déficit del mes'}
          </span>
        }
      />

      <StatCard
        title="Ingresos"
        value={formatCurrency(totalIncome, 'income')}
        icon={<TrendingUp size={18} />}
        iconBg="var(--success-glow)"
        iconColor="var(--success)"
        valueColor="var(--success)"
        footer={<span>Entradas registradas</span>}
      />

      <StatCard
        title="Gastos"
        value={formatCurrency(totalExpense, 'expense')}
        icon={<TrendingDown size={18} />}
        iconBg="rgba(239, 68, 68, 0.08)"
        iconColor="var(--error)"
        valueColor="var(--error)"
        footer={<span>Salidas registradas</span>}
      />
    </div>
  );
};

export default StatsGrid;
