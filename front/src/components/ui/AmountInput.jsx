import React from 'react';

/**
 * AmountInput — component specialized in amount fields.
 * Restricts input to positive floating numbers (digits and at most one decimal point),
 * displays a decimal keyboard on mobile devices, and unifies the visual design.
 */
const AmountInput = ({
  value,
  onChange,
  placeholder = '0.00',
  disabled = false,
  className = '',
  id,
  name,
  required = false,
  textAlign = 'left',
  style = {},
  error = false,
}) => {
  const handleChange = (e) => {
    let val = e.target.value;
    
    // Replace comma with dot automatically
    val = val.replace(',', '.');
    
    // Only match valid decimal numbers
    const match = val.match(/^\d*\.?\d*$/);
    
    if (match !== null) {
      if (onChange) {
        onChange({
          target: {
            name,
            id,
            value: val
          }
        });
      }
    }
  };

  const handleKeyDown = (e) => {
    // Allow control and navigation keys
    if (
      ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) ||
      (e.ctrlKey === true || e.metaKey === true) // Ctrl/Cmd combinations
    ) {
      return;
    }

    // Allow digits and decimal separators
    const isDigit = /^[0-9]$/.test(e.key);
    const isDecimalSeparator = e.key === '.' || e.key === ',';

    if (!isDigit && !isDecimalSeparator) {
      e.preventDefault();
    }

    // Block multiple decimal points
    if (isDecimalSeparator && (value?.toString().includes('.') || value?.toString().includes(','))) {
      e.preventDefault();
    }
  };

  return (
    <div className="amount-input-wrapper" style={{ position: 'relative', display: 'inline-flex', width: '100%' }}>
      <span className="amount-input-symbol" style={{
        position: 'absolute',
        left: '1rem',
        top: '50%',
        transform: 'translateY(-50%)',
        color: error ? 'var(--error)' : 'var(--text-secondary)',
        fontWeight: 600,
        pointerEvents: 'none',
        zIndex: 2,
        transition: 'color 0.2s',
      }}>
        $
      </span>
      <input
        id={id}
        name={name}
        type="text"
        inputMode="decimal"
        pattern="[0-9]*\.?[0-9]*"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        required={required}
        className={`form-input amount-input-field ${error ? 'error-border' : ''} ${className}`}
        style={{
          paddingLeft: '2rem',
          textAlign: textAlign,
          width: '100%',
          ...style,
        }}
      />
    </div>
  );
};

export default AmountInput;
