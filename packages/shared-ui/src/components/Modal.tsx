import React, { useEffect } from 'react';
import type { ModalProps } from '../types';

const sizeWidths: Record<string, string> = {
  sm: '400px',
  md: '560px',
  lg: '720px',
  xl: '960px',
};

export const Modal: React.FC<ModalProps> = ({
  open,
  title,
  size = 'md',
  closable = true,
  maskClosable = true,
  onClose,
  footer,
  children,
  className = '',
  style,
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && closable) {
        onClose?.();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, closable, onClose]);

  if (!open) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    width: sizeWidths[size],
    maxWidth: '90vw',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    ...style,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  };

  const closeBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px',
  };

  const bodyStyle: React.CSSProperties = {
    padding: '20px',
    overflowY: 'auto',
    flex: 1,
  };

  const footerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 20px',
    borderTop: '1px solid #e5e7eb',
  };

  return (
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget && maskClosable && closable) {
          onClose?.();
        }
      }}
    >
      <div style={modalStyle} className={className}>
        <div}>
          <h3 style={titleStyle}>{title}</h3>
          {closable && (
            <button style={closeBtnStyle} onClick={onClose}>
              ×
            </button>
          )}
        </div>
        <div style={bodyStyle}>{children}</div>
        {footer && <div style={footerStyle}>{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
