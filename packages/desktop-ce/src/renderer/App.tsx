/**
 * @file App.tsx
 * @description React 根组件 — 路由配置和全局布局
 * @layer Desktop CE — Renderer
 *
 * @module @ddm/desktop-ce
 */

import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Home } from './pages/Home'
import { ModelDesigner } from './pages/ModelDesigner'

/**
 * 应用根组件
 * 使用 HashRouter（Electron 的 file:// 协议兼容）
 */
const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* 默认重定向到首页 */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* 首页：项目/模型列表 */}
        <Route path="/home" element={<Home />} />

        {/* 建模设计器：ER 图设计页 */}
        <Route path="/designer/:modelId" element={<ModelDesigner />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </HashRouter>
  )
}

export default App
