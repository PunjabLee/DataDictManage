import React from 'react';
import type { ButtonProps } from '../types';

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
  },
  secondary: {
    backgroundColor: '#fff',
    color: '#374151',
    border: '1px solid #d1d5db',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: '#374151',
    border: 'none',
  },
  danger: {
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
  },
};

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { padding: '4px 12px', fontSize: '12px', height: '28px' },
  md: { padding: '8px 16px', fontSize: '14px', height: '36px' },
  lg: { padding: '12px 24px', fontSize: '16px', height: '44px' },
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  children,
  className = '',
  style,
  onClick,
}) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s ease',
    fontWeight: 500,
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style,
  };

  return (
    <button
      className={className}
      style={baseStyle}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span>
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
};

export default Button;
