import React from 'react';
import type { InputProps } from '../types';

export const Input: React.FC<InputProps> = ({
  value,
  placeholder,
  disabled = false,
  error,
  prefix,
  suffix,
  className = '',
  style,
  onChange,
  onEnter,
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
    borderRadius: '6px',
    padding: '0 12px',
    backgroundColor: '#fff',
    height: '36px',
    transition: 'border-color 0.2s ease',
    ...style,
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    backgroundColor: 'transparent',
    color: disabled ? '#9ca3af' : '#374151',
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onEnter) {
      onEnter();
    }
  };

  return (
    <div className={className}>
      <div style={containerStyle}>
        {prefix && <span style={{ marginRight: '8px', color: '#6b7280' }}>{prefix}</span>}
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          style={inputStyle}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {suffix && <span style={{ marginLeft: '8px', color: '#6b7280' }}>{suffix}</span>}
      </div>
      {error && (
        <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
