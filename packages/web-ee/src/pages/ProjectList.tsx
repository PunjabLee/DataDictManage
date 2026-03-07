/**
 * @file ProjectList.tsx
 * @description 项目列表页
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  description: string;
  models: number;
  members: number;
  status: 'active' | 'archived';
  updatedAt: string;
}

const mockProjects: Project[] = [
  { id: '1', name: '电商核心系统', description: '订单、库存、支付核心模型', models: 23, members: 8, status: 'active', updatedAt: '2026-03-06' },
  { id: '2', name: '会员体系', description: '用户、积分、会员等级', models: 15, members: 5, status: 'active', updatedAt: '2026-03-05' },
  { id: '3', name: '供应链系统', description: '采购、仓储、物流', models: 31, members: 12, status: 'active', updatedAt: '2026-03-04' },
  { id: '4', name: '旧系统归档', description: '已归档的历史项目', models: 45, members: 3, status: 'archived', updatedAt: '2026-01-15' },
];

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');

  const filteredProjects = mockProjects.filter(p => 
    filter === 'all' ? true : p.status === filter
  );

  return (
    <div style={{ padding: '24px' }}>
      {/* 操作栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'active', 'archived'] as const).map(key => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: filter === key ? '#3b82f6' : '#fff',
                color: filter === key ? '#fff' : '#374151',
                cursor: 'pointer',
              }}
            >
              {key === 'all' ? '全部' : key === 'active' ? '进行中' : '已归档'}
            </button>
          ))}
        </div>
        <button
          onClick={() => navigate('/designer')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          + 新建项目
        </button>
      </div>

      {/* 项目列表 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {filteredProjects.map(project => (
          <div
            key={project.id}
            onClick={() => navigate(`/designer/${project.id}`)}
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{project.name}</h3>
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                backgroundColor: project.status === 'active' ? '#d1fae5' : '#f3f4f6',
                color: project.status === 'active' ? '#059669' : '#6b7280',
              }}>
                {project.status === 'active' ? '进行中' : '已归档'}
              </span>
            </div>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>{project.description}</p>
            <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#9ca3af' }}>
              <span>🎨 {project.models} 个模型</span>
              <span>👥 {project.members} 人</span>
              <span style={{ marginLeft: 'auto' }}>{project.updatedAt}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectList;
