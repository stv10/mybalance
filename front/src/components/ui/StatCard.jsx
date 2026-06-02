import React from 'react';

/**
 * StatCard — tarjeta KPI reutilizable.
 *
 * @param {string} title
 * @param {string} value
 * @param {React.ReactNode} icon
 * @param {string} iconBg - CSS color para el fondo del icono
 * @param {string} iconColor - CSS color para el icono
 * @param {React.ReactNode} footer
 * @param {string} valueColor - color opcional para el valor
 */
const StatCard = ({ title, value, icon, iconBg, iconColor, footer, valueColor }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span>{title}</span>
        <div className="stat-icon-wrapper" style={{ backgroundColor: iconBg, color: iconColor }}>
          {icon}
        </div>
      </div>
      <span className="stat-value" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </span>
      {footer && (
        <div className="stat-card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export default StatCard;
