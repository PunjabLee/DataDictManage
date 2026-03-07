import React from 'react';
import type { TabsProps, TabPaneProps } from '../types';

export const Tabs: React.FC<TabsProps> = ({
  activeKey,
  onChange,
  children,
  className = '',
  style,
}) => {
  const tabs = React.Children.toArray(children) as React.ReactElement<TabPaneProps>[];
  const currentKey = activeKey || tabs[0]?.key;

  const containerStyle: React.CSSProperties = {
    ...style,
  };

  const tabListStyle: React.CSSProperties = {
    display: 'flex',
    borderBottom: '1px solid #e5e7eb',
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
    color: isActive ? '#3b82f6' : '#6b7280',
    fontWeight: isActive ? 500 : 400,
    transition: 'all 0.2s ease',
    marginBottom: '-1px',
  });

  return (
    <div style={containerStyle} className={className}>
      <div style={tabListStyle}>
        {tabs.map((tab) => (
          <div
            key={tab.key}
            style={tabStyle(tab.key === currentKey)}
            onClick={() => onChange?.(tab.key)}
          >
            {tab.props.title}
          </div>
        ))}
      </div>
      <div style={{ padding: '16px 0' }}>
        {tabs.find((tab) => tab.key === currentKey)}
      </div>
    </div>
  );
};

export const TabPane: React.FC<TabPaneProps> = ({ children }) => {
  return <>{children}</>;
};

export default Tabs;
