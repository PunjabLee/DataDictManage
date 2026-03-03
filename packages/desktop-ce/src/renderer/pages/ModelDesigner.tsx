/**
 * @file ModelDesigner.tsx
 * @description 建模设计器页面 — ER 图设计主界面
 * @layer Desktop CE — Renderer / Pages
 *
 * 布局结构：
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Toolbar（工具栏）                                           │
 * ├───────────────┬─────────────────────────────────────────────┤
 * │  Sidebar      │  Canvas 设计区（ER 图）                      │
 * │  （目录树）    │                                             │
 * │               │                                             │
 * └───────────────┴─────────────────────────────────────────────┘
 *
 * @module @ddm/desktop-ce
 */

import React, { useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useModelStore } from '../store/model.store'
import { useModelLoader } from '../hooks/useModel'
import { useHotkeys } from '../hooks/useHotkeys'
import { Sidebar } from '../components/Sidebar'
import { Toolbar } from '../components/Toolbar'
import { FieldPanel } from '../components/FieldPanel'
import { CanvasEngine, RenderGraph, RenderNode, RenderEdge, NodeState, EdgeStyle, RelationMark } from '@ddm/canvas-render'

/**
 * 建模设计器页面
 */
export const ModelDesigner: React.FC = () => {
  // 启用快捷键
  useHotkeys()
  const { modelId } = useParams<{ modelId: string }>()
  const navigate = useNavigate()
  const { fetchAndLoadModel } = useModelLoader()
  const {
    currentModel,
    nodePositions,
    selectedEntityIds,
    loading,
    error,
    setNodePosition,
    selectEntity,
    clearSelection,
    openFieldPanel,
  } = useModelStore()

  // Canvas 引擎引用
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<CanvasEngine | null>(null)

  // ── 加载模型 ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (modelId) {
      fetchAndLoadModel(modelId)
    }
    return () => {
      // 页面卸载时销毁 Canvas 引擎，释放资源
      engineRef.current?.destroy()
      engineRef.current = null
    }
  }, [modelId, fetchAndLoadModel])

  // ── 初始化 Canvas 引擎 ────────────────────────────────────────────────

  useEffect(() => {
    if (!canvasRef.current || engineRef.current) return

    const engine = new CanvasEngine({
      canvas: canvasRef.current,
      hiDPI: true,
      virtualRendering: true,
    })

    // 监听节点选中事件
    engine.on('node:select', (event) => {
      if (event.target) {
        selectEntity(event.target)
      }
    })

    // 监听画布点击（取消选中）
    engine.on('canvas:click', () => {
      clearSelection()
    })

    // 监听节点移动
    engine.on('node:move', (event) => {
      if (event.target && event.position) {
        setNodePosition(event.target, event.position)
      }
    })

    // 监听节点双击（打开字段编辑面板）
    engine.on('node:dblclick', (event) => {
      if (event.target && currentModel) {
        const entity = currentModel.entities.find(e => e.id === event.target)
        if (entity) openFieldPanel(entity)
      }
    })

    engineRef.current = engine
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 同步渲染图数据 ────────────────────────────────────────────────────

  useEffect(() => {
    if (!engineRef.current || !currentModel) return

    // 将 ModelDetailDTO 转换为 RenderGraph
    const graph = buildRenderGraph(currentModel, nodePositions, selectedEntityIds)
    engineRef.current.setGraph(graph)
  }, [currentModel, nodePositions, selectedEntityIds])

  // ── 快捷键处理 ────────────────────────────────────────────────────────

  const handleFitContent = useCallback(() => {
    engineRef.current?.fitContent()
  }, [])

  const handleZoomIn = useCallback(() => {
    const state = engineRef.current?.getViewportState()
    if (state) {
      const canvas = canvasRef.current
      if (canvas) {
        const center = { x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 }
        engineRef.current?.['_viewport']?.zoom(0.2, center)
      }
    }
  }, [])

  const handleZoomOut = useCallback(() => {
    const state = engineRef.current?.getViewportState()
    if (state) {
      const canvas = canvasRef.current
      if (canvas) {
        const center = { x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 }
        engineRef.current?.['_viewport']?.zoom(-0.2, center)
      }
    }
  }, [])

  // ── 渲染 ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* 工具栏 */}
      <Toolbar
        modelName={currentModel?.name ?? '加载中...'}
        onBack={() => navigate('/home')}
        onFitContent={handleFitContent}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧目录树 */}
        <Sidebar />

        {/* Canvas 画布区 */}
        <div className="flex-1 relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-50">
              <div className="text-slate-500 text-sm">加载中...</div>
            </div>
          )}

          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm z-50">
              {error}
            </div>
          )}

          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            tabIndex={0}
          />

          {/* 缩放比例显示 */}
          <ZoomIndicator engineRef={engineRef} />
        </div>

        {/* 右侧字段编辑面板 */}
        <FieldPanel />
      </div>
    </div>
  )
}

