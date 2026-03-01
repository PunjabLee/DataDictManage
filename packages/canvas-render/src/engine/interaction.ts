/**
 * @file interaction.ts
 * @description 交互管理器 — 处理 Canvas 上的鼠标/键盘交互
 * @layer Canvas Render Package — Engine
 *
 * 职责：
 *   - 鼠标按下/移动/松开：拖拽节点、框选、画布平移
 *   - 滚轮：缩放
 *   - 双击：触发编辑
 *   - 右键：触发上下文菜单
 *   - 键盘：删除、复制、撤销等快捷键
 *   - 将底层 DOM 事件转换为 CanvasEvent 并派发给上层
 *
 * @pattern GoF: Observer（事件派发系统）
 *           Command（键盘快捷键映射）
 *           State（不同交互状态：idle/dragging/panning/selecting）
 *
 * @module @ddm/canvas-render
 */

import { Viewport } from './viewport'
import {
  RenderGraph,
  RenderNode,
  Point,
  CanvasEvent,
  CanvasEventType,
  CanvasEventListener,
  NodeState,
} from '../types'
import { NodeRenderer } from './node-renderer'

/** 交互状态机 */
type InteractionState =
  | 'idle'         // 无交互
  | 'panning'      // 正在平移画布（按住空格+拖动 / 中键拖动）
  | 'dragging'     // 正在拖拽节点
  | 'selecting'    // 框选中

/**
 * 交互管理器
 */
export class InteractionManager {
  private _state: InteractionState = 'idle'
  private _viewport: Viewport
  private _canvas: HTMLCanvasElement
  private _nodeRenderer: NodeRenderer
  private _listeners: Map<CanvasEventType, Set<CanvasEventListener>> = new Map()

  /** 当前正在拖拽的节点 */
  private _draggingNodeId: string | null = null
  /** 拖拽开始时鼠标相对于节点原点的偏移 */
  private _dragOffset: Point = { x: 0, y: 0 }
  /** 上次鼠标位置（用于计算增量） */
  private _lastMousePos: Point = { x: 0, y: 0 }
  /** 当前选中的节点 ID 集合 */
  private _selectedNodeIds: Set<string> = new Set()

  /** 数据引用（只读，变更通过回调） */
  private _graph: RenderGraph | null = null

  /** 外部传入的节点位置更新回调 */
  onNodeMove?: (nodeId: string, newPosition: Point) => void

  constructor(canvas: HTMLCanvasElement, viewport: Viewport) {
    this._canvas = canvas
    this._viewport = viewport
    this._nodeRenderer = new NodeRenderer()
    this._bindEvents()
  }

  // ── 公共 API ─────────────────────────────────────────────────────────

  /**
   * 更新渲染图数据引用（当外部数据变化时调用）
   */
  setGraph(graph: RenderGraph): void {
    this._graph = graph
  }

