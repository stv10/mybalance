import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';

/**
 * DatePicker — wraps standard HTML5 date input with Lucide Calendar icon
 * and makes the whole field clickable to trigger showPicker() programmatically.
 */
const DatePicker = ({
  value,
  onChange,
  disabled = false,
  className = '',
  id,
  name,
  required = false,
  error = false,
}) => {
  const inputRef = useRef(null);

  const handleClick = () => {
    if (inputRef.current && !disabled) {
      try {
        // Modern programmatic trigger for browser's date picker dropdown
        inputRef.current.showPicker();
      } catch (err) {
        // Fallback for older browsers
        inputRef.current.focus();
      }
    }
  };

  return (
    <div 
      className="date-picker-wrapper" 
      onClick={handleClick}
      style={{ 
        position: 'relative', 
        display: 'inline-flex', 
        width: '100%',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    >
      <span className="date-picker-icon" style={{
        position: 'absolute',
        left: '1rem',
        top: '50%',
        transform: 'translateY(-50%)',
        color: error ? 'var(--error)' : 'var(--text-secondary)',
        pointerEvents: 'none',
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Calendar size={18} />
      </span>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="date"
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`form-input date-picker-input ${error ? 'error-border' : ''} ${className}`}
        style={{
          paddingLeft: '2.75rem',
          width: '100%',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      />
    </div>
  );
};

export default DatePicker;
