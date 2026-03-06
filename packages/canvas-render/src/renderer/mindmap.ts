/**
 * @file mindmap.ts
 * @description 思维导图渲染器
 * @layer canvas-render — Renderer
 *
 * 支持从数据模型自动生成思维导图视图
 *
 * @module @ddm/canvas-render
 */

import { CanvasEngine } from './engine/canvas-engine'
import { Viewport } from './engine/viewport'
import { NodeRenderer } from './engine/node-renderer'

// ── 思维导图节点 ─────────────────────────────────────────────────

export interface MindMapNode {
  id: string
  text: string
  children?: MindMapNode[]
  collapsed?: boolean
  style?: NodeStyle
}

export interface NodeStyle {
  backgroundColor?: string
  textColor?: string
  borderColor?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
}

// ── 思维导图配置 ─────────────────────────────────────────────────

export interface MindMapOptions {
  /** 布局方向 */
  direction: 'TB' | 'BT' | 'LR' | 'RL'
  /** 节点间距 */
  nodeSpacing?: number
  /** 层间距 */
  levelSpacing?: number
  /** 根节点样式 */
  rootStyle?: NodeStyle
  /** 分支样式 */
  branchStyle?: NodeStyle
  /** 是否显示连接线 */
  showLines?: boolean
  /** 连接线颜色 */
  lineColor?: string
}

const DEFAULT_OPTIONS: MindMapOptions = {
  direction: 'TB',
  nodeSpacing: 40,
  levelSpacing: 150,
  rootStyle: {
    backgroundColor: '#2563eb',
    textColor: '#ffffff',
    borderColor: '#1d4ed8',
    fontSize: 16,
    fontWeight: 'bold'
  },
  branchStyle: {
    backgroundColor: '#f0f7ff',
    textColor: '#1e3a8a',
    borderColor: '#93c5fd',
    fontSize: 14
  },
  showLines: true,
  lineColor: '#94a3b8'
}

// ── 思维导图渲染器 ─────────────────────────────────────────────────

export class MindMapRenderer {
  private engine: CanvasEngine
  private options: MindMapOptions
  private nodePositions: Map<string, { x: number; y: number; width: number; height: number }> = new Map()

