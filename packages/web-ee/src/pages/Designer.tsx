/**
 * @file Designer.tsx
 * @description 模型设计器页
 */

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

const Designer: React.FC = () => {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState('model');

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* 左侧模型树 */}
      <aside style={{ width: '260px', backgroundColor: '#fff', borderRight: '1px solid #e5e7eb' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <input
            type="text"
            placeholder="搜索模型..."
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>
        <div style={{ padding: '8px' }}>
          {['订单模型', '用户模型', '商品模型', '库存模型'].map(name => (
            <div
              key={name}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                marginBottom: '4px',
              }}
            >
              📋 {name}
            </div>
          ))}
        </div>
      </aside>

      {/* 中间 Canvas */}
      <main style={{ flex: 1, backgroundColor: '#f8fafc', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 16, left: 16, color: '#6b7280' }}>
          📐 模型设计画布 - {projectId || '新项目'}
        </div>
        {/* Canvas 渲染区域 - 由 canvas-render 模块提供 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <span style={{ color: '#9ca3af' }}>拖拽添加数据表到画布</span>
        </div>
      </main>

      {/* 右侧属性面板 */}
      <aside style={{ width: '320px', backgroundColor: '#fff', borderLeft: '1px solid #e5e7eb' }}>
        <div style={{ borderBottom: '1px solid #e5e7eb' }}>
          {['model', 'field', 'relation'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 16px',
                border: 'none',
                backgroundColor: activeTab === tab ? '#3b82f6' : 'transparent',
                color: activeTab === tab ? '#fff' : '#374151',
                cursor: 'pointer',
              }}
            >
              {tab === 'model' ? '模型' : tab === 'field' ? '字段' : '关系'}
            </button>
          ))}
        </div>
        <div style={{ padding: '16px' }}>
          {activeTab === 'model' && (
            <div>
              <h4 style={{ marginBottom: '16px' }}>模型属性</h4>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>表名</label>
                <input type="text" defaultValue="orders" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>显示名</label>
                <input type="text" defaultValue="订单表" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>描述</label>
                <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>
          )}
          {activeTab === 'field' && (
            <div>
              <h4 style={{ marginBottom: '16px' }}>字段属性</h4>
              <p style={{ color: '#9ca3af' }}>选择字段查看属性</p>
            </div>
          )}
          {activeTab === 'relation' && (
            <div>
              <h4 style={{ marginBottom: '16px' }}>关系属性</h4>
              <p style={{ color: '#9ca3af' }}>选择关系线查看属性</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
};

export default Designer;
