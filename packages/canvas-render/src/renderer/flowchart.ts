/**
 * @file flowchart.ts
 * @description 流程图渲染器
 * @layer canvas-render — Renderer
 *
 * 支持 BPMN 标准图形元素和流程图绘制
 *
 * @module @ddm/canvas-render
 */

import { CanvasEngine } from './engine/canvas-engine'

// ── 流程图类型定义 ─────────────────────────────────────────────────

export type FlowNodeType = 
  | 'start'      // 开始
  | 'end'        // 结束
  | 'process'    // 处理/活动
  | 'decision'   // 判断/决策
  | 'data'       // 数据/输入输出
  | 'document'   // 文档
  | 'subprocess' // 子流程

export interface FlowNode {
  id: string
  type: FlowNodeType
  text: string
  x: number
  y: number
  width: number
  height: number
  style?: FlowNodeStyle
}

export interface FlowEdge {
  id: string
  sourceId: string
  targetId: string
  label?: string
  type: 'normal' | 'conditional' | 'fork' | 'join'
}

export interface FlowNodeStyle {
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  fontSize?: number
}

export interface FlowChartOptions {
  /** 默认节点宽度 */
  nodeWidth?: number
  /** 默认节点高度 */
  nodeHeight?: number
  /** 边颜色 */
  edgeColor?: string
  /** 箭头大小 */
  arrowSize?: number
}

// ── 样式配置 ─────────────────────────────────────────────────

const NODE_STYLES: Record<FlowNodeType, FlowNodeStyle> = {
  start: { backgroundColor: '#22c55e', borderColor: '#16a34a', textColor: '#ffffff', fontSize: 14 },
  end: { backgroundColor: '#ef4444', borderColor: '#dc2626', textColor: '#ffffff', fontSize: 14 },
  process: { backgroundColor: '#3b82f6', borderColor: '#2563eb', textColor: '#ffffff', fontSize: 13 },
  decision: { backgroundColor: '#f59e0b', borderColor: '#d97706', textColor: '#ffffff', fontSize: 13 },
  data: { backgroundColor: '#ffffff', borderColor: '#6b7280', textColor: '#374151', fontSize: 12 },
  document: { backgroundColor: '#f3f4f6', borderColor: '#9ca3af', textColor: '#374151', fontSize: 12 },
  subprocess: { backgroundColor: '#8b5cf6', borderColor: '#7c3aed', textColor: '#ffffff', fontSize: 13 }
}

const DEFAULT_OPTIONS: FlowChartOptions = {
  nodeWidth: 120,
  nodeHeight: 50,
  edgeColor: '#6b7280',
  arrowSize: 8
}

// ── 流程图渲染器 ─────────────────────────────────────────────────

export class FlowChartRenderer {
  private engine: CanvasEngine
  private options: FlowChartOptions

