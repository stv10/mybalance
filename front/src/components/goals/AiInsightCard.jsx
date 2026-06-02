import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, BrainCircuit, RefreshCw, AlertTriangle, CheckCircle2, Lightbulb, TrendingDown, ArrowRight } from 'lucide-react';
import { getMonthNameSpanish } from '../../utils/formatters';

/**
 * AiInsightCard — Tarjeta interactiva premium para visualizar los reportes generados por la IA.
 *
 * @param {Object} report - El objeto de reporte de IA activo ({ content, period, type })
 * @param {boolean} isLoading - Indicador de estado de carga
 * @param {Function} onGenerate - Callback para generar el reporte manualmente
 * @param {string} activeMonth - El período activo en formato "YYYY-MM"
 */
const AiInsightCard = ({ report, isLoading, onGenerate, activeMonth }) => {
  const [loadingText, setLoadingText] = useState('Analizando tu balance...');

  // Rotación dinámica de mensajes de carga de IA
  useEffect(() => {
    if (!isLoading) return;

    const texts = [
      'Agrupando transacciones por categoría...',
      'Calculando tu tasa de ahorro del mes...',
      'Consultando con Gemini 2.5 Flash...',
      'Redactando consejos personalizados...',
      'Casi listo, aplicando formato final...'
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % texts.length;
      setLoadingText(texts[currentIndex]);
    }, 2500);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Parsear el contenido estructurado JSON de manera segura con soporte retrocompatible
  const parsedData = useMemo(() => {
    if (!report || !report.content) return null;
    
    try {
      // Limpiar posibles bloques markdown si Gemini los agrega por error
      let jsonText = report.content.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```/, '').replace(/```$/, '').trim();
      }
      return JSON.parse(jsonText);
    } catch (e) {
      console.warn('Failed to parse AI report JSON content, using legacy fallback:', e);
      // Fallback para reportes antiguos que venían en texto plano/markdown
      return {
        resumen: report.content,
        acciones: [],
        alerta: null,
        score: null
      };
    }
  }, [report]);

  // Renderizar estado de carga
  if (isLoading) {
    return (
      <div
        className="card glass-container animate-fade-in"
        style={{
          padding: '2.5rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-md)',
          minHeight: '300px',
        }}
      >
        <div style={{ position: 'relative' }}>
          {/* Anillo de carga pulsante */}
          <div
            className="spinner"
            style={{
              width: '56px',
              height: '56px',
              border: '3px solid rgba(99, 102, 241, 0.1)',
              borderTopColor: 'var(--primary)',
            }}
          />
          <BrainCircuit
            size={24}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'var(--primary)',
            }}
            className="animate-pulse"
          />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Generando Reporte Inteligente
          </h4>
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
              minHeight: '1.2rem',
            }}
          >
            {loadingText}
          </p>
        </div>
      </div>
    );
  }

  // Renderizar estado vacío (sin reporte registrado para el mes)
  if (!report || !parsedData) {
    return (
      <div
        className="card glass-container animate-fade-in"
        style={{
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          boxShadow: 'var(--shadow-md)',
          textAlign: 'center',
          minHeight: '300px',
          background: 'linear-gradient(135deg, var(--bg-secondary) 0%, rgba(99,102,241,0.03) 100%)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--primary-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.15)',
          }}
        >
          <Sparkles size={28} />
        </div>

        <div style={{ maxWidth: '460px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Tu Informe de IA para {getMonthNameSpanish(activeMonth)}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', fontWeight: 500 }}>
            Obtén un informe financiero redactado en tiempo real por un analista virtual. 
            Gemini agrupará tus consumos, detectará fugas de dinero y te dará consejos accionables personalizados.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={onGenerate}
          style={{
            width: 'auto',
            padding: '0.6rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
          }}
        >
          <BrainCircuit size={16} />
          <span>Generar Análisis de IA</span>
        </button>
      </div>
    );
  }

  // Mapear los iconos para las tres acciones
  const actionIcons = [
    { Icon: CheckCircle2, iconColor: 'var(--success)', bg: 'var(--success-glow)' },
    { Icon: Lightbulb, iconColor: 'var(--primary)', bg: 'var(--primary-glow)' },
    { Icon: TrendingDown, iconColor: '#f59e0b', bg: 'rgba(245,158,11,0.1)' }
  ];

  return (
    <div
      className="card glass-container animate-fade-in"
      style={{
        padding: '1.75rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        boxShadow: 'var(--shadow-md)',
        background: 'linear-gradient(180deg, var(--bg-secondary) 0%, rgba(99, 102, 241, 0.01) 100%)',
        flex: '1 1 450px',
      }}
    >
      {/* Cabecera del Informe */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <BrainCircuit size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
              Revisión Financiera con IA
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
              Generado con Gemini 2.5 Flash
            </p>
          </div>
        </div>

        <button
          className="btn btn-outline"
          onClick={onGenerate}
          style={{
            width: 'auto',
            padding: '0.4rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            height: '32px',
          }}
          title="Recalcular análisis"
        >
          <RefreshCw size={12} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* 1. Sección Resumen Principal */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
          Diagnóstico del Período
        </h4>
        <p
          style={{
            fontSize: '1rem',
            lineHeight: '1.6',
            color: 'var(--text-primary)',
            fontWeight: 600,
            margin: 0,
          }}
        >
          {parsedData.resumen}
        </p>
      </div>

      {/* 2. Sección de Puntos de Acción (Solo si existen) */}
      {parsedData.acciones && parsedData.acciones.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
            Plan de Acción Recomendado
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {parsedData.acciones.map((accion, idx) => {
              // Mapear icono y color según el índice (cíclico por si hay más de 3)
              const config = actionIcons[idx % actionIcons.length];
              const { Icon, iconColor, bg } = config;
              
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    transition: 'transform 0.2s ease',
                  }}
                  className="hover-scale"
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: iconColor,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {accion}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Sección de Advertencia / Anomalia (Solo si existe) */}
      {parsedData.alerta && (
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.06)',
            padding: '0.85rem 1.1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            alignItems: 'center',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.05)',
          }}
          className="animate-pulse"
        >
          <AlertTriangle size={18} style={{ color: 'var(--error)', flexShrink: 0 }} />
          <div>
            <h5 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--error)', margin: '0 0 0.1rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Alerta de Consumo Detectada
            </h5>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, margin: 0 }}>
              {parsedData.alerta}
            </p>
          </div>
        </div>
      )}

      {/* Pie informativo */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          backgroundColor: 'rgba(99,102,241,0.03)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(99,102,241,0.06)',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Este diagnóstico ha sido estructurado por Gemini 2.5 Flash en base a tus datos reales.
        </span>
      </div>
    </div>
  );
};

export default React.memo(AiInsightCard);
