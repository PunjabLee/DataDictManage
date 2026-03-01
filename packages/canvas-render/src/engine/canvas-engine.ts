/**
 * @file canvas-engine.ts
 * @description Canvas 渲染引擎核心 — 数据模型 ER 图的主渲染器
 * @layer Canvas Render Package — Engine
 *
 * 职责：
 *   CanvasEngine 是整个渲染引擎的入口和协调者，负责：
 *   1. 初始化 Canvas 高清渲染（HiDPI/devicePixelRatio 适配）
 *   2. 管理渲染图数据（RenderGraph）
 *   3. 驱动渲染循环（requestAnimationFrame）
 *   4. 虚拟化渲染（只渲染视口内的节点，优化大型图表性能）
 *   5. 协调 Viewport、NodeRenderer、EdgeRenderer、InteractionManager
 *   6. 对外暴露简洁的 API（setGraph、on、destroy 等）
 *
 * 渲染管线：
 *   CanvasEngine.render()
 *     ├─ clearCanvas()          清空画布
 *     ├─ drawBackground()       绘制背景和网格
 *     ├─ applyViewportTransform() 应用视口变换（translate + scale）
 *     ├─ EdgeRenderer.drawEdge() 先渲染连线（避免被节点遮挡）
 *     └─ NodeRenderer.drawNode() 再渲染节点（按 zIndex 排序）
 *
 * @pattern GoF: Facade（统一引擎接口）
 *           Template Method（render 流程固定，各步骤可重写）
 *           Composite（RenderGraph 包含 nodes + edges）
 *           Observer（事件系统）
 *
 * @module @ddm/canvas-render
 */

import { Viewport } from './viewport'
import { NodeRenderer, DEFAULT_NODE_STYLE } from './node-renderer'
import { EdgeRenderer } from './edge-renderer'
import { InteractionManager } from './interaction'
import {
  CanvasEngineOptions,
  RenderGraph,
  RenderNode,
  NodeState,
  NodeStyle,
  Point,
  CanvasEventType,
  CanvasEventListener,
  ViewportState,
} from '../types'

/**
 * Canvas 渲染引擎
 *
 * 使用示例：
 * ```ts
 * const engine = new CanvasEngine({
 *   canvas: document.getElementById('er-canvas') as HTMLCanvasElement,
 *   hiDPI: true,
 *   virtualRendering: true,
 * })
 *
 * engine.setGraph(myRenderGraph)
 * engine.on('node:select', (event) => console.log('选中节点:', event.target))
 * engine.fitContent()
 * ```
 */
export class CanvasEngine {
  private readonly _canvas: HTMLCanvasElement
  private readonly _ctx: CanvasRenderingContext2D
  private readonly _viewport: Viewport
  private readonly _nodeRenderer: NodeRenderer
  private readonly _edgeRenderer: EdgeRenderer
  private readonly _interaction: InteractionManager
  private readonly _options: Required<Pick<CanvasEngineOptions, 'hiDPI' | 'virtualRendering'>>

  /** 当前渲染图数据 */
  private _graph: RenderGraph | null = null
  /** rAF 帧 ID（用于取消动画循环） */
  private _rafId: number | null = null
  /** 是否需要重绘（脏标记，避免不必要的重绘） */
  private _dirty: boolean = false
  /** devicePixelRatio */
  private _dpr: number = 1

  constructor(options: CanvasEngineOptions) {
    this._canvas = options.canvas

    // 获取 2D 渲染上下文（关闭 alpha 通道可提升性能）
    const ctx = this._canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('无法获取 Canvas 2D 渲染上下文')
    this._ctx = ctx

    // 初始化各子模块
    this._viewport = new Viewport(options.viewport)
    this._nodeRenderer = new NodeRenderer(options.nodeStyle)
    this._edgeRenderer = new EdgeRenderer()
    this._interaction = new InteractionManager(this._canvas, this._viewport)

    this._options = {
      hiDPI: options.hiDPI ?? true,
      virtualRendering: options.virtualRendering ?? true,
    }

    // 初始化 HiDPI
    if (this._options.hiDPI) {
      this._initHiDPI()
    }

    // 监听视口变化 → 标记需要重绘
    this._viewport.onChange(() => this._markDirty())

    // 监听节点移动 → 更新位置并重绘
    this._interaction.onNodeMove = (nodeId, newPosition) => {
      if (!this._graph) return
      const node = this._graph.nodes.find(n => n.id === nodeId)
      if (node) {
        node.position = newPosition
        this._markDirty()
      }
    }

    // 视口变化也触发重绘
    this._viewport.onChange(() => this._markDirty())

    // 设置初始渲染图
    if (options.graph) {
      this.setGraph(options.graph)
    }

    // 启动渲染循环
    this._startRenderLoop()

    // 监听窗口 resize → 重新适配 HiDPI + 重绘
    window.addEventListener('resize', this._onResize)
  }

