/**
 * @file Toolbar.tsx
 * @description 工具栏组件 — 建模设计器顶部工具栏
 * @layer Desktop CE — Renderer / Components
 *
 * @module @ddm/desktop-ce
 */

import React from 'react'
import { useUndoRedo, useModelActions } from '../hooks/useModel'
import { useModelStore } from '../store/model.store'

interface ToolbarProps {
  modelName: string
  onBack: () => void
  onFitContent: () => void
  onZoomIn: () => void
  onZoomOut: () => void
}

/**
 * 工具栏组件
 * 包含：返回按钮、模型名、撤销/重做、视图操作、DDL 生成
 */
export const Toolbar: React.FC<ToolbarProps> = ({
  modelName,
  onBack,
  onFitContent,
  onZoomIn,
  onZoomOut,
}) => {
  const { undo, redo, canUndo, canRedo } = useUndoRedo()
  const { generateDDL } = useModelActions()
  const { currentModel } = useModelStore()

  const handleGenerateDDL = async () => {
    if (!currentModel) return
    const sql = await generateDDL('MYSQL')
    if (sql) {
      // 简单展示（实际应用中弹出 Modal）
      console.log('Generated DDL:', sql)
      alert('DDL 已生成，请查看控制台')
    }
  }

  return (
    <header className="flex items-center gap-2 px-4 py-2 bg-white border-b border-slate-200 shadow-sm h-12 flex-shrink-0">
      {/* 返回按钮 */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 px-2 py-1 rounded text-slate-500 hover:bg-slate-100 text-sm transition-colors"
        title="返回首页"
      >
        ←
      </button>

      {/* 分隔符 */}
      <div className="w-px h-5 bg-slate-200" />

      {/* 模型名称 */}
      <span className="text-sm font-semibold text-slate-800 min-w-0 truncate max-w-48">
        {modelName}
      </span>

      {/* 弹性空间 */}
      <div className="flex-1" />

      {/* 工具按钮组 */}
      <div className="flex items-center gap-1">
        {/* 撤销/重做 */}
        <ToolButton onClick={undo} disabled={!canUndo} title="撤销 (Ctrl+Z)">↩</ToolButton>
        <ToolButton onClick={redo} disabled={!canRedo} title="重做 (Ctrl+Y)">↪</ToolButton>

        <Divider />

        {/* 视图操作 */}
        <ToolButton onClick={onZoomOut} title="缩小">－</ToolButton>
        <ToolButton onClick={onFitContent} title="适应画布">⊡</ToolButton>
        <ToolButton onClick={onZoomIn} title="放大">＋</ToolButton>

        <Divider />

        {/* DDL 生成 */}
        <button
          onClick={handleGenerateDDL}
          className="flex items-center gap-1.5 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors"
          title="生成 DDL SQL"
        >
          <span>⚙</span>
          <span>生成 DDL</span>
        </button>
      </div>
    </header>
  )
}

// ── 子组件 ────────────────────────────────────────────────────────────────

const ToolButton: React.FC<{
  onClick: () => void
  disabled?: boolean
  title?: string
  children: React.ReactNode
}> = ({ onClick, disabled, title, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`
      w-7 h-7 flex items-center justify-center rounded text-sm transition-colors
      ${disabled
        ? 'text-slate-300 cursor-not-allowed'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
      }
    `}
  >
    {children}
  </button>
)

const Divider: React.FC = () => (
  <div className="w-px h-5 bg-slate-200 mx-1" />
)
