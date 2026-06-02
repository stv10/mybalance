import React, { useMemo } from 'react';
import { TrendingUp, Calendar, AlertTriangle, AlertCircle, ShoppingBag } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

/**
 * StatsCardGrid — Muestra un grid de tarjetas con estadísticas avanzadas computadas.
 *
 * @param {Array} transactions - Transacciones del mes seleccionado
 * @param {string} activeMonth - Mes seleccionado "YYYY-MM"
 */
const StatsCardGrid = ({ transactions, activeMonth }) => {
  
  // Computar estadísticas en tiempo de ejecución (Directamente al renderizar)
  const stats = useMemo(() => {
    const expenses = transactions.filter((tx) => tx.type === 'EXPENSE');
    const totalExpensesAmt = expenses.reduce((sum, tx) => sum + Number(tx.amount), 0);

    // 1. Promedio Diario
    const [yearStr, monthStr] = activeMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;
    
    let daysCount = new Date(year, month, 0).getDate(); // Días totales en el mes
    if (isCurrentMonth) {
      daysCount = Math.max(1, today.getDate()); // Días transcurridos hasta hoy
    }
    
    const dailyAverage = daysCount > 0 ? totalExpensesAmt / daysCount : 0;

    // 2. Día de Mayor Gasto (Pico)
    const expensesByDate = {};
    expenses.forEach((tx) => {
      expensesByDate[tx.date] = (expensesByDate[tx.date] || 0) + Number(tx.amount);
    });

    let peakDate = null;
    let peakAmount = 0;
    Object.entries(expensesByDate).forEach(([date, amt]) => {
      if (amt > peakAmount) {
        peakAmount = amt;
        peakDate = date;
      }
    });

    // 3. Categoría Líder de Gasto
    const expensesByCategory = {};
    expenses.forEach((tx) => {
      const cat = tx.categoryName || 'Otros';
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Number(tx.amount);
    });

    let topCategory = 'Ninguna';
    let topCategoryAmount = 0;
    Object.entries(expensesByCategory).forEach(([cat, amt]) => {
      if (amt > topCategoryAmount) {
        topCategoryAmount = amt;
        topCategory = cat;
      }
    });

    const topCategoryPercent = totalExpensesAmt > 0 ? (topCategoryAmount / totalExpensesAmt) * 100 : 0;

    // 4. Gastos Hormiga (Transacciones <= $1500)
    const microExpenses = expenses.filter((tx) => Number(tx.amount) <= 1500);
    const microExpensesAmt = microExpenses.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const microExpensesCount = microExpenses.length;

    return {
      dailyAverage,
      peakDate,
      peakAmount,
      topCategory,
      topCategoryPercent,
      microExpensesAmt,
      microExpensesCount,
      isCurrentMonth,
      daysCount
    };
  }, [transactions, activeMonth]);

  const cardsData = [
    {
      title: 'Promedio de Gasto Diario',
      value: formatCurrency(stats.dailyAverage),
      description: stats.isCurrentMonth
        ? `Basado en los primeros ${stats.daysCount} días del mes.`
        : `Calculado sobre los ${stats.daysCount} días del mes.`,
      icon: <TrendingUp size={18} />,
      color: 'var(--primary)',
      bg: 'var(--primary-glow)',
    },
    {
      title: 'Día de Gasto Pico',
      value: stats.peakAmount > 0 ? formatCurrency(stats.peakAmount) : '$0.00',
      description: stats.peakDate 
        ? `Ocurrió el ${formatDate(stats.peakDate, { day: '2-digit', month: 'short' })}.`
        : 'Sin gastos registrados este mes.',
      icon: <Calendar size={18} />,
      color: '#a855f7', // Purple
      bg: 'rgba(168, 85, 247, 0.1)',
    },
    {
      title: 'Categoría Principal',
      value: stats.topCategoryAmount === 0 ? 'Ninguna' : stats.topCategory,
      description: stats.topCategoryPercent > 0
        ? `Representa el ${stats.topCategoryPercent.toFixed(0)}% de tus egresos.`
        : 'Sin gastos registrados este mes.',
      icon: <AlertTriangle size={18} />,
      color: '#f59e0b', // Amber
      bg: 'rgba(245, 158, 11, 0.1)',
    },
    {
      title: 'Fuga: Gastos Hormiga',
      value: formatCurrency(stats.microExpensesAmt),
      description: stats.microExpensesCount > 0
        ? `${stats.microExpensesCount} transacciones de bajo valor (≤ $1500).`
        : '¡Excelente! Sin compras menores recurrentes.',
      icon: <ShoppingBag size={18} />,
      color: stats.microExpensesAmt > 10000 ? 'var(--error)' : 'var(--success)',
      bg: stats.microExpensesAmt > 10000 ? 'var(--error-glow)' : 'var(--success-glow)',
    }
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1rem',
        width: '100%',
      }}
    >
      {cardsData.map((card, idx) => (
        <div
          key={idx}
          className="card glass-container animate-fade-in"
          style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'default',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
              {card.title.toUpperCase()}
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: card.bg,
                color: card.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {card.icon}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {card.value}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, lineHeight: '1.3' }}>
              {card.description}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(StatsCardGrid);
