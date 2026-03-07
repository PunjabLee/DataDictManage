import React, { useState, useRef, useEffect } from 'react';
import type { SelectProps } from '../types';

export function Select<T = string>({
  value,
  options,
  placeholder = '请选择',
  disabled = false,
  className = '',
  style,
  onChange,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    ...style,
  };

  const triggerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    minWidth: '160px',
    opacity: disabled ? 0.6 : 1,
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '4px',
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 100,
  };

  const optionStyle: React.CSSProperties = {
    padding: '8px 12px',
    cursor: 'pointer',
  };

  return (
    <div ref={containerRef} style={containerStyle} className={className}>
      <div style={triggerStyle} onClick={() => !disabled && setOpen(!open)}>
        <span style={{ color: selected ? '#111827' : '#9ca3af' }}>
          {selected?.label || placeholder}
        </span>
        <span>▼</span>
      </div>
      {open && (
        <div style={dropdownStyle}>
          {options.map((opt) => (
            <div
              key={String(opt.value)}
              style={{
                ...optionStyle,
                backgroundColor: opt.value === value ? '#f3f4f6' : '#fff',
                color: opt.disabled ? '#9ca3af' : '#374151',
                cursor: opt.disabled ? 'not-allowed' : 'pointer',
              }}
              onClick={(e) => {
                if (!opt.disabled) {
                  onChange?.(opt.value);
                  setOpen(false);
                }
              }}
              onMouseEnter={(e) => {
                if (!opt.disabled) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = opt.value === value ? '#f3f4f6' : '#fff';
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Select;
