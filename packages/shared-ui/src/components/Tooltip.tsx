import React, { useState, useRef, useEffect } from 'react';
import type { TooltipProps } from '../types';

export const Tooltip: React.FC<TooltipProps> = ({
  title,
  placement = 'top',
  trigger = 'hover',
  children,
  className = '',
  style,
}) => {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };

    if (trigger === 'click') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [trigger]);

  const getPosition = (): React.CSSProperties => {
    const positions: Record<string, React.CSSProperties> = {
      top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' },
      bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' },
      left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' },
      right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' },
    };
    return positions[placement];
  };

  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    ...getPosition(),
    backgroundColor: '#1f2937',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    zIndex: 1000,
    pointerEvents: 'none',
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.2s ease',
  };

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', display: 'inline-block', ...style }}
      className={className}
      onMouseEnter={() => trigger === 'hover' && setVisible(true)}
      onMouseLeave={() => trigger === 'hover' && setVisible(false)}
      onClick={() => trigger === 'click' && setVisible(!visible)}
    >
      {children}
      <div style={tooltipStyle}>{title}</div>
    </div>
  );
};

export default Tooltip;
