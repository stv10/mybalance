import React, { useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, TrendingDown, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { apiService } from '../../services/api';
import GlobalStatsCard from './GlobalStatsCard';
import CategoryGroupCard from './CategoryGroupCard';
import PayModal from './PayModal';

/**
 * BudgetComparisonView — Orquestador modular del seguimiento mensual.
 * Implementa Vercel React Best Practices mediante separación de componentes,
 * encapsulación de formularios y callbacks memorizados.
 */
const BudgetComparisonView = ({ 
  comparisonData, 
  monthLabel, 
  accounts = [], 
  onGoToConfig, 
  onGenerateBudget, 
  isGenerating,
  onRegenerateBudget,
  isRegenerating,
  setComparisonData,
  showToast,
  onRefreshData
}) => {
  const { 
    monthlyBudgetId = null, 
    totalLimit = 0, 
    totalSpent = 0, 
    percentVida = 0,
    percentOcio = 0,
    percentInversionDeuda = 0,
    items = [] 
  } = comparisonData || {};

  const hasBudget = monthlyBudgetId !== null;

  // Estado del modal de pago e interfaz
  const [payingItem, setPayingItem] = useState(null);
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  const paidItems = useMemo(() => {
    return items.filter(item => item.paid);
  }, [items]);

  // Contabilizar ítems vencidos sin pagar en el mes activo
  const overdueCount = useMemo(() => {
    return items.filter(item => {
      if (item.paid || !item.dueDate) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(`${item.dueDate}T00:00:00`);
      due.setHours(0, 0, 0, 0);
      return due < today;
    }).length;
  }, [items]);

  // Agrupar ítems por categoría base de seed (Vida, Ocio, Inversion-Deuda)
  const itemsByBaseCategory = useMemo(() => {
    const grouped = {
      'Vida': { items: [], maxLimit: (totalLimit * percentVida) / 100, percent: percentVida },
      'Ocio': { items: [], maxLimit: (totalLimit * percentOcio) / 100, percent: percentOcio },
      'Inversion-Deuda': { items: [], maxLimit: (totalLimit * percentInversionDeuda) / 100, percent: percentInversionDeuda }
    };

    const getDueDayVal = (item) => {
      const val = item.dueDay;
      if (val === null || val === undefined || val === '') return Infinity;
      const num = parseInt(val, 10);
      return isNaN(num) ? Infinity : num;
    };

    const sortedItems = [...items].sort((a, b) => {
      const valA = getDueDayVal(a);
      const valB = getDueDayVal(b);
      if (valA === valB) return 0;
      return valA - valB;
    });

    sortedItems.forEach(item => {
      const catName = item.baseCategoryName || 'Vida'; // fallback seguro
      if (grouped[catName]) {
        grouped[catName].items.push(item);
      } else {
        grouped['Vida'].items.push(item);
      }
    });

    return grouped;
  }, [items, totalLimit, percentVida, percentOcio, percentInversionDeuda]);

  // Handlers estables con useCallback para optimizar re-renders
  const handleOpenPayModal = useCallback((item) => {
    setPayingItem(item);
  }, []);

  const handleClosePayModal = useCallback(() => {
    setPayingItem(null);
  }, []);

  const handleConfirmPay = useCallback(async ({ itemId, accountId, amount, date }) => {
    setIsSubmittingPay(true);
    try {
      const res = await apiService.payBudgetItem(itemId, { accountId, amount, date });
      if (res.success) {
        showToast(`Pago registrado con éxito`, 'success');
        setComparisonData(res.data);
        setPayingItem(null);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      showToast(err.message || 'Error al registrar el pago', 'error');
    } finally {
      setIsSubmittingPay(false);
    }
  }, [showToast, setComparisonData, onRefreshData]);

  const handleUnpayItem = useCallback(async (item) => {
    if (!window.confirm(`¿Estás seguro de que deseas cancelar el pago de "${item.name}"? Se eliminará la transacción y se restaurará el saldo de la cuenta.`)) {
      return;
    }
    try {
      const res = await apiService.unpayBudgetItem(item.id);
      if (res.success) {
        showToast(`Pago cancelado para "${item.name}"`, 'success');
        setComparisonData(res.data);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      showToast(err.message || 'Error al cancelar el pago', 'error');
    }
  }, [showToast, setComparisonData, onRefreshData]);

  // Si no hay presupuesto creado aún
  if (!hasBudget) {
    return (
      <div className="card glass-container animate-fade-in" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <TrendingDown size={32} style={{ color: 'var(--primary)' }} />
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>Presupuesto no generado</h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
          El presupuesto de seguimiento de gastos para el mes de <strong>{monthLabel}</strong> aún no ha sido creado.
          Puedes generarlo automáticamente a partir de tu <strong>Plantilla Modelo</strong> para comenzar a monitorear tus límites.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary" 
            onClick={onGenerateBudget} 
            disabled={isGenerating}
            style={{ width: 'auto', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {isGenerating ? (
              <>
                <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', margin: 0 }} />
                <span>Generando...</span>
              </>
            ) : (
              <span>Generar Presupuesto del Mes</span>
            )}
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={onGoToConfig}
            style={{ width: 'auto', padding: '0.75rem 1.5rem' }}
          >
            Configurar Plantilla Modelo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="budget-comparison-view animate-fade-in">
      {/* HEADER DE CONTROL */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem', 
        flexWrap: 'wrap', 
        gap: '1rem',
        padding: '0 0.5rem'
      }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Seguimiento de meta y consumos del mes activo.
        </span>
        <button
          className="btn btn-secondary"
          onClick={() => setShowRegenerateConfirm(true)}
          style={{ 
            width: 'auto', 
            padding: '0.5rem 1rem', 
            fontSize: '0.85rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            borderColor: 'var(--warning)', 
            color: 'var(--warning)', 
            backgroundColor: 'rgba(245, 158, 11, 0.04)',
            fontWeight: 600,
            transition: 'all 0.2s ease'
          }}
        >
          <RefreshCw size={14} className={isRegenerating ? "animate-spin" : ""} />
          <span>Regenerar desde Plantilla</span>
        </button>
      </div>

      {/* TARJETA DE ESTADÍSTICAS GLOBALES */}
      <GlobalStatsCard totalLimit={totalLimit} totalSpent={totalSpent} />

      {/* Alerta de Ítems Vencidos */}
      {overdueCount > 0 && (
        <div className="alert alert-error animate-fade-in" style={{ 
          padding: '1rem 1.5rem', 
          borderRadius: 'var(--radius-md)', 
          display: 'flex', 
          gap: '0.75rem', 
          alignItems: 'center',
          marginBottom: '2rem',
          borderLeft: '4px solid var(--error)',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          color: 'var(--error)'
        }}>
          <AlertTriangle size={20} style={{ color: 'var(--error)', flexShrink: 0 }} />
          <div>
            <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--error)' }}>Ítems Vencidos Detectados</h4>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Tienes <strong>{overdueCount} {overdueCount === 1 ? 'ítem' : 'ítems'}</strong> de presupuesto pendiente que ya ha superado su fecha de vencimiento. 
              Regístralos como pagados para actualizar tu balance.
            </p>
          </div>
        </div>
      )}

      {/* DETALLE AGRUPADO POR CATEGORÍA BASE */}
      <div style={{ display: 'grid', gap: '2rem' }}>
        {Object.entries(itemsByBaseCategory).map(([catName, data]) => (
          <CategoryGroupCard 
            key={catName} 
            catName={catName} 
            data={data} 
            onGoToConfig={onGoToConfig}
            onPay={handleOpenPayModal}
            onUnpay={handleUnpayItem}
          />
        ))}
      </div>

      {/* MODAL DE REGISTRO DE PAGO */}
      <PayModal 
        payingItem={payingItem}
        accounts={accounts}
        onClose={handleClosePayModal}
        onConfirm={handleConfirmPay}
        isSubmitting={isSubmittingPay}
      />

      {/* MODAL DE ADVERTENCIA PARA REGENERAR PRESUPUESTO */}
      {showRegenerateConfirm && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} className="animate-fade-in">
          
          <div className="card glass-container animate-scale-up" style={{ 
            width: '100%', 
            maxWidth: '520px', 
            padding: '2.25rem', 
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)'
          }}>
            
            {/* Encabezado del Modal */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(245, 158, 11, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <AlertTriangle size={24} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  ¿Regenerar presupuesto de {monthLabel}?
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Esta acción restablecerá el presupuesto mensual.</span>
              </div>
            </div>

            {/* Advertencias */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '1.75rem' }}>
              <p>
                Se volverán a importar todos los límites y los ítems de gastos correspondientes a tu <strong>Plantilla Modelo</strong> actual.
              </p>
              
              <div style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.06)', 
                borderLeft: '4px solid var(--error)', 
                padding: '1rem', 
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)'
              }}>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--error)' }}>
                  ⚠️ Advertencia Crítica de Pagos
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Los ítems que ya han sido marcados como <strong>PAGADOS</strong> en este mes se restablecerán a su estado sugerido/pendiente. 
                  Sus transacciones de egreso correspondientes <strong>serán ELIMINADAS permanentemente</strong>, restaurando el balance de las cuentas debitadas.
                </p>
              </div>

              {/* Lista de ítems pagados afectados */}
              {paidItems.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
                    Ítems pagados que serán afectados ({paidItems.length}):
                  </span>
                  <div style={{ 
                    maxHeight: '120px', 
                    overflowY: 'auto', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem',
                    display: 'grid',
                    gap: '0.4rem',
                    backgroundColor: 'var(--bg-secondary)'
                  }}>
                    {paidItems.map(item => (
                       <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.2rem 0.4rem' }}>
                         <span style={{ fontWeight: 600 }}>{item.name}</span>
                         <span style={{ color: 'var(--error)', fontWeight: 700 }}>-{formatCurrency(item.paidAmount)}</span>
                       </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowRegenerateConfirm(false)}
                disabled={isRegenerating}
                style={{ width: 'auto', padding: '0.6rem 1.5rem' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    await onRegenerateBudget();
                    setShowRegenerateConfirm(false);
                  } catch (err) {
                    // El error ya es manejado por el handler en BudgetsTab
                  }
                }}
                disabled={isRegenerating}
                style={{ 
                  width: 'auto', 
                  padding: '0.6rem 1.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  backgroundColor: 'var(--error)',
                  borderColor: 'var(--error)'
                }}
              >
                {isRegenerating ? (
                  <>
                    <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', margin: 0 }} />
                    <span>Regenerando...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    <span>Confirmar y Regenerar</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default BudgetComparisonView;
