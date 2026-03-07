/**
 * @file ApiPlatform.tsx
 * @description API 开放平台页
 */

import React, { useState } from 'react';

interface ApiEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  name: string;
  status: 'published' | 'draft' | 'deprecated';
  calls: number;
}

const mockApis: ApiEndpoint[] = [
  { id: '1', path: '/api/v1/models', method: 'GET', name: '获取模型列表', status: 'published', calls: 1523 },
  { id: '2', path: '/api/v1/models', method: 'POST', name: '创建模型', status: 'published', calls: 456 },
  { id: '3', path: '/api/v1/models/{id}', method: 'GET', name: '获取模型详情', status: 'published', calls: 2341 },
  { id: '4', path: '/api/v1/models/{id}', method: 'PUT', name: '更新模型', status: 'published', calls: 789 },
  { id: '5', path: '/api/v1/models/{id}', method: 'DELETE', name: '删除模型', status: 'draft', calls: 0 },
  { id: '6', path: '/api/v1/fields', method: 'GET', name: '获取字段列表', status: 'published', calls: 987 },
  { id: '7', path: '/api/v1/ddl/generate', method: 'POST', name: '生成 DDL', status: 'deprecated', calls: 123 },
];

const methodColors: Record<string, { bg: string; color: string }> = {
  GET: { bg: '#dbeafe', color: '#2563eb' },
  POST: { bg: '#d1fae5', color: '#059669' },
  PUT: { bg: '#fef3c7', color: '#d97706' },
  DELETE: { bg: '#fee2e2', color: '#dc2626' },
};

const ApiPlatform: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'apis' | 'apps' | 'docs'>('apis');

  return (
    <div style={{ padding: '24px' }}>
      {/* Tab */}
      <div style={{ marginBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
        {(['apis', 'apps', 'docs'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: activeTab === tab ? '#fff' : 'transparent',
              borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === tab ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {tab === 'apis' ? 'API 列表' : tab === 'apps' ? '应用管理' : '文档'}
          </button>
        ))}
      </div>

      {/* API 列表 */}
      {activeTab === 'apis' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="搜索 API..."
              style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', width: '300px' }}
            />
            <button style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              + 新增 API
            </button>
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>接口名称</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>请求方法</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>接口路径</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>状态</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>调用次数</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {mockApis.map(api => (
                  <tr key={api.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{api.name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: methodColors[api.method].bg,
                        color: methodColors[api.method].color,
                      }}>
                        {api.method}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#6b7280' }}>{api.path}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: api.status === 'published' ? '#d1fae5' : api.status === 'draft' ? '#f3f4f6' : '#fee2e2',
                        color: api.status === 'published' ? '#059669' : api.status === 'draft' ? '#6b7280' : '#dc2626',
                      }}>
                        {api.status === 'published' ? '已发布' : api.status === 'draft' ? '草稿' : '已废弃'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{api.calls.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', marginRight: '8px' }}>测试</button>
                      <button style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>详情</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 应用管理 */}
      {activeTab === 'apps' && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔌</div>
          <h3 style={{ fontSize: '18px', color: '#374151', marginBottom: '8px' }}>应用管理</h3>
          <p>创建和管理调用 API 的应用凭证</p>
          <button style={{ marginTop: '16px', padding: '8px 16px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            + 创建应用
          </button>
        </div>
      )}

      {/* 文档 */}
      {activeTab === 'docs' && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
          <h3 style={{ fontSize: '18px', color: '#374151', marginBottom: '8px' }}>API 文档</h3>
          <p>查看完整的 API 接口文档和示例</p>
          <button style={{ marginTop: '16px', padding: '8px 16px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            查看文档
          </button>
        </div>
      )}
    </div>
  );
};

export default ApiPlatform;