  /**
   * 注册 Canvas 事件监听器
   * @param type 事件类型
   * @param listener 监听函数
   * @returns 取消监听的函数
   */
  on<T extends CanvasEventType>(type: T, listener: CanvasEventListener<T>): () => void {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, new Set())
    }
    this._listeners.get(type)!.add(listener as CanvasEventListener)
    return () => this._listeners.get(type)?.delete(listener as CanvasEventListener)
  }

  /**
   * 销毁交互管理器（移除所有 DOM 事件监听）
   */
  destroy(): void {
    this._canvas.removeEventListener('mousedown', this._onMouseDown)
    this._canvas.removeEventListener('mousemove', this._onMouseMove)
    this._canvas.removeEventListener('mouseup', this._onMouseUp)
    this._canvas.removeEventListener('wheel', this._onWheel)
    this._canvas.removeEventListener('dblclick', this._onDblClick)
    this._canvas.removeEventListener('contextmenu', this._onContextMenu)
    window.removeEventListener('keydown', this._onKeyDown)
  }

  // ── DOM 事件绑定 ──────────────────────────────────────────────────────

  private _bindEvents(): void {
    this._canvas.addEventListener('mousedown', this._onMouseDown)
    this._canvas.addEventListener('mousemove', this._onMouseMove)
    this._canvas.addEventListener('mouseup', this._onMouseUp)
    this._canvas.addEventListener('wheel', this._onWheel, { passive: false })
    this._canvas.addEventListener('dblclick', this._onDblClick)
    this._canvas.addEventListener('contextmenu', this._onContextMenu)
    window.addEventListener('keydown', this._onKeyDown)
  }

  // ── 鼠标事件处理 ──────────────────────────────────────────────────────

  private _onMouseDown = (e: MouseEvent): void => {
    e.preventDefault()
    const screenPos = this._getCanvasRelativePos(e)
    const canvasPos = this._viewport.screenToCanvas(screenPos)
    this._lastMousePos = screenPos

    // 中键或空格+左键 → 平移模式
    if (e.button === 1 || (e.button === 0 && e.spaceKey)) {
      this._state = 'panning'
      this._canvas.style.cursor = 'grabbing'
      return
    }

    // 左键 → 尝试命中节点
    if (e.button === 0) {
      const hitNode = this._hitTestNodes(canvasPos)

      if (hitNode) {
        // 命中节点 → 开始拖拽
        this._state = 'dragging'
        this._draggingNodeId = hitNode.id
        this._dragOffset = {
          x: canvasPos.x - hitNode.position.x,
          y: canvasPos.y - hitNode.position.y,
        }

        // 多选逻辑（Ctrl/Cmd + 点击）
        if (!e.ctrlKey && !e.metaKey) {
          this._selectedNodeIds.clear()
        }
        this._selectedNodeIds.add(hitNode.id)

        this._emit({ type: 'node:select', target: hitNode.id, position: canvasPos })
      } else {
        // 点击空白区域 → 取消选中
        this._selectedNodeIds.clear()
        this._emit({ type: 'canvas:click', position: canvasPos })
      }
    }
  }

  private _onMouseMove = (e: MouseEvent): void => {
    const screenPos = this._getCanvasRelativePos(e)
    const canvasPos = this._viewport.screenToCanvas(screenPos)

    const dx = screenPos.x - this._lastMousePos.x
    const dy = screenPos.y - this._lastMousePos.y
    this._lastMousePos = screenPos

    switch (this._state) {
      case 'panning':
        // 平移画布
        this._viewport.pan(dx, dy)
        this._emit({ type: 'canvas:pan', viewport: this._viewport.state })
        break

      case 'dragging':
        if (this._draggingNodeId && this._graph) {
          // 移动节点
          const newPos: Point = {
            x: canvasPos.x - this._dragOffset.x,
            y: canvasPos.y - this._dragOffset.y,
          }
          this.onNodeMove?.(this._draggingNodeId, newPos)
          this._emit({ type: 'node:move', target: this._draggingNodeId, position: newPos })
        }
        break

      default: {
        // 悬停检测（更新 cursor）
        const hitNode = this._hitTestNodes(canvasPos)
        this._canvas.style.cursor = hitNode ? 'grab' : 'default'
        break
      }
    }
  }

  private _onMouseUp = (_e: MouseEvent): void => {
    if (this._state === 'dragging') {
      this._emit({ type: 'node:move', target: this._draggingNodeId ?? undefined })
    }
    this._state = 'idle'
    this._draggingNodeId = null
    this._canvas.style.cursor = 'default'
  }

  private _onWheel = (e: WheelEvent): void => {
    e.preventDefault()
    const screenPos = this._getCanvasRelativePos(e)
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    this._viewport.zoom(delta, screenPos)
    this._emit({ type: 'canvas:zoom', viewport: this._viewport.state })
  }

  private _onDblClick = (e: MouseEvent): void => {
    const canvasPos = this._viewport.screenToCanvas(this._getCanvasRelativePos(e))
    const hitNode = this._hitTestNodes(canvasPos)
    if (hitNode) {
      this._emit({ type: 'node:dblclick', target: hitNode.id, position: canvasPos })
    }
  }

  private _onContextMenu = (e: MouseEvent): void => {
    e.preventDefault()
    const canvasPos = this._viewport.screenToCanvas(this._getCanvasRelativePos(e))
    const hitNode = this._hitTestNodes(canvasPos)
    this._emit({ type: 'node:contextmenu', target: hitNode?.id, position: canvasPos })
  }

  private _onKeyDown = (e: KeyboardEvent): void => {
    // 快捷键仅在 Canvas 获得焦点时有效
    if (document.activeElement !== this._canvas) return
    // 更多快捷键可在此扩展（Delete、Ctrl+Z 等）
  }

  // ── 辅助方法 ──────────────────────────────────────────────────────────

  /**
   * 遍历所有节点进行点击检测
   * 从 zIndex 最高的节点开始（倒序），确保上层节点优先命中
   */
  private _hitTestNodes(canvasPos: Point): RenderNode | null {
    if (!this._graph) return null
    const sorted = [...this._graph.nodes].sort((a, b) => b.zIndex - a.zIndex)
    return sorted.find(n => this._nodeRenderer.hitTest(n, canvasPos)) ?? null
  }

  /**
   * 获取鼠标相对于 Canvas 元素左上角的位置
   */
  private _getCanvasRelativePos(e: MouseEvent): Point {
    const rect = this._canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  /**
   * 派发事件到所有监听器
   */
  private _emit(event: CanvasEvent): void {
    const listeners = this._listeners.get(event.type)
    if (listeners) {
      listeners.forEach(l => l(event))
    }
  }
}
