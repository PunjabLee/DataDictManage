/**
 * @file Home.tsx
 * @description 首页 — 项目/模型列表
 * @layer Desktop CE — Renderer / Pages
 *
 * @module @ddm/desktop-ce
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface ModelCard {
  id: string
  name: string
  description: string
  entityCount: number
  updatedAt: string
}

/**
 * 首页组件
 * 展示所有本地模型，提供新建/打开/删除操作
 */
export const Home: React.FC = () => {
  const navigate = useNavigate()
  const [models, setModels] = useState<ModelCard[]>([])
  const [loading, setLoading] = useState(false)

  // 加载本地模型列表（演示数据）
  useEffect(() => {
    setLoading(true)
    // TODO: 从本地存储/API 加载模型列表
    setTimeout(() => {
      setModels([
        {
          id: 'demo-model-1',
          name: '用户中心数据模型',
          description: '用户账号、权限、认证相关表结构',
          entityCount: 8,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'demo-model-2',
          name: '订单系统数据模型',
          description: '订单、商品、支付、物流相关表结构',
          entityCount: 15,
          updatedAt: new Date().toISOString(),
        },
      ])
      setLoading(false)
    }, 300)
  }, [])

  const handleOpenModel = (modelId: string) => {
    navigate(`/designer/${modelId}`)
  }

  const handleNewModel = () => {
    const id = `model-${Date.now()}`
    navigate(`/designer/${id}`)
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* 顶部标题栏 */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <div>
            <h1 className="text-lg font-bold text-slate-800">DataDictManage</h1>
            <p className="text-xs text-slate-500">数据字典管理平台 — 社区版 (CE)</p>
          </div>
        </div>
        <button
          onClick={handleNewModel}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <span>＋</span>
          新建模型
        </button>
      </header>

      {/* 主体内容 */}
      <main className="flex-1 overflow-auto p-6">
        <h2 className="text-base font-semibold text-slate-700 mb-4">我的模型</h2>

        {loading && (
          <div className="flex items-center justify-center h-40 text-slate-400">
            加载中...
          </div>
        )}

        {!loading && models.length === 0 && (
          <div className="flex flex-col items-center justify-center h-60 text-slate-400">
            <span className="text-5xl mb-4">📋</span>
            <p className="text-base">暂无模型，点击右上角「新建模型」开始</p>
          </div>
        )}

        {/* 模型卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {models.map(model => (
            <ModelCardItem
              key={model.id}
              model={model}
              onOpen={() => handleOpenModel(model.id)}
            />
          ))}
        </div>
      </main>
    </div>
  )
}

/**
 * 模型卡片子组件
 */
const ModelCardItem: React.FC<{
  model: ModelCard
  onOpen: () => void
}> = ({ model, onOpen }) => {
  return (
    <div
      className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
      onClick={onOpen}
    >
      {/* 图标 + 名称 */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
          🗃️
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-800 text-sm truncate group-hover:text-blue-600">
            {model.name}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{model.description || '暂无描述'}</p>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
        <span>{model.entityCount} 张表</span>
        <span>{new Date(model.updatedAt).toLocaleDateString('zh-CN')}</span>
      </div>
    </div>
  )
}
