import React, { useState, useEffect, useCallback } from 'react';
import { TrendingDown, Sliders, AlertTriangle } from 'lucide-react';
import { apiService } from '../../services/api';
import BudgetComparisonView from './BudgetComparisonView';
import BudgetModelConfig from './BudgetModelConfig';
import { getMonthNameSpanish } from '../../utils/formatters';

const BudgetsTab = ({ activeMonth, categories, accounts = [], showToast, onRefreshData }) => {
  const [subTab, setSubTab] = useState('comparison'); // 'comparison' | 'config'
  
  // Data State
  const [comparisonData, setComparisonData] = useState(null);
  const [budgetModel, setBudgetModel] = useState(null);
  
  // Loading States
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState(null);

  // Convertir activeMonth "YYYY-MM" en mes y año numéricos
  const { month, year } = React.useMemo(() => {
    if (!activeMonth) return { month: null, year: null };
    const [y, m] = activeMonth.split('-');
    return { month: parseInt(m, 10), year: parseInt(y, 10) };
  }, [activeMonth]);

  const monthLabel = React.useMemo(() => {
    return getMonthNameSpanish(activeMonth);
  }, [activeMonth]);

  // Cargar datos comparativos mensuales
  const loadComparison = useCallback(async () => {
    if (!month || !year) return;
    try {
      const res = await apiService.getMonthlyBudgetCompare(month, year);
      if (res.success) {
        setComparisonData(res.data);
      }
    } catch (err) {
      console.error("Error al cargar comparativa de presupuestos", err);
      setError(err.message || "Error al cargar comparativa.");
    }
  }, [month, year]);

  // Cargar plantilla de presupuesto
  const loadBudgetModel = useCallback(async () => {
    try {
      const res = await apiService.getBudgetModel();
      if (res.success) {
        setBudgetModel(res.data);
      }
    } catch (err) {
      console.error("Error al cargar plantilla de presupuesto", err);
    }
  }, []);

  // Cargar todo en conjunto
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([loadComparison(), loadBudgetModel()]);
      setLoading(false);
    };
    initData();
  }, [loadComparison, loadBudgetModel]);

  // Generar presupuesto mensual
  const handleGenerateBudget = async () => {
    setIsGenerating(true);
    try {
      const res = await apiService.generateMonthlyBudget(month, year);
      if (res.success) {
        showToast("Presupuesto mensual generado con éxito", "success");
        setComparisonData(res.data);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      showToast(err.message || "Error al generar el presupuesto", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Regenerar presupuesto mensual desde la plantilla
  const handleRegenerateBudget = async () => {
    setIsRegenerating(true);
    try {
      const res = await apiService.regenerateMonthlyBudget(month, year);
      if (res.success) {
        showToast("Presupuesto del mes regenerado con éxito", "success");
        setComparisonData(res.data);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      showToast(err.message || "Error al regenerar el presupuesto", "error");
    } finally {
      setIsRegenerating(false);
    }
  };

  // Guardar cambios en el presupuesto modelo
  const handleSaveModel = async (modelData) => {
    setIsSaving(true);
    try {
      const res = await apiService.updateBudgetModel(modelData);
      if (res.success) {
        showToast("Plantilla de presupuesto guardada con éxito", "success");
        setBudgetModel(res.data);
        
        // Recargar la comparativa de gastos inmediatamente para reflejar los nuevos límites
        await loadComparison();
        
        // Regresar a la vista comparativa para que el usuario aprecie los resultados
        setSubTab('comparison');
      }
    } catch (err) {
      showToast(err.message || "Error al guardar el presupuesto", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="spinner-container" style={{ minHeight: '30vh', backgroundColor: 'transparent' }}>
        <div className="spinner"></div>
        <p className="loading-text">Cargando datos del presupuesto...</p>
      </div>
    );
  }

  return (
    <div className="budgets-tab-container animate-fade-in" style={{ display: 'grid', gap: '1.5rem' }}>
      
      {/* Cabecera y Switcher de Subpestañas */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid var(--border-color)', 
        paddingBottom: '1rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Presupuesto Mensual</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {subTab === 'comparison' 
              ? `Seguimiento de consumos y límites para ${monthLabel}` 
              : 'Configura tus límites de gasto de referencia habituales'
            }
          </p>
        </div>

        {/* Botones de navegación interna */}
        <div style={{ 
          display: 'flex', 
          backgroundColor: 'var(--border-color)', 
          padding: '0.25rem', 
          borderRadius: 'var(--radius-md)' 
        }}>
          <button
            onClick={() => setSubTab('comparison')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: subTab === 'comparison' ? 'var(--bg-secondary)' : 'transparent',
              color: subTab === 'comparison' ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: subTab === 'comparison' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <TrendingDown size={16} />
            <span>Comparativa</span>
          </button>
          <button
            onClick={() => setSubTab('config')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: subTab === 'config' ? 'var(--bg-secondary)' : 'transparent',
              color: subTab === 'config' ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: subTab === 'config' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Sliders size={16} />
            <span>Ajustar Molde</span>
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-error animate-fade-in" style={{ padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <AlertTriangle size={20} />
          <div>
            <h4 style={{ margin: 0, fontWeight: 700 }}>Ocurrió un inconveniente</h4>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>{error}</p>
          </div>
        </div>
      ) : (
        <div className="sub-tab-content">
          {subTab === 'comparison' ? (
            <BudgetComparisonView 
              comparisonData={comparisonData}
              monthLabel={monthLabel}
              accounts={accounts}
              onGoToConfig={() => setSubTab('config')}
              onGenerateBudget={handleGenerateBudget}
              isGenerating={isGenerating}
              onRegenerateBudget={handleRegenerateBudget}
              isRegenerating={isRegenerating}
              setComparisonData={setComparisonData}
              showToast={showToast}
              onRefreshData={onRefreshData}
            />
          ) : (
            <BudgetModelConfig 
              categories={categories}
              initialModel={budgetModel}
              onSave={handleSaveModel}
              isSaving={isSaving}
            />
          )}
        </div>
      )}

    </div>
  );
};

export default BudgetsTab;