  // ── 公共 API ─────────────────────────────────────────────────────────

  /**
   * 设置或更新渲染图数据
   * @param graph 渲染图
   */
  setGraph(graph: RenderGraph): void {
    this._graph = graph
    // 同步给交互管理器
    this._interaction.setGraph(graph)
    this._markDirty()
  }

  /**
   * 获取当前渲染图（只读引用）
   */
  getGraph(): RenderGraph | null {
    return this._graph
  }

  /**
   * 注册 Canvas 事件监听器
   */
  on<T extends CanvasEventType>(type: T, listener: CanvasEventListener<T>): () => void {
    return this._interaction.on(type, listener)
  }

  /**
   * 适配视图 — 将所有节点缩放到视口内居中显示
   */
  fitContent(): void {
    if (!this._graph || this._graph.nodes.length === 0) return

    const bounds = this._calcGraphBounds()
    const viewportSize = {
      width: this._canvas.clientWidth,
      height: this._canvas.clientHeight,
    }
    this._viewport.fitContent(bounds, viewportSize)
  }

  /**
   * 重置视口（100% 缩放，居左上角）
   */
  resetViewport(): void {
    this._viewport.reset()
  }

  /**
   * 聚焦到某个节点（将节点移动到视口中心）
   */
  focusNode(nodeId: string): void {
    if (!this._graph) return
    const node = this._graph.nodes.find(n => n.id === nodeId)
    if (!node) return

    const nodeCenter: Point = {
      x: node.position.x + node.size.width / 2,
      y: node.position.y + node.size.height / 2,
    }
    const viewportCenter: Point = {
      x: this._canvas.clientWidth / 2,
      y: this._canvas.clientHeight / 2,
    }

    this._viewport.setTranslate(
      viewportCenter.x - nodeCenter.x * this._viewport.scale,
      viewportCenter.y - nodeCenter.y * this._viewport.scale,
    )
  }

  /**
   * 更新节点状态（选中/悬停/拖拽）
   */
  setNodeState(nodeId: string, state: NodeState): void {
    if (!this._graph) return
    const node = this._graph.nodes.find(n => n.id === nodeId)
    if (node) {
      node.state = state
      this._markDirty()
    }
  }

  /**
   * 获取当前视口状态
   */
  getViewportState(): ViewportState {
    return this._viewport.state
  }

  /**
   * 强制立即重绘
   */
  invalidate(): void {
    this._markDirty()
  }

