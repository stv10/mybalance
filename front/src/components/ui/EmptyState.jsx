import React from 'react';

/**
 * EmptyState — estado vacío reutilizable con icono, título, descripción y acción opcional.
 *
 * @param {React.ReactNode} icon
 * @param {string} iconBg - color de fondo del contenedor del icono
 * @param {string} title
 * @param {React.ReactNode} description
 * @param {React.ReactNode} action - botón u otro elemento de acción
 * @param {React.CSSProperties} style
 */
const EmptyState = ({ icon, iconBg, title, description, action, style }) => {
  return (
    <div className="dashboard-empty-state" style={style}>
      <div
        className="empty-state-icon-container"
        style={iconBg ? { backgroundColor: iconBg } : undefined}
      >
        {icon}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && (
        <p className="empty-state-description">{description}</p>
      )}
      {action && (
        <div className="empty-state-action">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
