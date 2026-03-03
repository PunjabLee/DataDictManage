/**
 * @file VersionPanel.tsx
 * @description 版本管理面板 — 模型快照与回滚
 * @layer Desktop CE — Renderer / Components
 *
 * @module @ddm/desktop-ce
 */

import React, { useState, useEffect } from 'react'
import { useModelStore } from '../store/model.store'

interface VersionPanelProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * 版本管理面板
 */
export const VersionPanel: React.FC<VersionPanelProps> = ({ isOpen, onClose }) => {
  const { currentModel } = useModelStore()
  const [versions, setVersions] = useState<Array<{
    id: string
    tag: string
    description: string
    createdAt: string
    createdBy: string
  }>>([])
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // 模拟版本数据
  useEffect(() => {
    if (isOpen && currentModel) {
      // TODO: 从后端 API 获取版本列表
      setVersions([
        {
          id: 'v1',
          tag: 'v1.0.0',
          description: '初始版本',
          createdAt: new Date().toISOString(),
          createdBy: 'local',
        },
      ])
    }
  }, [isOpen, currentModel])

  const handleCreateSnapshot = async (tag: string, description: string) => {
    // TODO: 调用 API 创建快照
    console.log('创建快照:', tag, description)
    setVersions([
      {
        id: `v${Date.now()}`,
        tag,
        description,
        createdAt: new Date().toISOString(),
        createdBy: 'local',
      },
      ...versions,
    ])
    setShowCreateForm(false)
  }

  const handleRestore = (versionId: string) => {
    if (confirm('确定要回滚到此版本吗？当前未保存的更改将丢失。')) {
      // TODO: 调用 API 回滚
      console.log('回滚到版本:', versionId)
      alert('回滚成功')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">版本管理</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400"
          >
            ×
          </button>
        </div>

        {/* 创建快照按钮 */}
        <div className="px-6 py-3 border-b border-slate-100">
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg"
          >
            + 创建快照
          </button>
        </div>

        {/* 创建表单 */}
        {showCreateForm && (
          <CreateSnapshotForm
            onSubmit={handleCreateSnapshot}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {/* 版本列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          {versions.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              暂无版本记录
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map(version => (
                <div
                  key={version.id}
                  className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-slate-800">{version.tag}</span>
                      <span className="ml-2 text-xs text-slate-400">
                        {new Date(version.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRestore(version.id)}
                      className="px-3 py-1 text-xs text-blue-500 hover:bg-blue-50 rounded"
                    >
                      回滚
                    </button>
                  </div>
                  {version.description && (
                    <div className="text-sm text-slate-500 mt-1">
                      {version.description}
                    </div>
                  )}
                  <div className="text-xs text-slate-400 mt-2">
                    创建人: {version.createdBy}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-lg"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 创建快照表单 ─────────────────────────────────────────────────────────

const CreateSnapshotForm: React.FC<{
  onSubmit: (tag: string, description: string) => void
  onCancel: () => void
}> = ({ onSubmit, onCancel }) => {
  const [tag, setTag] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(tag || `v${Date.now()}`, description)
  }

  return (
    <form onSubmit={handleSubmit} className="px-6 py-4 bg-slate-50 border-b border-slate-200">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">版本号</label>
          <input
            type="text"
            value={tag}
            onChange={e => setTag(e.target.value)}
            placeholder="例如: v1.0.0"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="版本描述"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg"
        >
          创建
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-600 text-sm rounded-lg"
        >
          取消
        </button>
      </div>
    </form>
  )
}

export default VersionPanel
