import React, { useState, useEffect, useMemo, useCallback, startTransition } from 'react';
import { PiggyBank, Sparkles, TrendingUp, BarChart3, Award, Info } from 'lucide-react';
import { apiService } from '../../services/api';
import SavingsGauge from '../../components/goals/SavingsGauge';
import StatsCardGrid from '../../components/goals/StatsCardGrid';
import AiInsightCard from '../../components/goals/AiInsightCard';
import ScoreGauge from '../../components/goals/ScoreGauge';
import HistoryBarChart from '../../components/goals/HistoryBarChart';
import { getMonthNameSpanish } from '../../utils/formatters';

/**
 * GoalsTab — Panel premium renovado de metas, evolución e insights con Gemini.
 *
 * @param {string} activeMonth - Mes activo seleccionado "YYYY-MM"
 * @param {Array} transactions - Transacciones asociadas al mes activo
 * @param {Array} allTransactions - Todas las transacciones del sistema para históricos
 */
const GoalsTab = ({ activeMonth, transactions, allTransactions = [] }) => {
  const [history, setHistory] = useState([]);
  const [viewType, setViewType] = useState('monthly'); // 'monthly' | 'semestral' | 'annual'
  const [mobileTab, setMobileTab] = useState('insights'); // 'insights' | 'trends' | 'stats' (exclusivo para mobile)
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // 1. Cargar historial completo de reportes de IA
  const fetchReportHistory = useCallback(async () => {
    try {
      const res = await apiService.getReportHistory();
      if (res.success && res.data) {
        setHistory(res.data);
      }
    } catch (err) {
      console.error('Error al cargar historial de reportes:', err);
    }
  }, []);

  useEffect(() => {
    fetchReportHistory();
  }, [fetchReportHistory]);

  // 2. Deducir período exacto basado en la pestaña de vista seleccionada
  const activePeriod = useMemo(() => {
    if (!activeMonth) return '';
    const [year, month] = activeMonth.split('-');
    
    if (viewType === 'monthly') {
      return activeMonth;
    } else if (viewType === 'semestral') {
      const sem = parseInt(month, 10) <= 6 ? 'S1' : 'S2';
      return `${year}-${sem}`;
    } else {
      return year; // anual
    }
  }, [activeMonth, viewType]);

  // 3. Buscar el reporte de IA correspondiente en el historial
  const selectedReport = useMemo(() => {
    const typeStr = viewType.toUpperCase();
    return history.find((report) => report.period === activePeriod && report.type === typeStr) || null;
  }, [history, activePeriod, viewType]);

  // Parsear score de manera segura
  const reportScore = useMemo(() => {
    if (!selectedReport || !selectedReport.content) return null;
    try {
      let jsonText = selectedReport.content.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```/, '').replace(/```$/, '').trim();
      }
      const parsed = JSON.parse(jsonText);
      return parsed.score || 70;
    } catch (e) {
      return 70; // Score por defecto en caso de fallback
    }
  }, [selectedReport]);

  // 4. Generar reporte bajo demanda (enviando tipo y periodo)
  const handleGenerateReport = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await apiService.generateReport(viewType.toUpperCase(), activePeriod, true);
      if (res.success && res.data) {
        await fetchReportHistory();
      }
    } catch (err) {
      console.error('Error al generar reporte de IA:', err);
      setApiError(err.message || 'Error al comunicarse con el motor de IA.');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Estado derivado: ingresos y gastos mensuales calculados cliente-side
  const { totalIncome, totalExpense } = useMemo(() => {
    const income = transactions
      .filter((tx) => tx.type === 'INCOME')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const expense = transactions
      .filter((tx) => tx.type === 'EXPENSE')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    return { totalIncome: income, totalExpense: expense };
  }, [transactions]);

  // Cambiar tipo de reporte
  const handleViewTypeChange = (type) => {
    startTransition(() => {
      setViewType(type);
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        padding: '0 0.5rem 2rem 0.5rem',
      }}
    >


      {/* Encabezado Principal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PiggyBank style={{ color: 'var(--primary)' }} />
            <span>Metas e Insights Inteligentes</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500, marginTop: '0.25rem' }}>
            {viewType === 'monthly' && `Análisis del mes seleccionado de ${getMonthNameSpanish(activeMonth)}.`}
            {viewType === 'semestral' && `Análisis agregado del semestre activo (${activePeriod}).`}
            {viewType === 'annual' && `Análisis general e histórico del año fiscal ${activePeriod}.`}
          </p>
        </div>

        {/* Selector de Rango de Análisis (Mensual, Semestral, Anual) */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-secondary)',
            padding: '3px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {['monthly', 'semestral', 'annual'].map((type) => {
            const label = type === 'monthly' ? 'Mensual' : type === 'semestral' ? 'Semestral' : 'Anual';
            const isActive = viewType === type;
            return (
              <button
                key={type}
                onClick={() => handleViewTypeChange(type)}
                style={{
                  padding: '0.45rem 1.1rem',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--bg-primary)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pestañas para Mobile (Sólo visibles en pantallas chicas) */}
      <div className="mobile-tabs-container">
        <button
          className={`mobile-tab-btn ${mobileTab === 'insights' ? 'active' : ''}`}
          onClick={() => setMobileTab('insights')}
        >
          <Sparkles size={14} />
          <span>Insights IA</span>
        </button>
        <button
          className={`mobile-tab-btn ${mobileTab === 'trends' ? 'active' : ''}`}
          onClick={() => setMobileTab('trends')}
        >
          <BarChart3 size={14} />
          <span>Tendencias</span>
        </button>
        <button
          className={`mobile-tab-btn ${mobileTab === 'stats' ? 'active' : ''}`}
          onClick={() => setMobileTab('stats')}
        >
          <TrendingUp size={14} />
          <span>Ahorro</span>
        </button>
      </div>

      {/* Grid del Contenido Principal */}
      <div className="goals-main-grid">
        
        {/* SECCIÓN 1: Resumen de IA & Gamificación */}
        <div className={`section-block ${mobileTab === 'insights' ? 'mobile-visible' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {apiError && (
            <div
              className="alert alert-error animate-fade-in"
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <Info size={16} />
              <div>
                <span style={{ fontWeight: 800 }}>Error al generar reporte: </span>
                {apiError}
              </div>
            </div>
          )}

          <div className="ai-insights-section">
            {/* Si existe informe generado, renderizamos el ScoreGauge al lado */}
            {selectedReport && reportScore !== null && (
              <ScoreGauge score={reportScore} />
            )}

            <AiInsightCard
              report={selectedReport}
              isLoading={isLoading}
              onGenerate={handleGenerateReport}
              activeMonth={activeMonth}
            />
          </div>
        </div>

        {/* SECCIÓN 2: Tendencias y Evolución Temporal (Gráficos de Barras) */}
        <div className={`section-block ${mobileTab === 'trends' ? 'mobile-visible' : ''}`} style={{ display: 'flex', width: '100%' }}>
          <HistoryBarChart
            activeMonth={activeMonth}
            allTransactions={allTransactions}
          />
        </div>

        {/* SECCIÓN 3: Estadísticas Generales de Ahorro y Balance */}
        <div className={`section-block ${mobileTab === 'stats' ? 'mobile-visible' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Sólo mostramos las estadísticas mensuales si estamos en la pestaña mensual */}
          {viewType === 'monthly' ? (
            <div className="stats-grid-container">
              <SavingsGauge totalIncome={totalIncome} totalExpense={totalExpense} />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <StatsCardGrid transactions={transactions} activeMonth={activeMonth} />
              </div>
            </div>
          ) : (
            <div
              className="card glass-container"
              style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <Info size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Las métricas mensuales detalladas e índices de ahorro de tasa fija están optimizados para la vista <strong>Mensual</strong>. Alterna a ella para ver balances diarios.
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default GoalsTab;
