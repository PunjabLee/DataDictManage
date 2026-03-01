/**
 * @file node-renderer.ts
 * @description 节点渲染器 — 负责将数据表卡片绘制到 Canvas
 * @layer Canvas Render Package — Engine
 *
 * 职责：
 *   将 RenderNode 数据结构绘制为数据表卡片，包含：
 *   - 标题栏（表名 + 注释）
 *   - 字段列表（字段名、类型、约束标记）
 *   - 选中/悬停高亮效果
 *   - 主键、外键、数据标准标记
 *
 * @pattern GoF: Strategy（NodeRenderer 是渲染策略，可替换为其他风格）
 *           Template Method（drawNode → drawHeader + drawFields + drawBorder）
 *
 * @module @ddm/canvas-render
 */

import { RenderNode, NodeState, NodeStyle, RenderField, Rect } from '../types'

/** 默认节点样式 */
export const DEFAULT_NODE_STYLE: NodeStyle = {
  headerHeight: 36,
  fieldRowHeight: 28,
  minWidth: 200,
  maxWidth: 400,
  borderRadius: 6,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  headerFontSize: 13,
  fieldFontSize: 12,
  padding: { top: 8, right: 12, bottom: 8, left: 12 },
  primaryColor: '#1677FF',
  standardBadgeColor: '#52C41A',
}

/** 各状态的边框颜色 */
const STATE_BORDER_COLOR: Record<NodeState, string> = {
  [NodeState.NORMAL]:   '#E2E8F0',
  [NodeState.SELECTED]: '#1677FF',
  [NodeState.HOVERED]:  '#93C5FD',
  [NodeState.DRAGGING]: '#1677FF',
  [NodeState.EDITING]:  '#FAAD14',
}

/**
 * 节点渲染器
 * 无状态，所有参数从外部传入（方便测试和复用）
 */
export class NodeRenderer {
  private readonly style: NodeStyle

  constructor(style?: Partial<NodeStyle>) {
    this.style = { ...DEFAULT_NODE_STYLE, ...style }
  }

  // ── 主渲染入口 ────────────────────────────────────────────────────────

  /**
   * 绘制完整的数据表节点
   *
   * @param ctx Canvas 2D 渲染上下文
   * @param node 要绘制的节点数据
   * @param scale 当前缩放比例（用于字体清晰度校正）
   */
  drawNode(ctx: CanvasRenderingContext2D, node: RenderNode, scale: number): void {
    ctx.save()
    ctx.translate(node.position.x, node.position.y)

    const w = node.size.width
    const h = node.size.height

    // 1. 绘制外层阴影（选中时阴影更深）
    this._drawShadow(ctx, w, h, node.state)

    // 2. 绘制背景（白色卡片）
    this._drawBackground(ctx, w, h)

    // 3. 绘制标题栏
    this._drawHeader(ctx, node, w)

    // 4. 绘制字段列表（折叠时跳过）
    if (!node.collapsed) {
      this._drawFields(ctx, node.fields, w)
    }

    // 5. 绘制边框（根据状态着色）
    this._drawBorder(ctx, w, h, node.state)

    ctx.restore()
  }

  // ── 计算节点尺寸 ──────────────────────────────────────────────────────

  /**
   * 根据字段数量计算节点高度
   * （调用者在创建 RenderNode 时先调用此方法确定 size）
   */
  calcNodeSize(fields: RenderField[], labelText: string): { width: number; height: number } {
    const { headerHeight, fieldRowHeight, minWidth, maxWidth, padding } = this.style

    // 估算文字宽度（粗略）
    const labelWidth = labelText.length * this.style.headerFontSize * 0.65 + padding.left + padding.right
    const width = Math.min(maxWidth, Math.max(minWidth, labelWidth))

    const bodyHeight = fields.length * fieldRowHeight + padding.bottom
    const height = headerHeight + bodyHeight

    return { width, height }
  }

  // ── 私有绘制方法 ─────────────────────────────────────────────────────

  private _drawShadow(ctx: CanvasRenderingContext2D, w: number, h: number, state: NodeState): void {
    const isActive = state === NodeState.SELECTED || state === NodeState.DRAGGING
    ctx.shadowColor = isActive ? 'rgba(22,119,255,0.3)' : 'rgba(0,0,0,0.1)'
    ctx.shadowBlur = isActive ? 12 : 6
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = isActive ? 4 : 2

    // 绘制一个透明矩形来触发阴影（实际背景在 _drawBackground 中绘制）
    this._roundRect(ctx, 0, 0, w, h, this.style.borderRadius)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()

    // 重置阴影避免影响后续绘制
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }

