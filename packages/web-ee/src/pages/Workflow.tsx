/**
 * @file Workflow.tsx
 * @description 工作流审批页
 */

import React, { useState } from 'react';

interface Workflow {
  id: string;
  name: string;
  type: string;
  status: 'draft' | 'active' | 'paused';
  tasks: number;
}

interface Approval {
  id: string;
  title: string;
  applicant: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  createTime: string;
}

const mockWorkflows: Workflow[] = [
  { id: '1', name: '模型发布审批', type: 'model_publish', status: 'active', tasks: 5 },
  { id: '2', name: '数据变更审批', type: 'data_change', status: 'active', tasks: 12 },
  { id: '3', name: '权限申请审批', type: 'permission', status: 'paused', tasks: 0 },
];

const mockApprovals: Approval[] = [
  { id: '1', title: '订单表结构变更', applicant: '张三', type: '模型变更', status: 'pending', createTime: '2026-03-07 10:30' },
  { id: '2', title: '新增用户画像表', applicant: '李四', type: '新建模型', status: 'pending', createTime: '2026-03-07 09:15' },
  { id: '3', title: '删除废弃字段', applicant: '王五', type: '模型变更', status: 'approved', createTime: '2026-03-06 16:20' },
  { id: '4', title: '敏感字段权限申请', applicant: '赵六', type: '权限申请', status: 'rejected', createTime: '2026-03-06 14:00' },
];

const Workflow: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'definitions'>('approvals');

  const statusColors = {
    pending: { bg: '#fef3c7', color: '#d97706', label: '待审批' },
    approved: { bg: '#d1fae5', color: '#059669', label: '已通过' },
    rejected: { bg: '#fee2e2', color: '#dc2626', label: '已拒绝' },
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Tab */}
      <div style={{ marginBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
        {(['approvals', 'definitions'] as const).map(tab => (
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
            {tab === 'approvals' ? '审批中心' : '流程定义'}
          </button>
        ))}
      </div>

      {/* 审批中心 */}
      {activeTab === 'approvals' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {['全部', '待审批', '已通过', '已拒绝'].map(filter => (
              <button
                key={filter}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: filter === '全部' ? '#3b82f6' : '#fff',
                  color: filter === '全部' ? '#fff' : '#374151',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                {filter}
              </button>
            ))}
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>标题</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>申请人</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>类型</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>状态</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>创建时间</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {mockApprovals.map(approval => (
                  <tr key={approval.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{approval.title}</td>
                    <td style={{ padding: '12px 16px' }}>{approval.applicant}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{approval.type}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: statusColors[approval.status].bg,
                        color: statusColors[approval.status].color,
                      }}>
                        {statusColors[approval.status].label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{approval.createTime}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {approval.status === 'pending' && (
                        <>
                          <button style={{ color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', marginRight: '8px' }}>通过</button>
                          <button style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>拒绝</button>
                        </>
                      )}
                      {approval.status !== 'pending' && (
                        <button style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>查看</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 流程定义 */}
      {activeTab === 'definitions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              + 新建流程
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {mockWorkflows.map(wf => (
              <div key={wf.id} style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{wf.name}</h3>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: wf.status === 'active' ? '#d1fae5' : '#f3f4f6',
                    color: wf.status === 'active' ? '#059669' : '#6b7280',
                  }}>
                    {wf.status === 'active' ? '运行中' : '已暂停'}
                  </span>
                </div>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '12px' }}>类型: {wf.type}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>待处理: {wf.tasks}</span>
                  <div>
                    <button style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', marginRight: '8px' }}>编辑</button>
                    <button style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>更多</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Workflow;