  constructor(engine: CanvasEngine, options: Partial<FlowChartOptions> = {}) {
    this.engine = engine
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * 渲染流程图
   */
  render(nodes: FlowNode[], edges: FlowEdge[]): void {
    const ctx = this.engine.getContext()
    if (!ctx) return

    // 绘制边（先画边，确保在节点下方）
    for (const edge of edges) {
      this.drawEdge(edge, nodes)
    }

    // 绘制节点
    for (const node of nodes) {
      this.drawNode(node)
    }
  }

  /**
   * 创建默认流程节点
   */
  static createNode(
    id: string,
    type: FlowNodeType,
    text: string,
    x: number,
    y: number
  ): FlowNode {
    const options = DEFAULT_OPTIONS
    return {
      id,
      type,
      text,
      x,
      y,
      width: options.nodeWidth!,
      height: options.nodeHeight!,
      style: NODE_STYLES[type]
    }
  }

  /**
   * 创建连接边
   */
  static createEdge(
    id: string,
    sourceId: string,
    targetId: string,
    label?: string,
    type: FlowEdge['type'] = 'normal'
  ): FlowEdge {
    return { id, sourceId, targetId, label, type }
  }

  /**
   * 绘制单个节点
   */
  private drawNode(node: FlowNode): void {
    const ctx = this.engine.getContext()
    if (!ctx) return

    const style = node.style || NODE_STYLES[node.type]
    
    ctx.save()
    ctx.fillStyle = style.backgroundColor || '#ffffff'
    ctx.strokeStyle = style.borderColor || '#6b7280'
    ctx.lineWidth = 2

    switch (node.type) {
      case 'start':
        this.drawEllipse(ctx, node)
        break
      case 'end':
        this.drawEllipse(ctx, node)
        break
      case 'decision':
        this.drawDiamond(ctx, node)
        break
      case 'document':
        this.drawDocument(ctx, node)
        break
      default:
        this.drawRect(ctx, node)
    }

    // 绘制文本
    ctx.fillStyle = style.textColor || '#374151'
    ctx.font = `13px "Microsoft YaHei", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    const maxWidth = node.width - 16
    const displayText = this.truncateText(ctx, node.text, maxWidth)
    ctx.fillText(displayText, node.x + node.width / 2, node.y + node.height / 2)

    ctx.restore()
  }

  /**
   * 绘制椭圆（开始/结束节点）
   */
  private drawEllipse(ctx: CanvasRenderingContext2D, node: FlowNode): void {
    const cx = node.x + node.width / 2
    const cy = node.y + node.height / 2
    const rx = node.width / 2
    const ry = node.height / 2

    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  ├── 绘制矩形（处理节点）
   */
  private drawRect(ctx: CanvasRenderingContext2D, node: FlowNode): void {
    const { x, y, width, height } = node
    const radius = 4

    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  /**
   * 绘制菱形（判断节点）
   */
  private drawDiamond(ctx: CanvasRenderingContext2D, node: FlowNode): void {
    const { x, y, width, height } = node
    const cx = x + width / 2
    const cy = y + height / 2

    ctx.beginPath()
    ctx.moveTo(cx, y)
    ctx.lineTo(x + width, cy)
    ctx.lineTo(cx, y + height)
    ctx.lineTo(x, cy)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  /**
   * 绘制文档形状
   */
  private drawDocument(ctx: CanvasRenderingContext2D, node: FlowNode): void {
    const { x, y, width, height } = node

    ctx.beginPath()
    ctx.moveTo(x, y + 10)
    ctx.lineTo(x + 10, y)
    ctx.lineTo(x + width - 10, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + 10)
    ctx.lineTo(x + width, y + height - 10)
    ctx.quadraticCurveTo(x + width, y + height, x + width - 10, y + height)
    ctx.lineTo(x + 10, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - 10)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // 折痕线
    ctx.beginPath()
    ctx.setLineDash([4, 4])
    ctx.moveTo(x + 10, y + 15)
    ctx.lineTo(x + width - 10, y + 15)
    ctx.stroke()
    ctx.setLineDash([])
  }

  /**
   * 绘制边（连接线）
   */
  private drawEdge(edge: FlowEdge, nodes: FlowNode[]): void {
    const ctx = this.engine.getContext()
    if (!ctx) return

    const source = nodes.find(n => n.id === edge.sourceId)
    const target = nodes.find(n => n.id === edge.targetId)
    if (!source || !target) return

    // 计算连接点
    const startX = source.x + source.width
    const startY = source.y + source.height / 2
    const endX = target.x
    const endY = target.y + target.height / 2

    ctx.save()
    ctx.strokeStyle = this.options.edgeColor || '#6b7280'
    ctx.lineWidth = 2

    // 根据类型绘制不同样式的边
    if (edge.type === 'conditional') {
      // 条件分支 - 虚线
      ctx.setLineDash([6, 4])
    }

    ctx.beginPath()
    ctx.moveTo(startX, startY)

    // 中点控制
    const midX = (startX + endX) / 2
    ctx.bezierCurveTo(midX, startY, midX, endY, endX, endY)
    ctx.stroke()

    // 绘制箭头
    this.drawArrow(ctx, endX, endY, target.x, target.y)

    // 绘制标签
    if (edge.label) {
      ctx.fillStyle = '#4b5563'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(edge.label, midX, (startY + endY) / 2 - 10)
    }

    ctx.restore()
  }

  /**
   * 绘制箭头
   */
  private drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, targetX: number, targetY: number): void {
    const size = this.options.arrowSize || 8
    const angle = Math.atan2(targetY - y, targetX - x)

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(
      x - size * Math.cos(angle - Math.PI / 6),
      y - size * Math.sin(angle - Math.PI / 6)
    )
    ctx.moveTo(x, y)
    ctx.lineTo(
      x - size * Math.cos(angle + Math.PI / 6),
      y - size * Math.sin(angle + Math.PI / 6)
    )
    ctx.stroke()
  }

  /**
   * 文本裁剪
   */
  private truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    const metrics = ctx.measureText(text)
    if (metrics.width <= maxWidth) return text

    let truncated = text
    while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1)
    }
    return truncated + '...'
  }

  /**
   * 自动布局（从左到右）
   */
  autoLayout(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
    const positioned = new Set<string>()
    const result: FlowNode[] = []

    // 从开始节点开始
    const startNodes = nodes.filter(n => n.type === 'start')
    let currentX = 50
    let currentY = 100

    const positionNode = (node: FlowNode, x: number, y: number): void => {
      if (positioned.has(node.id)) return
      
      node.x = x
      node.y = y
      positioned.add(node.id)
      result.push(node)

      // 查找下一个节点
      const outgoing = edges.filter(e => e.sourceId === node.id)
      let nextY = y

      for (const edge of outgoing) {
        const target = nodes.find(n => n.id === edge.targetId)
        if (target && !positioned.has(target.id)) {
          positionNode(target, x + 180, nextY)
          nextY += 80
        }
      }
    }

    for (const node of startNodes) {
      positionNode(node, currentX, currentY)
    }

    // 处理未定位的节点
    for (const node of nodes) {
      if (!positioned.has(node.id)) {
        positionNode(node, currentX, currentY)
        currentY += 80
      }
    }

    return result
  }
}

export default FlowChartRenderer