  private _drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this._roundRect(ctx, 0, 0, w, h, this.style.borderRadius)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
  }

  private _drawHeader(ctx: CanvasRenderingContext2D, node: RenderNode, w: number): void {
    const { headerHeight, borderRadius, padding, headerFontSize, fontFamily } = this.style
    const color = node.layerColor || this.style.primaryColor

    // 标题栏背景（顶部圆角，底部直角）
    ctx.save()
    this._roundRect(ctx, 0, 0, w, headerHeight, [borderRadius, borderRadius, 0, 0])
    ctx.fillStyle = color
    ctx.fill()
    ctx.restore()

    // 表名（白色，加粗）
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `bold ${headerFontSize}px ${fontFamily}`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    const tableNameText = node.name
    ctx.fillText(tableNameText, padding.left, headerHeight / 2, w - padding.left - padding.right - 20)

    // 注释（右对齐，半透明）
    if (node.comment) {
      ctx.font = `${headerFontSize - 1}px ${fontFamily}`
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.textAlign = 'right'
      ctx.fillText(node.comment, w - padding.right, headerHeight / 2, 100)
    }
  }

  private _drawFields(ctx: CanvasRenderingContext2D, fields: RenderField[], w: number): void {
    const { headerHeight, fieldRowHeight, fieldFontSize, fontFamily, padding } = this.style

    fields.forEach((field, i) => {
      const y = headerHeight + i * fieldRowHeight
      const isEven = i % 2 === 0

      // 斑马纹背景
      if (isEven) {
        ctx.fillStyle = '#F8FAFC'
        ctx.fillRect(0, y, w, fieldRowHeight)
      }

      // 主键图标 🔑
      let xOffset = padding.left
      if (field.isPrimaryKey) {
        ctx.font = `${fieldFontSize}px ${fontFamily}`
        ctx.fillText('🔑', xOffset, y + fieldRowHeight / 2 + 4)
        xOffset += 18
      } else if (field.isForeignKey) {
        ctx.fillStyle = '#F59E0B'
        ctx.font = `${fieldFontSize}px ${fontFamily}`
        ctx.fillText('FK', xOffset, y + fieldRowHeight / 2 + 4)
        xOffset += 22
      }

      // 字段名
      ctx.fillStyle = '#1E293B'
      ctx.font = `${fieldFontSize}px ${fontFamily}`
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'left'
      ctx.fillText(field.name, xOffset, y + fieldRowHeight / 2)

      // 字段类型（右对齐，灰色）
      ctx.fillStyle = '#64748B'
      ctx.font = `${fieldFontSize - 1}px ${fontFamily}`
      ctx.textAlign = 'right'
      let typeX = w - padding.right
      // 数据标准绑定标记（绿色圆点）
      if (field.hasStandard) {
        ctx.fillStyle = this.style.standardBadgeColor
        ctx.beginPath()
        ctx.arc(typeX - 6, y + fieldRowHeight / 2, 4, 0, Math.PI * 2)
        ctx.fill()
        typeX -= 16
      }
      ctx.fillStyle = '#94A3B8'
      ctx.fillText(field.typeLabel, typeX, y + fieldRowHeight / 2)

      // NOT NULL 标记（红色星号）
      if (field.isNotNull && !field.isPrimaryKey) {
        ctx.fillStyle = '#EF4444'
        ctx.font = `bold ${fieldFontSize}px ${fontFamily}`
        ctx.textAlign = 'right'
        ctx.fillText('*', typeX - ctx.measureText(field.typeLabel).width - 6, y + fieldRowHeight / 2)
      }
    })
  }

  private _drawBorder(ctx: CanvasRenderingContext2D, w: number, h: number, state: NodeState): void {
    this._roundRect(ctx, 0, 0, w, h, this.style.borderRadius)
    ctx.strokeStyle = STATE_BORDER_COLOR[state]
    ctx.lineWidth = state === NodeState.SELECTED || state === NodeState.DRAGGING ? 2 : 1
    ctx.stroke()
  }

  // ── 工具方法 ──────────────────────────────────────────────────────────

  /**
   * 绘制圆角矩形路径
   * @param ctx Canvas 2D 上下文
   * @param radii 圆角半径（数字 = 四角相同，数组 = [左上, 右上, 右下, 左下]）
   */
  private _roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radii: number | [number, number, number, number],
  ): void {
    const [tl, tr, br, bl] = typeof radii === 'number'
      ? [radii, radii, radii, radii]
      : radii
    ctx.beginPath()
    ctx.moveTo(x + tl, y)
    ctx.lineTo(x + w - tr, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + tr)
    ctx.lineTo(x + w, y + h - br)
    ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h)
    ctx.lineTo(x + bl, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - bl)
    ctx.lineTo(x, y + tl)
    ctx.quadraticCurveTo(x, y, x + tl, y)
    ctx.closePath()
  }

  /**
   * 点击检测：判断屏幕坐标是否在节点内（在画布坐标系中计算）
   */
  hitTest(node: RenderNode, canvasPoint: { x: number; y: number }): boolean {
    const { x, y } = canvasPoint
    const nx = node.position.x
    const ny = node.position.y
    const nw = node.size.width
    const nh = node.size.height
    return x >= nx && x <= nx + nw && y >= ny && y <= ny + nh
  }

  /**
   * 获取节点的完整边界矩形（画布坐标系）
   */
  getNodeBounds(node: RenderNode): Rect {
    return {
      x: node.position.x,
      y: node.position.y,
      width: node.size.width,
      height: node.size.height,
    }
  }
}
