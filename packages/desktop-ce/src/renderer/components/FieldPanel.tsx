/**
 * @file FieldPanel.tsx
 * @description 字段编辑面板 — 侧边栏字段属性编辑
 * @layer Desktop CE — Renderer / Components
 *
 * @module @ddm/desktop-ce
 */

import React, { useState, useEffect } from 'react'
import { useModelStore } from '../store/model.store'
import { useModelActions } from '../hooks/useModel'

/**
 * 字段编辑面板
 * 展示在画布右侧，当双击节点时弹出
 */
export const FieldPanel: React.FC = () => {
  const { showFieldPanel, editingEntity, closeFieldPanel } = useModelStore()
  const { currentModel } = useModelStore()
  const { addEntity, removeEntity } = useModelActions()

  const [newEntityName, setNewEntityName] = useState('')
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)

  if (!showFieldPanel) return null

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full">
      {/* 面板头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h3 className="font-semibold text-slate-800">
          {editingEntity ? editingEntity.name : '添加数据表'}
        </h3>
        <button
          onClick={closeFieldPanel}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
        >
          ×
        </button>
      </div>

      {/* 面板内容 */}
      <div className="flex-1 overflow-y-auto p-4">
        {editingEntity ? (
          <EntityFieldsView 
            entity={editingEntity} 
            onSelectField={setSelectedFieldId}
            selectedFieldId={selectedFieldId}
          />
        ) : (
          <AddEntityForm 
            name={newEntityName}
            onChange={setNewEntityName}
            onSubmit={async (name, comment) => {
              if (currentModel) {
                await addEntity(name, comment)
                closeFieldPanel()
              }
            }}
          />
        )}
      </div>
    </div>
  )
}

// ── 添加实体表单 ─────────────────────────────────────────────────────────

const AddEntityForm: React.FC<{
  name: string
  onChange: (name: string) => void
  onSubmit: (name: string, comment: string) => void
}> = ({ name, onChange, onSubmit }) => {
  const [comment, setComment] = useState('')

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          表名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={e => onChange(e.target.value)}
          placeholder="例如: sys_user"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          备注
        </label>
        <input
          type="text"
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="例如: 系统用户表"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <button
        onClick={() => onSubmit(name, comment)}
        disabled={!name.trim()}
        className="w-full py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
      >
        添加数据表
      </button>
    </div>
  )
}

// ── 实体字段视图 ─────────────────────────────────────────────────────────

const EntityFieldsView: React.FC<{
  entity: import('@ddm/core-engine').EntityDTO
  selectedFieldId: string | null
  onSelectField: (id: string | null) => void
}> = ({ entity, selectedFieldId, onSelectField }) => {
  const { addEntity, removeEntity, currentModel } = useModelActions()
  const { updateModel, setLoading, setError } = useModelStore()

  const handleAddField = async () => {
    if (!currentModel) return
    // 简化的添加字段调用
    try {
      // TODO: 调用 API 添加字段
      console.log('Add field to', entity.id)
    } catch (err) {
      setError(String(err))
    }
  }

  return (
    <div className="space-y-4">
      {/* 实体信息 */}
      <div className="p-3 bg-slate-50 rounded-lg">
        <div className="text-sm font-medium text-slate-800">{entity.name}</div>
        {entity.comment && (
          <div className="text-xs text-slate-500 mt-1">{entity.comment}</div>
        )}
      </div>

      {/* 字段列表 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">字段 ({entity.fields.length})</span>
          <button
            onClick={handleAddField}
            className="text-xs text-blue-500 hover:text-blue-600"
          >
            + 添加字段
          </button>
        </div>
        <div className="space-y-1">
          {entity.fields.map(field => (
            <div
              key={field.id}
              onClick={() => onSelectField(field.id)}
              className={`
                p-2 rounded cursor-pointer text-sm
                ${selectedFieldId === field.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'}
              `}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-700">{field.name}</span>
                {field.primaryKey && <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded">PK</span>}
                {!field.nullable && <span className="text-xs bg-red-100 text-red-700 px-1 rounded">NOT NULL</span>}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {field.baseType}{field.length ? `(${field.length})` : ''}
              </div>
            </div>
          ))}
          {entity.fields.length === 0 && (
            <div className="text-sm text-slate-400 text-center py-4">
              暂无字段，请添加
            </div>
          )}
        </div>
      </div>

      {/* 删除实体 */}
      <div className="pt-4 border-t border-slate-200">
        <button
          onClick={async () => {
            if (currentModel && confirm(`确定删除表 "${entity.name}" 吗？`)) {
              await removeEntity(entity.id)
            }
          }}
          className="w-full py-2 text-red-500 border border-red-200 hover:bg-red-50 rounded-lg text-sm transition-colors"
        >
          删除数据表
        </button>
      </div>
    </div>
  )
}

export default FieldPanel