/**
 * 缩放比例指示器
 */
const ZoomIndicator: React.FC<{ engineRef: React.RefObject<CanvasEngine | null> }> = ({ engineRef }) => {
  const [scale, setScale] = React.useState(100)

  React.useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    const unsubscribe = engine.on('canvas:zoom', (event) => {
      if (event.viewport) {
        setScale(Math.round(event.viewport.scale * 100))
      }
    })
    return () => unsubscribe()
  }, [engineRef])

  return (
    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 font-mono shadow-sm">
      {scale}%
    </div>
  )
}

// ── 数据转换函数 ──────────────────────────────────────────────────────────

/**
 * 将 ModelDetailDTO 转换为 RenderGraph
 * 这是建模层（DTO）和渲染层（RenderGraph）之间的适配逻辑
 */
function buildRenderGraph(
  model: import('@ddm/core-engine').ModelDetailDTO,
  positions: Record<string, import('../store/model.store').NodePosition>,
  selectedIds: Set<string>,
): RenderGraph {
  const nodes: RenderNode[] = model.entities.map(entity => {
    const pos = positions[entity.id] ?? { x: 0, y: 0 }
    const isSelected = selectedIds.has(entity.id)

    return {
      id: entity.id,
      name: entity.name,
      comment: entity.comment,
      position: pos,
      size: {
        width: 240,
        height: 36 + entity.fields.length * 28 + 8,
      },
      state: isSelected ? NodeState.SELECTED : NodeState.NORMAL,
      fields: entity.fields.map(f => ({
        id: f.id,
        name: f.name,
        comment: f.comment,
        typeLabel: formatTypeLabel(f),
        isPrimaryKey: f.primaryKey,
        isForeignKey: false,
        isNotNull: !f.nullable,
        hasStandard: f.hasStandardBinding,
      })),
      layerColor: '#1677FF',
      collapsed: false,
      zIndex: isSelected ? 10 : 1,
    }
  })

  const edges: RenderEdge[] = model.relations.map(rel => ({
    id: rel.id,
    fromNodeId: rel.fromEntityId,
    toNodeId: rel.toEntityId,
    style: EdgeStyle.BEZIER,
    fromMark: RelationMark.ONE,
    toMark: rel.type === 'ONE_TO_MANY' ? RelationMark.MANY : RelationMark.ONE,
    label: rel.comment,
    selected: false,
  }))

  return {
    nodes,
    edges,
    backgroundColor: '#F8FAFF',
    showGrid: true,
    gridSize: 20,
  }
}

/**
 * 格式化字段类型显示标签
 */
function formatTypeLabel(field: import('@ddm/core-engine').FieldDTO): string {
  const { baseType, length, precision, scale } = field
  if (length) return `${baseType}(${length})`
  if (precision && scale) return `${baseType}(${precision},${scale})`
  return baseType
}
