import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

/**
 * ConsistencyIndicators — Muestra los resúmenes y alertas de consistencia para el molde de presupuestos.
 * Optimizado con React.memo.
 */
const ConsistencyIndicators = React.memo(({ 
  sumVida, maxVida, percentVida, warningVida,
  sumOcio, maxOcio, percentOcio, warningOcio,
  sumInv, maxInv, percentInversionDeuda, warningInv
}) => {
  return (
    <div style={{ display: 'grid', gap: '1rem', marginTop: '2rem' }}>
      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        Resumen e Indicadores de Consistencia
      </h4>

      {/* Fila Vida */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.5rem', 
        padding: '1rem', 
        borderRadius: 'var(--radius-md)', 
        backgroundColor: warningVida ? 'rgba(245, 158, 11, 0.08)' : 'rgba(34, 197, 94, 0.05)',
        border: `1px solid ${warningVida ? '#f59e0b' : 'rgba(34, 197, 94, 0.3)'}` 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
          <span style={{ color: 'var(--text-primary)' }}>Vida</span>
          <span>Asignado en Ítems: {formatCurrency(sumVida)} de {formatCurrency(maxVida)} (Disp. {percentVida}%)</span>
        </div>
        {warningVida && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#d97706', fontSize: '0.825rem', marginTop: '0.25rem' }}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span><strong>Advertencia:</strong> La suma de ítems para <strong>Vida</strong> excede en {formatCurrency(sumVida - maxVida)} tu límite asignado del {percentVida}%. El plan se guardará normalmente, pero te sugerimos revisar los montos.</span>
          </div>
        )}
      </div>

      {/* Fila Ocio */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.5rem', 
        padding: '1rem', 
        borderRadius: 'var(--radius-md)', 
        backgroundColor: warningOcio ? 'rgba(245, 158, 11, 0.08)' : 'rgba(34, 197, 94, 0.05)',
        border: `1px solid ${warningOcio ? '#f59e0b' : 'rgba(34, 197, 94, 0.3)'}` 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
          <span style={{ color: 'var(--text-primary)' }}>Ocio</span>
          <span>Asignado en Ítems: {formatCurrency(sumOcio)} de {formatCurrency(maxOcio)} (Disp. {percentOcio}%)</span>
        </div>
        {warningOcio && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#d97706', fontSize: '0.825rem', marginTop: '0.25rem' }}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span><strong>Advertencia:</strong> La suma de ítems para <strong>Ocio</strong> excede en {formatCurrency(sumOcio - maxOcio)} tu límite asignado del {percentOcio}%. El plan se guardará normalmente.</span>
          </div>
        )}
      </div>

      {/* Fila Inversion-Deuda */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.5rem', 
        padding: '1rem', 
        borderRadius: 'var(--radius-md)', 
        backgroundColor: warningInv ? 'rgba(245, 158, 11, 0.08)' : 'rgba(34, 197, 94, 0.05)',
        border: `1px solid ${warningInv ? '#f59e0b' : 'rgba(34, 197, 94, 0.3)'}` 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
          <span style={{ color: 'var(--text-primary)' }}>Inversión-Deuda</span>
          <span>Asignado en Ítems: {formatCurrency(sumInv)} de {formatCurrency(maxInv)} (Disp. {percentInversionDeuda}%)</span>
        </div>
        {warningInv && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#d97706', fontSize: '0.825rem', marginTop: '0.25rem' }}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span><strong>Advertencia:</strong> La suma de ítems para <strong>Inversión-Deuda</strong> excede en {formatCurrency(sumInv - maxInv)} tu límite asignado del {percentInversionDeuda}%. El plan se guardará normalmente.</span>
          </div>
        )}
      </div>
    </div>
  );
});

ConsistencyIndicators.displayName = 'ConsistencyIndicators';

export default ConsistencyIndicators;
