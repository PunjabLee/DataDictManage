/**
 * @file model.store.ts
 * @description 建模状态管理 — Zustand Store
 * @layer Desktop CE — Renderer / Store
 *
 * 职责：
 *   管理建模设计器页面的全局状态，包含：
 *   - 当前打开的 Model 详情（ModelDetailDTO）
 *   - 已选中的节点/边 ID
 *   - 操作历史（撤销/重做）
 *   - 加载状态和错误信息
 *
 * @pattern GoF: Command（每个 Action 对应一个命令，支持撤销）
 *           Memento（历史状态栈）
 *           Singleton（Zustand store 是全局单例）
 *
 * @module @ddm/desktop-ce
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ModelDetailDTO, EntityDTO, FieldDTO } from '@ddm/core-engine'

// ── 状态类型定义 ─────────────────────────────────────────────────────────

/**
 * 节点位置（画布坐标）
 */
export interface NodePosition {
  x: number
  y: number
}

/**
 * 建模状态
 */
export interface ModelState {
  // ── 当前模型数据 ──────────────────────────────────────────────────

  /** 当前打开的模型 ID */
  currentModelId: string | null
  /** 当前模型详情（含 entities/fields/relations） */
  currentModel: ModelDetailDTO | null
  /** 节点位置（画布布局，不属于领域模型，只存客户端） */
  nodePositions: Record<string, NodePosition>

  // ── 选中状态 ──────────────────────────────────────────────────────

  /** 已选中的 Entity ID 集合 */
  selectedEntityIds: Set<string>
  /** 已选中的 Relation ID 集合 */
  selectedRelationIds: Set<string>

  // ── UI 状态 ───────────────────────────────────────────────────────

  /** 是否显示字段编辑面板 */
  showFieldPanel: boolean
  /** 当前正在编辑的 Entity */
  editingEntity: EntityDTO | null
  /** 是否正在加载 */
  loading: boolean
  /** 错误信息 */
  error: string | null

  // ── 操作历史（撤销/重做）─────────────────────────────────────────

  /** 历史状态栈（最多保存 50 步） */
  history: ModelDetailDTO[]
  /** 当前历史指针 */
  historyIndex: number

  // ── Actions ───────────────────────────────────────────────────────

  /** 加载模型 */
  loadModel: (model: ModelDetailDTO) => void
  /** 清空当前模型 */
  clearModel: () => void

  /** 设置节点位置 */
  setNodePosition: (entityId: string, position: NodePosition) => void
  /** 批量设置节点位置（布局算法结果） */
  setAllNodePositions: (positions: Record<string, NodePosition>) => void

  /** 选中节点 */
  selectEntity: (entityId: string, multi?: boolean) => void
  /** 取消选中所有 */
  clearSelection: () => void

  /** 显示/隐藏字段编辑面板 */
  openFieldPanel: (entity: EntityDTO) => void
  closeFieldPanel: () => void

  /** 设置加载状态 */
  setLoading: (loading: boolean) => void
  /** 设置错误信息 */
  setError: (error: string | null) => void

  /** 更新当前模型（并推送到历史栈） */
  updateModel: (model: ModelDetailDTO) => void

  /** 撤销 */
  undo: () => void
  /** 重做 */
  redo: () => void
  /** 是否可以撤销 */
  canUndo: () => boolean
  /** 是否可以重做 */
  canRedo: () => boolean
}

// ── Zustand Store 实现 ────────────────────────────────────────────────────

/**
 * 建模 Zustand Store
 *
 * 使用 devtools 中间件，在 Chrome DevTools 中可以查看状态变化时间线
 */
export const useModelStore = create<ModelState>()(
  devtools(
    (set, get) => ({
      // ── 初始状态 ──────────────────────────────────────────────────

      currentModelId: null,
      currentModel: null,
      nodePositions: {},
      selectedEntityIds: new Set(),
      selectedRelationIds: new Set(),
      showFieldPanel: false,
      editingEntity: null,
      loading: false,
      error: null,
      history: [],
      historyIndex: -1,

      // ── Actions ───────────────────────────────────────────────────

      loadModel: (model: ModelDetailDTO) => {
        // 初始化节点位置（自动布局）
        const positions: Record<string, NodePosition> = {}
        model.entities.forEach((entity, i) => {
          positions[entity.id] = {
            x: 60 + (i % 4) * 280,
            y: 60 + Math.floor(i / 4) * 220,
          }
        })

        set({
          currentModelId: model.id,
          currentModel: model,
          nodePositions: positions,
          selectedEntityIds: new Set(),
          selectedRelationIds: new Set(),
          showFieldPanel: false,
          editingEntity: null,
          history: [model],
          historyIndex: 0,
          error: null,
        }, false, 'loadModel')
      },

      clearModel: () => {
        set({
          currentModelId: null,
          currentModel: null,
          nodePositions: {},
          selectedEntityIds: new Set(),
          history: [],
          historyIndex: -1,
        }, false, 'clearModel')
      },

      setNodePosition: (entityId: string, position: NodePosition) => {
        set(state => ({
          nodePositions: { ...state.nodePositions, [entityId]: position },
        }), false, 'setNodePosition')
      },

      setAllNodePositions: (positions: Record<string, NodePosition>) => {
        set({ nodePositions: positions }, false, 'setAllNodePositions')
      },

      selectEntity: (entityId: string, multi = false) => {
        set(state => {
          const next = new Set(multi ? state.selectedEntityIds : [])
          if (state.selectedEntityIds.has(entityId) && multi) {
            next.delete(entityId)
          } else {
            next.add(entityId)
          }
          return { selectedEntityIds: next }
        }, false, 'selectEntity')
      },

      clearSelection: () => {
        set({
          selectedEntityIds: new Set(),
          selectedRelationIds: new Set(),
        }, false, 'clearSelection')
      },

      openFieldPanel: (entity: EntityDTO) => {
        set({ showFieldPanel: true, editingEntity: entity }, false, 'openFieldPanel')
      },

      closeFieldPanel: () => {
        set({ showFieldPanel: false, editingEntity: null }, false, 'closeFieldPanel')
      },

      setLoading: (loading: boolean) => set({ loading }, false, 'setLoading'),
      setError: (error: string | null) => set({ error }, false, 'setError'),

      updateModel: (model: ModelDetailDTO) => {
        const { history, historyIndex } = get()
        const MAX_HISTORY = 50

        // 剪切当前位置之后的历史（新操作覆盖重做分支）
        const newHistory = [...history.slice(0, historyIndex + 1), model]
          .slice(-MAX_HISTORY)

        set({
          currentModel: model,
          history: newHistory,
          historyIndex: newHistory.length - 1,
        }, false, 'updateModel')
      },

      undo: () => {
        const { historyIndex, history } = get()
        if (historyIndex <= 0) return
        const newIndex = historyIndex - 1
        set({
          historyIndex: newIndex,
          currentModel: history[newIndex]!,
        }, false, 'undo')
      },

      redo: () => {
        const { historyIndex, history } = get()
        if (historyIndex >= history.length - 1) return
        const newIndex = historyIndex + 1
        set({
          historyIndex: newIndex,
          currentModel: history[newIndex]!,
        }, false, 'redo')
      },

      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,
    }),
    { name: 'DDM-ModelStore' }
  )
)
