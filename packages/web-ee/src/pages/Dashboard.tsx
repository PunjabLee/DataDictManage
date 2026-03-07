/**
 * @file Dashboard.tsx
 * @description 控制台首页
 */

import React from 'react';

const Dashboard: React.FC = () => {
  const stats = [
    { label: '项目总数', value: '12', icon: '📁', color: '#3b82f6' },
    { label: '模型总数', value: '156', icon: '🎨', color: '#10b981' },
    { label: '团队成员', value: '48', icon: '👥', color: '#f59e0 { label: 'b' },
   API 调用', value: '2.3k', icon: '🔌', color: '#ef4444' },
  ];

  const recentActivities = [
    { user: '张三', action: '创建了模型', target: '订单表', time: '5分钟前' },
    { user: '李四', action: '修改了字段', target: '用户表', time: '15分钟前' },
    { user: '王五', action: '发布了版本', target: '库存模型', time: '1小时前' },
    { user: '赵六', action: '提交了审批', target: '业务流程', time: '2小时前' },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '24px' }}>
        {stats.map(stat => (
          <div
            key={stat.label}
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>{stat.label}</div>
                <div style={{ fontSize: '32px', fontWeight: 600, color: stat.color }}>{stat.value}</div>
              </div>
              <span style={{ fontSize: '36px' }}>{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 最近活动 */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>最近活动</h2>
        <div>
          {recentActivities.map((activity, index) => (
            <div
              key={index}
              style={{
                padding: '12px 0',
                borderBottom: index < recentActivities.length - 1 ? '1px solid #e5e7eb' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontWeight: 500 }}>{activity.user}</span>
                <span style={{ color: '#6b7280', margin: '0 8px' }}>{activity.action}</span>
                <span style={{ color: '#3b82f6' }}>{activity.target}</span>
              </div>
              <span style={{ color: '#9ca3af', fontSize: '14px' }}>{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
