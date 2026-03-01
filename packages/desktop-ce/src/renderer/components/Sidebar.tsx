/**
 * @file Sidebar.tsx
 * @description 左侧目录树组件 — 展示当前模型的 Entity 列表
 * @layer Desktop CE — Renderer / Components
 *
 * @module @ddm/desktop-ce
 */

import React from 'react'
import { useModelStore } from '../store/model.store'

/**
 * 左侧目录树
 * 展示：
 * - 当前模型所有 Entity（表）列表
 * - 点击定位到对应节点
 * - 选中高亮
 */
export const Sidebar: React.FC = () => {
  const { currentModel, selectedEntityIds, selectEntity, openFieldPanel } = useModelStore()

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
      {/* 标题 */}
      <div className="px-3 py-2.5 border-b border-slate-100">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          数据表
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {currentModel?.entities.length ?? 0} 张表
        </p>
      </div>

      {/* Entity 列表 */}
      <div className="flex-1 overflow-y-auto py-1">
        {!currentModel && (
          <div className="px-3 py-4 text-xs text-slate-400 text-center">
            加载中...
          </div>
        )}

        {currentModel?.entities.map(entity => {
          const isSelected = selectedEntityIds.has(entity.id)
          return (
            <div
              key={entity.id}
              className={`
                flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs
                hover:bg-slate-50 transition-colors
                ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}
              `}
              onClick={() => selectEntity(entity.id)}
              onDoubleClick={() => openFieldPanel(entity)}
            >
              {/* 表图标 */}
              <span className="text-slate-400 flex-shrink-0">🗂️</span>

              {/* 表名 + 注释 */}
              <div className="min-w-0">
                <div className="font-medium truncate">{entity.name}</div>
                {entity.comment && (
                  <div className="text-slate-400 truncate text-[10px]">{entity.comment}</div>
                )}
              </div>

              {/* 字段数量角标 */}
              <span className="flex-shrink-0 ml-auto text-slate-300 text-[10px]">
                {entity.fields.length}
              </span>
            </div>
          )
        })}
      </div>

      {/* 底部操作区 */}
      <div className="border-t border-slate-100 p-2">
        <button
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
          onClick={() => {
            // TODO: 触发新增 Entity
          }}
        >
          <span>＋</span>
          <span>新增数据表</span>
        </button>
      </div>
    </aside>
  )
}