  /**
   * 销毁引擎，释放所有资源
   */
  destroy(): void {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId)
      this._rafId = null
    }
    this._interaction.destroy()
    window.removeEventListener('resize', this._onResize)
  }

  // ── 渲染核心 ─────────────────────────────────────────────────────────

  /**
   * 启动基于 requestAnimationFrame 的渲染循环
   * 脏标记优化：只有 _dirty === true 时才执行实际绘制
   */
  private _startRenderLoop(): void {
    const loop = () => {
      if (this._dirty) {
        this._render()
        this._dirty = false
      }
      this._rafId = requestAnimationFrame(loop)
    }
    this._rafId = requestAnimationFrame(loop)
  }

  /**
   * 标记需要重绘（下一帧生效）
   */
  private _markDirty(): void {
    this._dirty = true
  }

  /**
   * 主渲染方法（Template Method）
   */
  private _render(): void {
    const ctx = this._ctx
    const canvas = this._canvas

    // Step 1: 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Step 2: 绘制背景
    this._drawBackground()

    if (!this._graph) return

    // Step 3: 应用视口变换（平移 + 缩放）
    ctx.save()
    ctx.scale(this._dpr, this._dpr)  // HiDPI 缩放
    ctx.translate(this._viewport.translateX, this._viewport.translateY)
    ctx.scale(this._viewport.scale, this._viewport.scale)

    const viewportW = canvas.clientWidth
    const viewportH = canvas.clientHeight

    // Step 4: 渲染连线（先于节点，避免遮挡）
    const nodeMap = new Map(this._graph.nodes.map(n => [n.id, n]))
    for (const edge of this._graph.edges) {
      const fromNode = nodeMap.get(edge.fromNodeId)
      const toNode = nodeMap.get(edge.toNodeId)
      if (!fromNode || !toNode) continue

      // 虚拟化：仅渲染两端都在视口附近的连线
      if (this._options.virtualRendering) {
        const fromInView = this._viewport.isRectInViewport(
          { ...fromNode.position, ...fromNode.size }, viewportW, viewportH, 100
        )
        const toInView = this._viewport.isRectInViewport(
          { ...toNode.position, ...toNode.size }, viewportW, viewportH, 100
        )
        if (!fromInView && !toInView) continue
      }

      this._edgeRenderer.drawEdge(ctx, edge, fromNode, toNode)
    }

    // Step 5: 按 zIndex 排序后渲染节点（zIndex 大的在上层）
    const sortedNodes = [...this._graph.nodes].sort((a, b) => a.zIndex - b.zIndex)
    for (const node of sortedNodes) {
      // 虚拟化渲染：跳过视口外的节点（减少 GPU 负担）
      if (this._options.virtualRendering) {
        if (!this._viewport.isRectInViewport(
          { ...node.position, ...node.size }, viewportW, viewportH
        )) continue
      }
      this._nodeRenderer.drawNode(ctx, node, this._viewport.scale)
    }

    ctx.restore()
  }

  /**
   * 绘制画布背景（纯色 + 可选网格点阵）
   */
  private _drawBackground(): void {
    const ctx = this._ctx
    const { width, height } = this._canvas
    const graph = this._graph

    // 背景色
    ctx.fillStyle = graph?.backgroundColor ?? '#F8FAFF'
    ctx.fillRect(0, 0, width, height)

    // 网格点阵
    if (graph?.showGrid) {
      const gridSize = (graph.gridSize ?? 20) * this._viewport.scale * this._dpr
      const offsetX = (this._viewport.translateX % gridSize + gridSize) % gridSize * this._dpr
      const offsetY = (this._viewport.translateY % gridSize + gridSize) % gridSize * this._dpr

      ctx.fillStyle = '#CBD5E1'
      for (let x = offsetX; x < width; x += gridSize) {
        for (let y = offsetY; y < height; y += gridSize) {
          ctx.beginPath()
          ctx.arc(x, y, 1, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  }

  // ── HiDPI 适配 ────────────────────────────────────────────────────────

  /**
   * 初始化 HiDPI（高分辨率屏幕）适配
   * 通过将 Canvas 物理像素设为 CSS 像素的 dpr 倍，实现清晰渲染
   */
  private _initHiDPI(): void {
    this._dpr = window.devicePixelRatio || 1
    this._resizeCanvas()
  }

  private _resizeCanvas(): void {
    const rect = this._canvas.getBoundingClientRect()
    this._canvas.width = rect.width * this._dpr
    this._canvas.height = rect.height * this._dpr
  }

  private _onResize = (): void => {
    if (this._options.hiDPI) {
      this._resizeCanvas()
    }
    this._markDirty()
  }

  // ── 内部辅助 ─────────────────────────────────────────────────────────

  /**
   * 计算所有节点的整体边界（用于 fitContent）
   */
  private _calcGraphBounds(): { x: number; y: number; width: number; height: number } {
    const nodes = this._graph?.nodes ?? []
    if (nodes.length === 0) return { x: 0, y: 0, width: 0, height: 0 }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const node of nodes) {
      minX = Math.min(minX, node.position.x)
      minY = Math.min(minY, node.position.y)
      maxX = Math.max(maxX, node.position.x + node.size.width)
      maxY = Math.max(maxY, node.position.y + node.size.height)
    }

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  }
}
