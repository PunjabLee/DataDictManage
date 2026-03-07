/**
 * @file MainLayout.tsx
 * @description EE Web 版主布局
 */

import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

interface MenuItem {
  key: string;
  label: string;
  icon: string;
  path: string;
}

const menuItems: MenuItem[] = [
  { key: 'dashboard', label: '控制台', icon: '📊', path: '/dashboard' },
  { key: 'projects', label: '项目管理', icon: '📁', path: '/projects' },
  { key: 'designer', label: '模型设计', icon: '🎨', path: '/designer' },
  { key: 'teams', label: '团队管理', icon: '👥', path: '/teams' },
  { key: 'standards', label: '数据标准', icon: '📋', path: '/standards' },
  { key: 'workflows', label: '工作流', icon: '🔄', path: '/workflows' },
  { key: 'api-platform', label: 'API 平台', icon: '🔌', path: '/api-platform' },
];

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const currentMenu = menuItems.find(item => 
    location.pathname.startsWith(item.path)
  ) || menuItems[0];

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* 侧边栏 */}
      <aside
        style={{
          width: collapsed ? '64px' : '240px',
          backgroundColor: '#1a1a2e',
          color: '#fff',
          transition: 'width 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 20px',
            borderBottom: '1px solid #2d2d44',
          }}
        >
          <span style={{ fontSize: '24px', marginRight: collapsed ? 0 : '12px' }}>🚀</span>
          {!collapsed && <span style={{ fontWeight: 600, fontSize: '18px' }}>DDM-EE</span>}
        </div>

        {/* 菜单 */}
        <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
          {menuItems.map(item => (
            <div
              key={item.key}
              onClick={() => navigate(item.path)}
              style={{
                padding: '12px 20px',
                cursor: 'pointer',
                backgroundColor: currentMenu.key === item.key ? '#16213e' : 'transparent',
                borderLeft: currentMenu.key === item.key ? '3px solid #4cc9f0' : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </div>
          ))}
        </nav>

        {/* 折叠按钮 */}
        <div
          onClick={() => setCollapsed(!collapsed)}
          style={{
            padding: '16px',
            borderTop: '1px solid #2d2d44',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          {collapsed ? '→' : '←'}
        </div>
      </aside>

      {/* 主内容区 */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 顶部栏 */}
        <header
          style={{
            height: '64px',
            backgroundColor: '#fff',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
          }}
        >
          <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>
            {currentMenu.label}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#6b7280' }}>👤 管理员</span>
          </div>
        </header>

        {/* 页面内容 */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#f3f4f6' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
