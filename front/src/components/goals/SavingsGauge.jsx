import React from 'react';
import { PiggyBank, Award, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

/**
 * SavingsGauge — Visualización circular premium de la tasa de ahorro del mes.
 *
 * @param {number} totalIncome - Ingresos totales
 * @param {number} totalExpense - Egresos totales
 */
const SavingsGauge = ({ totalIncome, totalExpense }) => {
  const savings = totalIncome - totalExpense;
  
  // Tasa de ahorro calculada en tiempo de ejecución
  let savingsRate = 0;
  if (totalIncome > 0) {
    savingsRate = (savings / totalIncome) * 100;
  }

  // Clampear valor para el gauge circular
  const displayRate = Math.max(0, Math.min(savingsRate, 100));

  // Parámetros de trazado del círculo SVG (Radio = 52, Circunferencia = ~326.7)
  const radius = 52;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayRate / 100) * circumference;

  // Determinar niveles e información de estatus
  let statusText = 'Déficit Financiero';
  let statusColor = 'var(--error)';
  let statusBg = 'var(--error-glow)';
  let statusMessage = 'Gastaste más de lo que ingresó. Te recomendamos revisar tus gastos fijos.';

  if (savingsRate >= 20) {
    statusText = 'Ahorro Saludable';
    statusColor = 'var(--success)';
    statusBg = 'var(--success-glow)';
    statusMessage = '¡Excelente! Cumpliste con creces la regla de ahorro recomendada del 20%.';
  } else if (savingsRate >= 10) {
    statusText = 'Ahorro Moderado';
    statusColor = '#f59e0b'; // Amber
    statusBg = 'rgba(245, 158, 11, 0.1)';
    statusMessage = 'Buen camino. Intenta recortar ocio para alcanzar la meta del 20% el próximo mes.';
  } else if (savingsRate >= 0) {
    statusText = 'Ahorro Crítico';
    statusColor = 'var(--primary)';
    statusBg = 'var(--primary-glow)';
    statusMessage = 'Tu ahorro es bajo. Intenta automatizar un 10% apenas cobres tus ingresos.';
  }

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
        minHeight: '280px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PiggyBank size={18} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Meta de Ahorro Mensual</h3>
        </div>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.25rem 0.6rem',
            borderRadius: '100px',
            backgroundColor: statusBg,
            color: statusColor,
            border: `1px solid ${statusColor}20`,
          }}
        >
          {statusText}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', padding: '0.5rem 0' }}>
        {/* SVG Gauge circular */}
        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
          <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            {/* Círculo de fondo */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="var(--border-color)"
              strokeWidth={strokeWidth}
            />
            {/* Círculo de progreso */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="url(#gaugeGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.8s ease-in-out',
              }}
            />
          </svg>
          {/* Texto central */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {savingsRate.toFixed(0)}%
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.25rem' }}>
              ahorrado
            </span>
          </div>
        </div>

        {/* Resumen numérico */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, minWidth: '150px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700 }}>AHORRO NETO</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: savings >= 0 ? 'var(--success)' : 'var(--error)' }}>
              {formatCurrency(savings)}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>INGRESOS</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {formatCurrency(totalIncome)}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>GASTOS</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {formatCurrency(totalExpense)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          backgroundColor: 'var(--bg-primary)',
          padding: '0.75rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          alignItems: 'flex-start',
        }}
      >
        <Award size={16} style={{ color: statusColor, flexShrink: 0, marginTop: '0.1rem' }} />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0, fontWeight: 500 }}>
          {statusMessage}
        </p>
      </div>
    </div>
  );
};

export default React.memo(SavingsGauge);
