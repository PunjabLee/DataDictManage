import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import {
  DashboardOutlined,
  DatabaseOutlined,
  TeamOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { useState } from 'react'

const { Header, Sider, Content } = Layout

// 页面组件（占位）
const Dashboard = () => <div style={{ padding: 24 }}>仪表盘</div>
const DataStandard = () => <div style={{ padding: 24 }}>数据标准管理</div>
const TeamManage = () => <div style={{ padding: 24 }}>团队管理</div>
const Settings = () => <div style={{ padding: 24 }}>系统设置</div>

function App() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <BrowserRouter>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="dark"
        >
          <div style={{ height: 32, margin: 16, background: 'rgba(255,255,255,0.2)', borderRadius: 6 }}>
            {!collapsed && (
              <div style={{ color: '#fff', textAlign: 'center', lineHeight: '32px', fontWeight: 'bold' }}>
                DDM EE
              </div>
            )}
          </div>
          <Menu
            theme="dark"
            defaultSelectedKeys={['dashboard']}
            mode="inline"
            items={[
              {
                key: 'dashboard',
                icon: <DashboardOutlined />,
                label: <a href="#/dashboard">仪表盘</a>,
              },
              {
                key: 'standard',
                icon: <DatabaseOutlined />,
                label: <a href="#/standard">数据标准</a>,
              },
              {
                key: 'team',
                icon: <TeamOutlined />,
                label: <a href="#/team">团队管理</a>,
              },
              {
                key: 'settings',
                icon: <SettingOutlined />,
                label: <a href="#/settings">系统设置</a>,
              },
            ]}
          />
        </Sider>
        <Layout>
          <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 'bold' }}>数据字典管理平台 - 企业版</span>
            <span>当前用户: admin</span>
          </Header>
          <Content style={{ margin: '16px' }}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/standard" element={<DataStandard />} />
              <Route path="/team" element={<TeamManage />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </BrowserRouter>
  )
}

export default App