  constructor(engine: CanvasEngine, options: Partial<MindMapOptions> = {}) {
    this.engine = engine
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * 渲染思维导图
   */
  render(root: MindMapNode): void {
    const ctx = this.engine.getContext()
    if (!ctx) return

    // 计算布局
    this.calculateLayout(root)

    // 绘制连接线
    if (this.options.showLines) {
      this.drawLines(root)
    }

    // 绘制节点
    this.drawNodes(root)
  }

  /**
   * 从数据模型生成思维导图
   */
  static fromModel(
    modelName: string,
    entities: Array<{ name: string; comment: string; fields: Array<{ name: string; comment: string }> }>
  ): MindMapNode {
    const root: MindMapNode = {
      id: 'root',
      text: modelName,
      style: DEFAULT_OPTIONS.rootStyle,
      children: entities.map(entity => ({
        id: entity.name,
        text: entity.comment || entity.name,
        style: DEFAULT_OPTIONS.branchStyle,
        children: entity.fields.slice(0, 5).map(field => ({
          id: `${entity.name}.${field.name}`,
          text: field.comment || field.name,
          style: {
            backgroundColor: '#ffffff',
            textColor: '#4b5563',
            borderColor: '#e5e7eb',
            fontSize: 12
          }
        }))
      }))
    }

    return root
  }

  /**
   * 计算节点位置
   */
  private calculateLayout(root: MindMapNode): void {
    const { nodeSpacing, levelSpacing, direction } = this.options

    let yOffset = 0

    const layoutNode = (node: MindMapNode, level: number): number => {
      // 递归计算子节点高度
      let childrenHeight = 0
      if (node.children && node.children.length > 0 && !node.collapsed) {
        childrenHeight = node.children.reduce((sum, child) => 
          sum + layoutNode(child, level + 1) + nodeSpacing, 0
        ) - nodeSpacing
      }

      // 节点高度（至少与子节点一致）
      const nodeHeight = Math.max(40, childrenHeight)

      // 计算位置
      const x = direction === 'LR' || direction === 'RL' 
        ? 100 + level * levelSpacing 
        : 100
      
      const y = direction === 'TB'
        ? yOffset + nodeHeight / 2
        : 100 + level * levelSpacing

      if (direction === 'TB') {
        this.nodePositions.set(node.id, { x, y, width: 120, height: 40 })
        yOffset += nodeHeight + nodeSpacing
      } else {
        this.nodePositions.set(node.id, { x, y, width: 120, height: 40 })
      }

      return nodeHeight
    }

    layoutNode(root, 0)
  }

  /**
   * 绘制连接线
   */
  private drawLines(node: MindMapNode): void {
    const ctx = this.engine.getContext()
    if (!ctx || !node.children) return

    const parentPos = this.nodePositions.get(node.id)
    if (!parentPos) return

    for (const child of node.children) {
      const childPos = this.nodePositions.get(child.id)
      if (!childPos) continue

      ctx.beginPath()
      ctx.strokeStyle = this.options.lineColor || '#94a3b8'
      ctx.lineWidth = 2

      // 贝塞尔曲线连接
      const startX = parentPos.x + parentPos.width
      const startY = parentPos.y
      const endX = childPos.x
      const endY = childPos.y
      const cpX = (startX + endX) / 2

      ctx.moveTo(startX, startY)
      ctx.bezierCurveTo(cpX, startY, cpX, endY, endX, endY)
      ctx.stroke()

      // 递归绘制子节点连接线
      if (!child.collapsed) {
        this.drawLines(child)
      }
    }
  }

  /**
   * 绘制节点
   */
  private drawNodes(node: MindMapNode): void {
    const ctx = this.engine.getContext()
    if (!ctx) return

    const pos = this.nodePositions.get(node.id)
    if (!pos) return

    const style = node.style || this.options.branchStyle

    // 绘制节点背景
    ctx.fillStyle = style.backgroundColor || '#f0f7ff'
    ctx.strokeStyle = style.borderColor || '#93c5fd'
    ctx.lineWidth = 1

    // 圆角矩形
    const radius = 8
    this.roundRect(ctx, pos.x, pos.y - pos.height / 2, pos.width, pos.height, radius)
    ctx.fill()
    ctx.stroke()

    // 绘制文本
    ctx.fillStyle = style.textColor || '#1e3a8a'
    ctx.font = `${style.fontWeight || 'normal'} ${style.fontSize || 14}px "Microsoft YaHei", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // 文本裁剪
    const text = node.text
    const maxWidth = pos.width - 16
    const displayText = this.truncateText(ctx, text, maxWidth)
    ctx.fillText(displayText, pos.x + pos.width / 2, pos.y)

    // 绘制折叠标记
    if (node.children && node.children.length > 0) {
      const toggleX = pos.x + pos.width + 8
      const toggleY = pos.y
      ctx.beginPath()
      ctx.fillStyle = '#6b7280'
      ctx.font = '12px sans-serif'
      ctx.fillText(node.collapsed ? '▶' : '▼', toggleX, toggleY + 4)
    }

    // 递归绘制子节点
    if (node.children && !node.collapsed) {
      for (const child of node.children) {
        this.drawNodes(child)
      }
    }
  }

  /**
   * 绘制圆角矩形
   */
  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
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
   * 切换节点折叠状态
   */
  toggleNode(nodeId: string): void {
    const findAndToggle = (node: MindMapNode): boolean => {
      if (node.id === nodeId) {
        node.collapsed = !node.collapsed
        return true
      }
      if (node.children) {
        for (const child of node.children) {
          if (findAndToggle(child)) return true
        }
      }
      return false
    }
  }
}

export default MindMapRenderer
