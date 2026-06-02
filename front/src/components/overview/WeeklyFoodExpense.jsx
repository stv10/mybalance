import { useState, useEffect, useMemo } from 'react';
import { Utensils, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { apiService } from '../../services/api';
import { formatCurrency, getCurrentMonth } from '../../utils/formatters';

/**
 * WeeklyFoodExpense — Componente para trackear el gasto semanal de comida.
 *
 * @param {Array} monthTransactions - Transacciones del mes seleccionado
 * @param {string} activeMonth - Mes seleccionado en formato "YYYY-MM"
 */
const WeeklyFoodExpense = ({ monthTransactions, activeMonth, categories = [] }) => {
  const [budgetLimit, setBudgetLimit] = useState(0);
  const [loading, setLoading] = useState(false);

  const foodCategoryIds = useMemo(() => {
    const foodCat = categories.find(c => c.name?.toLowerCase() === 'comida');
    if (!foodCat) return new Set();

    const ids = new Set([foodCat.id]);
    
    // Subcategorías directas de Comida (Nivel 1)
    const level1 = categories.filter(c => c.parentCategoryId === foodCat.id);
    level1.forEach(c => {
      ids.add(c.id);
      // Subcategorías de Nivel 2 (ej: Hamburguesas -> Pedidos -> Comida)
      const level2 = categories.filter(sub => sub.parentCategoryId === c.id);
      level2.forEach(sub => ids.add(sub.id));
    });

    return ids;
  }, [categories]);

  // Carga el límite mensual de presupuesto para "Comida"
  useEffect(() => {
    const fetchBudget = async () => {
      if (!activeMonth) return;
      setLoading(true);
      try {
        const [year, month] = activeMonth.split('-');
        const res = await apiService.getMonthlyBudgetCompare(parseInt(month, 10), parseInt(year, 10));
        if (res.success && res.data) {
          const comidaItems = res.data.items?.filter(
            (i) => i.categoryName?.toLowerCase() === 'comida'
          ) || [];
          const totalComidaLimit = comidaItems.reduce(
            (sum, item) => sum + Number(item.amountLimit || 0),
            0
          );
          setBudgetLimit(totalComidaLimit);
        } else {
          setBudgetLimit(0);
        }
      } catch (err) {
        console.error('Error fetching budget for food:', err);
        setBudgetLimit(0);
      } finally {
        setLoading(false);
      }
    };
    fetchBudget();
  }, [activeMonth]);

  const isCurrentMonth = activeMonth === getCurrentMonth();

  // 1. Presupuesto semanal: Límite mensual / 5
  const weeklyBudget = budgetLimit / 5;

  // 2. Gasto semanal e información de la semana
  const { weeklySpent, remaining, percentage, weekStartStr, weekEndStr } = useMemo(() => {
    if (isCurrentMonth) {
      // Calcular límites de la semana calendario actual (Lunes a Domingo)
      const today = new Date();
      const currentDay = today.getDay(); // 0 es Domingo, 1 es Lunes, etc.
      const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() + distanceToMonday);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // Formatear fechas para mostrar al usuario
      const opt = { day: '2-digit', month: '2-digit' };
      const startStr = startOfWeek.toLocaleDateString('es-ES', opt);
      const endStr = endOfWeek.toLocaleDateString('es-ES', opt);

      // Filtrar transacciones de comida de esta semana
      const comidaTxs = monthTransactions.filter((tx) => {
        if (tx.type !== 'EXPENSE') return false;
        const isComida = foodCategoryIds.has(tx.categoryId);
        if (!isComida) return false;

        const [y, m, d] = tx.date.split('-').map(Number);
        const txDate = new Date(y, m - 1, d);
        return txDate >= startOfWeek && txDate <= endOfWeek;
      });

      const spent = comidaTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);
      const rem = weeklyBudget - spent;
      const pct = weeklyBudget > 0 ? (spent / weeklyBudget) * 100 : 0;

      return {
        weeklySpent: spent,
        remaining: rem,
        percentage: pct,
        weekStartStr: startStr,
        weekEndStr: endStr,
      };
    } else {
      // Si es un mes pasado/futuro, mostramos el promedio semanal (Total mensual / 5)
      const comidaTxs = monthTransactions.filter(
        (tx) => tx.type === 'EXPENSE' && foodCategoryIds.has(tx.categoryId)
      );
      const totalMonthSpent = comidaTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);
      const spent = totalMonthSpent / 5;
      const rem = weeklyBudget - spent;
      const pct = weeklyBudget > 0 ? (spent / weeklyBudget) * 100 : 0;

      return {
        weeklySpent: spent,
        remaining: rem,
        percentage: pct,
        weekStartStr: '',
        weekEndStr: '',
      };
    }
  }, [monthTransactions, weeklyBudget, isCurrentMonth]);

  const isExceeded = remaining < 0;

  // Determinar colores y clases basados en el estado del presupuesto
  let barColor = 'var(--success)';
  let cardBorder = '1px solid var(--border-color)';
  let statusText = 'Bajo Control';
  let badgeColor = 'var(--success)';
  let badgeBg = 'var(--success-glow)';

  if (weeklyBudget === 0) {
    barColor = 'var(--text-muted)';
    statusText = 'Presupuesto no configurado';
    badgeColor = 'var(--text-secondary)';
    badgeBg = 'var(--border-color)';
  } else if (isExceeded) {
    barColor = 'var(--error)';
    cardBorder = '1px solid rgba(239, 68, 68, 0.3)';
    statusText = 'Límite Superado';
    badgeColor = 'var(--error)';
    badgeBg = 'var(--error-glow)';
  } else if (percentage >= 80) {
    barColor = '#f59e0b';
    statusText = 'Advertencia';
    badgeColor = '#f59e0b';
    badgeBg = 'rgba(245, 158, 11, 0.15)';
  }

  return (
    <div
      className="card glass-container animate-fade-in"
      style={{
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: cardBorder,
        backgroundColor: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isExceeded ? 'var(--error-glow)' : 'var(--primary-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isExceeded ? 'var(--error)' : 'var(--primary)',
            }}
          >
            <Utensils size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Gasto Semanal en Comida
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>
              {isCurrentMonth
                ? `Semana actual (${weekStartStr} al ${weekEndStr})`
                : 'Promedio semanal de este mes (Total / 5)'}
            </p>
          </div>
        </div>

        {weeklyBudget > 0 && (
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.35rem 0.75rem',
              borderRadius: '100px',
              backgroundColor: badgeBg,
              color: badgeColor,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            {isExceeded ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
            <span>{statusText}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
          <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--primary)', margin: 0 }} />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Cargando presupuesto...</span>
        </div>
      ) : weeklyBudget === 0 ? (
        <div style={{ padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            No se ha establecido un límite de gasto mensual para la categoría <strong>Comida</strong>.
            Puedes configurar uno en la pestaña <strong>Presupuestos</strong> para activar este seguimiento.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
            <span>Ajustar molde de presupuesto</span>
            <ArrowRight size={14} />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              backgroundColor: 'var(--bg-primary)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>PRESUPUESTADO</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {formatCurrency(weeklyBudget)}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>GASTADO</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: isExceeded ? 'var(--error)' : 'var(--text-primary)' }}>
                {formatCurrency(weeklySpent)}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                {isExceeded ? 'EXCEDIDO' : 'RESTANTE'}
              </span>
              <span
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: isExceeded ? 'var(--error)' : 'var(--success)',
                }}
              >
                {formatCurrency(Math.abs(remaining))}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '100px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(percentage, 100)}%`,
                  height: '100%',
                  backgroundColor: barColor,
                  borderRadius: '100px',
                  transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            </div>
            {percentage > 0 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, alignSelf: 'flex-end' }}>
                {percentage.toFixed(0)}% consumido
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyFoodExpense;
