import React, { useEffect, useState } from 'react';
import { Award, ShieldAlert, Sparkles } from 'lucide-react';

/**
 * ScoreGauge — Gráfico de velocímetro (semicírculo SVG) premium para visualizar el score financiero.
 *
 * @param {number} score - Puntaje de salud financiera (1-100)
 */
const ScoreGauge = ({ score = 70 }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animación suave de carga al montar o cambiar el score
  useEffect(() => {
    let animationFrameId;
    const duration = 1000; // 1s
    const startTime = performance.now();
    const startValue = animatedScore;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing cúbico de salida
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentVal = startValue + (score - startValue) * easeOutCubic;
      
      setAnimatedScore(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [score]);

  // Asegurar límites seguros del score
  const safeScore = Math.max(1, Math.min(score, 100));
  const currentScoreVal = Math.round(animatedScore);

  // Configuración matemática del arco semicircular SVG
  // Arco de radio 50, centro (70, 75). Empieza en (20, 75) y termina en (120, 75)
  const radius = 50;
  const cx = 70;
  const cy = 75;
  const pathLength = Math.PI * radius; // 157.08
  const strokeDashoffset = pathLength - (Math.min(currentScoreVal, 100) / 100) * pathLength;

  // Lógica trigonométrica para calcular la posición exacta de la aguja / punto indicador
  const angle = -180 + (Math.min(currentScoreVal, 100) / 100) * 180; // de -180 a 0 grados
  const angleRad = (angle * Math.PI) / 180;
  const indicatorX = cx + radius * Math.cos(angleRad);
  const indicatorY = cy + radius * Math.sin(angleRad);

  // Determinar nivel de salud financiera
  let levelName = 'Crítico';
  let color = 'var(--error)';
  let glowColor = 'rgba(239, 68, 68, 0.25)';
  let textColor = 'var(--error)';
  let bgGradient = 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.01) 100%)';
  let Icon = ShieldAlert;
  let feedbackText = 'Tu salud financiera requiere atención urgente. Reduce gastos no esenciales.';

  if (score >= 70) {
    levelName = 'Saludable';
    color = 'var(--success)';
    glowColor = 'rgba(16, 185, 129, 0.25)';
    textColor = 'var(--success)';
    bgGradient = 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.01) 100%)';
    Icon = Sparkles;
    feedbackText = '¡Excelente gestión! Mantén tus hábitos de ahorro y optimización de capital.';
  } else if (score >= 40) {
    levelName = 'Moderado';
    color = '#f59e0b'; // Amber
    glowColor = 'rgba(245, 158, 11, 0.25)';
    textColor = '#d97706';
    bgGradient = 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.01) 100%)';
    Icon = Award;
    feedbackText = 'Estás en buen camino. Hay oportunidades de optimización en gastos medianos.';
  }

  return (
    <div
      className="card glass-container"
      style={{
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        background: bgGradient,
        boxShadow: `0 8px 32px 0 ${glowColor}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        minHeight: '260px',
        flex: '1 1 300px',
        textAlign: 'center',
      }}
    >
      {/* Encabezado del Score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%', justifyContent: 'center' }}>
        <Icon size={16} style={{ color }} />
        <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
          Puntaje de Salud Financiera
        </span>
      </div>

      {/* SVG del Velocímetro */}
      <div style={{ position: 'relative', width: '140px', height: '90px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', overflow: 'hidden' }}>
        <svg width="140" height="90" viewBox="0 0 140 90">
          <defs>
            {/* Gradiente dinámico basado en el puntaje */}
            <linearGradient id="scoreGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            
            {/* Sombra de brillo para el indicador */}
            <filter id="indicatorGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Semicírculo de Fondo (Gris) */}
          <path
            d={`M 20 ${cy} A ${radius} ${radius} 0 0 1 120 ${cy}`}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Semicírculo de Progreso (Gradiente de color) */}
          <path
            d={`M 20 ${cy} A ${radius} ${radius} 0 0 1 120 ${cy}`}
            fill="none"
            stroke="url(#scoreGaugeGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={pathLength}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 0.1s ease-out',
            }}
          />

          {/* Punto de Indicación en el arco (Aguja virtual) */}
          <circle
            cx={indicatorX}
            cy={indicatorY}
            r="7"
            fill={color}
            stroke="white"
            strokeWidth="1.5"
            filter="url(#indicatorGlow)"
            style={{
              transition: 'cx 0.1s ease-out, cy 0.1s ease-out',
            }}
          />
        </svg>

        {/* Texto del Score en el Centro Inferior */}
        <div
          style={{
            position: 'absolute',
            bottom: '5px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: '1' }}>
            {currentScoreVal}
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: textColor,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginTop: '0.1rem',
            }}
          >
            {levelName}
          </span>
        </div>
      </div>

      {/* Retroalimentación Textual del Score */}
      <p
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.4',
          fontWeight: 600,
          margin: 0,
          padding: '0 0.5rem',
        }}
      >
        {feedbackText}
      </p>
    </div>
  );
};

export default React.memo(ScoreGauge);
