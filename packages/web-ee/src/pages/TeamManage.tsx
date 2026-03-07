/**
 * @file TeamManage.tsx
 * @description 团队管理页
 */

import React, { useState } from 'react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'developer' | 'viewer';
  avatar: string;
}

const mockMembers: TeamMember[] = [
  { id: '1', name: '张三', email: 'zhangsan@company.com', role: 'owner', avatar: '👨' },
  { id: '2', name: '李四', email: 'lisi@company.com', role: 'admin', avatar: '👩' },
  { id: '3', name: '王五', email: 'wangwu@company.com', role: 'developer', avatar: '👨' },
  { id: '4', name: '赵六', email: 'zhaoliu@company.com', role: 'developer', avatar: '👩' },
  { id: '5', name: '钱七', email: 'qianqi@company.com', role: 'viewer', avatar: '👨' },
];

const roleLabels = {
  owner: { label: '所有者', color: '#7c3aed' },
  admin: { label: '管理员', color: '#3b82f6' },
  developer: { label: '开发者', color: '#10b981' },
  viewer: { label: '查看者', color: '#6b7280' },
};

const TeamManage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'members' | 'roles'>('members');

  return (
    <div style={{ padding: '24px' }}>
      {/* Tab 切换 */}
      <div style={{ marginBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
        {(['members', 'roles'] as const).map(tab => (
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
            {tab === 'members' ? '成员管理' : '角色权限'}
          </button>
        ))}
      </div>

      {activeTab === 'members' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600 }}>团队成员 ({mockMembers.length})</h2>
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}>
              + 邀请成员
            </button>
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>成员</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>邮箱</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>角色</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {mockMembers.map(member => (
                  <tr key={member.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ marginRight: '8px' }}>{member.avatar}</span>
                      {member.name}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{member.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: `${roleLabels[member.role].color}20`,
                        color: roleLabels[member.role].color,
                      }}>
                        {roleLabels[member.role].label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', marginRight: '8px' }}>编辑</button>
                      {member.role !== 'owner' && (
                        <button style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>移除</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>角色权限说明</h3>
          {Object.entries(roleLabels).map(([key, { label, color }]) => (
            <div key={key} style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
              <span style={{ fontWeight: 500, color }}>{label}</span>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
                {key === 'owner' && '拥有所有权限，可以管理团队设置和成员'}
                {key === 'admin' && '可以管理成员、项目设置和审批流程'}
                {key === 'developer' && '可以创建和编辑模型，但不能删除项目'}
                {key === 'viewer' && '只能查看模型，不能进行任何修改'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamManage;
