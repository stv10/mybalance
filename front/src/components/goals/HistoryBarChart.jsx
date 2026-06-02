import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, CalendarDays, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency, getMonthNameSpanish } from '../../utils/formatters';

/**
 * HistoryBarChart — Componente de gráficos de barras premium para evolución temporal.
 *
 * @param {string} activeMonth - Mes seleccionado "YYYY-MM"
 * @param {Array} allTransactions - Todas las transacciones del usuario
 */
const HistoryBarChart = ({ activeMonth, allTransactions = [] }) => {
  const [chartTab, setChartTab] = useState('monthly'); // 'monthly', 'semestral', 'annual'

  // Obtener año y mes activos
  const { currentYear, currentMonthVal } = useMemo(() => {
    const [y, m] = activeMonth.split('-').map(Number);
    return { currentYear: y || new Date().getFullYear(), currentMonthVal: m || 1 };
  }, [activeMonth]);

  // 1. Datos para vista MENSUAL: Gastos agrupados por Categoría del mes activo
  const monthlyCategoryData = useMemo(() => {
    const activePrefix = `${currentYear}-${String(currentMonthVal).padStart(2, '0')}`;
    const monthlyTxs = allTransactions.filter(
      (tx) => tx.date?.startsWith(activePrefix) && tx.type === 'EXPENSE'
    );

    const totals = {};
    monthlyTxs.forEach((tx) => {
      const name = tx.categoryName || 'Otros';
      totals[name] = (totals[name] || 0) + Number(tx.amount);
    });

    const maxAmt = Math.max(...Object.values(totals), 1);
    return Object.entries(totals)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: (amount / maxAmt) * 100,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [allTransactions, currentYear, currentMonthVal]);

  // 2. Datos para vista SEMESTRAL: Ingresos vs Egresos de los 6 meses del semestre activo
  const semestralData = useMemo(() => {
    // Determinar en qué semestre estamos
    const isS1 = currentMonthVal <= 6;
    const startMonth = isS1 ? 1 : 7;
    const endMonth = isS1 ? 6 : 12;
    const monthNamesShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const months = [];
    for (let m = startMonth; m <= endMonth; m++) {
      const monthPrefix = `${currentYear}-${String(m).padStart(2, '0')}`;
      const monthTxs = allTransactions.filter((tx) => tx.date?.startsWith(monthPrefix));

      const income = monthTxs
        .filter((tx) => tx.type === 'INCOME')
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

      const expense = monthTxs
        .filter((tx) => tx.type === 'EXPENSE')
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

      months.push({
        label: monthNamesShort[m - 1],
        income,
        expense,
        savings: income - expense,
      });
    }

    return months;
  }, [allTransactions, currentYear, currentMonthVal]);

  // 3. Datos para vista ANUAL: Ingresos vs Egresos para los 12 meses del año activo
  const annualData = useMemo(() => {
    const monthNamesShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const months = [];
    for (let m = 1; m <= 12; m++) {
      const monthPrefix = `${currentYear}-${String(m).padStart(2, '0')}`;
      const monthTxs = allTransactions.filter((tx) => tx.date?.startsWith(monthPrefix));

      const income = monthTxs
        .filter((tx) => tx.type === 'INCOME')
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

      const expense = monthTxs
        .filter((tx) => tx.type === 'EXPENSE')
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

      months.push({
        label: monthNamesShort[m - 1],
        income,
        expense,
        savings: income - expense,
      });
    }

    return months;
  }, [allTransactions, currentYear]);

  // Máximo valor para escalar gráficos semestrales y anuales
  const semestralMax = useMemo(() => {
    const values = semestralData.flatMap((d) => [d.income, d.expense]);
    return Math.max(...values, 100); // Evitar división por cero
  }, [semestralData]);

  const annualMax = useMemo(() => {
    const values = annualData.flatMap((d) => [d.income, d.expense]);
    return Math.max(...values, 100);
  }, [annualData]);

  return (
    <div
      className="card glass-container animate-fade-in"
      style={{
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: 'var(--shadow-md)',
        minHeight: '360px',
        flex: 1,
      }}
    >
      {/* Cabecera del Gráfico con Controles */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={18} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Análisis de Tendencias</h3>
        </div>

        {/* Toggles de Pestañas de Gráfico */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-primary)',
            padding: '2px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          {['monthly', 'semestral', 'annual'].map((tab) => {
            const label = tab === 'monthly' ? 'Mensual' : tab === 'semestral' ? 'Semestral' : 'Anual';
            const isActive = chartTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setChartTab(tab)}
                style={{
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  borderRadius: 'calc(var(--radius-md) - 2px)',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Renderizado de Contenidos */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        
        {/* VISTA 1: MENSUAL (Barras de Categorías Horizontales) */}
        {chartTab === 'monthly' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {monthlyCategoryData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                No hay egresos registrados en {getMonthNameSpanish(activeMonth)} para graficar.
              </div>
            ) : (
              monthlyCategoryData.slice(0, 5).map((item, idx) => (
                <div key={item.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(item.amount)}</span>
                  </div>
                  {/* Barra de progreso */}
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${item.percentage}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--primary) 0%, #a855f7 100%)',
                        borderRadius: '100px',
                        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* VISTA 2: SEMESTRAL (Barras Verticales Lado a Lado - 6 Meses) */}
        {chartTab === 'semestral' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Contenedor del Gráfico SVG */}
            <div style={{ height: '170px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              {semestralData.map((d, i) => {
                const incHeight = (d.income / semestralMax) * 120; // max height 120px
                const expHeight = (d.expense / semestralMax) * 120;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '14%' }}>
                    {/* Barras lado a lado */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '120px', width: '100%', justifyContent: 'center' }}>
                      {/* Barra Ingresos */}
                      <div
                        style={{
                          width: '8px',
                          height: `${Math.max(incHeight, 2)}px`,
                          background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                          borderRadius: '100px 100px 0 0',
                          transition: 'height 0.8s ease-out',
                          position: 'relative',
                        }}
                        title={`Ingresos: ${formatCurrency(d.income)}`}
                      />
                      {/* Barra Gastos */}
                      <div
                        style={{
                          width: '8px',
                          height: `${Math.max(expHeight, 2)}px`,
                          background: 'linear-gradient(180deg, #f43f5e 0%, #e11d48 100%)',
                          borderRadius: '100px 100px 0 0',
                          transition: 'height 0.8s ease-out',
                          position: 'relative',
                        }}
                        title={`Gastos: ${formatCurrency(d.expense)}`}
                      />
                    </div>
                    {/* Etiqueta del Mes */}
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Leyenda y Datos Resumen */}
            <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.75rem', fontWeight: 700, flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Ingresos</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f43f5e' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Gastos</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <TrendingUp size={12} style={{ color: 'var(--primary)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Periodo: {currentMonthVal <= 6 ? '1° Semestre' : '2° Semestre'} {currentYear}</span>
              </div>
            </div>
          </div>
        )}

        {/* VISTA 3: ANUAL (Barras Verticales Lado a Lado - 12 Meses) */}
        {chartTab === 'annual' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Contenedor del Gráfico SVG */}
            <div style={{ height: '170px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              {annualData.map((d, i) => {
                const incHeight = (d.income / annualMax) * 120;
                const expHeight = (d.expense / annualMax) * 120;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '7%' }}>
                    {/* Barras lado a lado */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '120px', width: '100%', justifyContent: 'center' }}>
                      {/* Barra Ingresos */}
                      <div
                        style={{
                          width: '5px',
                          height: `${Math.max(incHeight, 2)}px`,
                          background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                          borderRadius: '100px 100px 0 0',
                          transition: 'height 0.8s ease-out',
                        }}
                        title={`Ingresos: ${formatCurrency(d.income)}`}
                      />
                      {/* Barra Gastos */}
                      <div
                        style={{
                          width: '5px',
                          height: `${Math.max(expHeight, 2)}px`,
                          background: 'linear-gradient(180deg, #f43f5e 0%, #e11d48 100%)',
                          borderRadius: '100px 100px 0 0',
                          transition: 'height 0.8s ease-out',
                        }}
                        title={`Gastos: ${formatCurrency(d.expense)}`}
                      />
                    </div>
                    {/* Etiqueta del Mes */}
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Leyenda y Datos Resumen */}
            <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.75rem', fontWeight: 700, flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Ingresos</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f43f5e' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Gastos</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CalendarDays size={12} style={{ color: 'var(--primary)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Año Completo: {currentYear}</span>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default React.memo(HistoryBarChart);
