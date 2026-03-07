/**
 * @file DataStandard.tsx
 * @description 数据标准管理页
 */

import React, { useState } from 'react';

interface DataItem {
  id: string;
  name: string;
  code: string;
  type: string;
  description: string;
}

interface CodeValue {
  id: string;
  group: string;
  code: string;
  name: string;
  status: 'active' | 'deprecated';
}

const mockDataItems: DataItem[] = [
  { id: '1', name: '用户ID', code: 'user_id', type: 'BIGINT', description: '用户唯一标识' },
  { id: '2', name: '用户名', code: 'username', type: 'VARCHAR(50)', description: '用户登录名' },
  { id: '3', name: '手机号', code: 'mobile', type: 'VARCHAR(11)', description: '用户手机号码' },
  { id: '4', name: '邮箱', code: 'email', type: 'VARCHAR(100)', description: '用户邮箱地址' },
];

const mockCodeValues: CodeValue[] = [
  { id: '1', group: 'gender', code: 'M', name: '男', status: 'active' },
  { id: '2', group: 'gender', code: 'F', name: '女', status: 'active' },
  { id: '3', group: 'gender', code: 'U', name: '未知', status: 'deprecated' },
  { id: '4', group: 'status', code: '0', name: '正常', status: 'active' },
  { id: '5', group: 'status', code: '1', name: '禁用', status: 'active' },
];

const DataStandard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'items' | 'codes'>('items');

  return (
    <div style={{ padding: '24px' }}>
      {/* Tab */}
      <div style={{ marginBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
        {(['items', 'codes'] as const).map(tab => (
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
            {tab === 'items' ? '数据项管理' : '代码值管理'}
          </button>
        ))}
      </div>

      {/* 数据项管理 */}
      {activeTab === 'items' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="搜索数据项..."
              style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', width: '300px' }}
            />
            <button style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              + 新增数据项
            </button>
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>数据项名称</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>编码</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>数据类型</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>说明</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {mockDataItems.map(item => (
                  <tr key={item.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{item.name}</td>
                    <td style={{ padding: '12px 16px', color: '#3b82f6', fontFamily: 'monospace' }}>{item.code}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{item.type}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{item.description}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>编辑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 代码值管理 */}
      {activeTab === 'codes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <select style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}>
              <option value="">全部代码组</option>
              <option value="gender">性别</option>
              <option value="status">状态</option>
            </select>
            <button style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              + 新增代码值
            </button>
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>代码组</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>代码值</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>显示名称</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>状态</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {mockCodeValues.map(cv => (
                  <tr key={cv.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px' }}>{cv.group}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#3b82f6' }}>{cv.code}</td>
                    <td style={{ padding: '12px 16px' }}>{cv.name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: cv.status === 'active' ? '#d1fae5' : '#f3f4f6',
                        color: cv.status === 'active' ? '#059669' : '#6b7280',
                      }}>
                        {cv.status === 'active' ? '启用' : '废弃'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>编辑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataStandard;
