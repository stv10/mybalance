import React from 'react';

/**
 * SegmentedControl — reutilizable toggle de opciones.
 * Reemplaza los divs duplicados en el modal de transacción y en Settings.
 *
 * @param {{ value: string, label: string }[]} options
 * @param {string} value
 * @param {(value: string) => void} onChange
 * @param {boolean} disabled
 */
const SegmentedControl = ({ options, value, onChange, disabled = false }) => {
  return (
    <div className="segmented-control">
      {options.map((opt) => (
        <div
          key={opt.value}
          className={`segmented-option ${value === opt.value ? 'active' : ''}`}
          onClick={() => !disabled && onChange(opt.value)}
          role="radio"
          aria-checked={value === opt.value}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onChange(opt.value);
            }
          }}
        >
          {opt.label}
        </div>
      ))}
    </div>
  );
};

export default SegmentedControl;
