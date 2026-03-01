/**
 * @file edge-renderer.ts
 * @description 连线渲染器 — 负责绘制表间关系连线（关系线/外键线）
 * @layer Canvas Render Package — Engine
 *
 * 职责：
 *   将 RenderEdge 数据结构绘制为关系连线，支持：
 *   - 直线（STRAIGHT）
 *   - 正交折线（ORTHOGONAL）
 *   - 贝塞尔曲线（BEZIER）
 *   - 两端的关系标记符号（1, N, 0..1, 1..N）
 *
 * @pattern GoF: Strategy（EdgeStyle 决定不同绘制策略）
 *
 * @module @ddm/canvas-render
 */

import { RenderEdge, RenderNode, EdgeStyle, RelationMark, Point } from '../types'

/** 连线颜色配置 */
const EDGE_COLORS = {
  normal:   '#94A3B8',
  selected: '#1677FF',
  hover:    '#60A5FA',
}

/**
 * 连线渲染器
 */
export class EdgeRenderer {

  /**
   * 绘制单条关系连线
   *
   * @param ctx Canvas 2D 渲染上下文
   * @param edge 连线数据
   * @param fromNode 源节点
   * @param toNode 目标节点
   */
  drawEdge(
    ctx: CanvasRenderingContext2D,
    edge: RenderEdge,
    fromNode: RenderNode,
    toNode: RenderNode,
  ): void {
    ctx.save()

    const color = edge.selected ? EDGE_COLORS.selected : EDGE_COLORS.normal
    ctx.strokeStyle = color
    ctx.lineWidth = edge.selected ? 2 : 1.5
    ctx.setLineDash([])

    // 计算连接点（节点边界上的最近点）
    const { from, to } = this._calcConnectionPoints(fromNode, toNode)

    // 根据样式选择绘制策略（GoF: Strategy）
    switch (edge.style) {
      case EdgeStyle.BEZIER:
        this._drawBezier(ctx, from, to)
        break
      case EdgeStyle.ORTHOGONAL:
        this._drawOrthogonal(ctx, from, to, edge.waypoints)
        break
      case EdgeStyle.STRAIGHT:
      default:
        this._drawStraight(ctx, from, to)
        break
    }

    // 绘制关系标记
    this._drawMark(ctx, from, to, edge.fromMark, true, color)
    this._drawMark(ctx, from, to, edge.toMark, false, color)

    // 绘制标签
    if (edge.label) {
      this._drawLabel(ctx, from, to, edge.label, color)
    }

    ctx.restore()
  }

  // ── 连线路径绘制策略 ──────────────────────────────────────────────────

  /** 直线连接 */
  private _drawStraight(ctx: CanvasRenderingContext2D, from: Point, to: Point): void {
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
  }

  /** 贝塞尔曲线连接（S 形曲线） */
  private _drawBezier(ctx: CanvasRenderingContext2D, from: Point, to: Point): void {
    const dx = (to.x - from.x) * 0.5
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.bezierCurveTo(
      from.x + dx, from.y,
      to.x - dx, to.y,
      to.x, to.y,
    )
    ctx.stroke()
  }

  /** 正交折线（水平→垂直→水平） */
  private _drawOrthogonal(
    ctx: CanvasRenderingContext2D,
    from: Point,
    to: Point,
    waypoints?: Point[],
  ): void {
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)

    if (waypoints && waypoints.length > 0) {
      // 使用预设途径点
      for (const wp of waypoints) {
        ctx.lineTo(wp.x, wp.y)
      }
    } else {
      // 自动计算正交路径
      const midX = (from.x + to.x) / 2
      ctx.lineTo(midX, from.y)
      ctx.lineTo(midX, to.y)
    }

    ctx.lineTo(to.x, to.y)
    ctx.stroke()
  }

  // ── 关系标记符号绘制 ──────────────────────────────────────────────────

  /**
   * 绘制连线端点的关系标记符号（1:1、1:N 等）
   * @param isFrom true 表示绘制 from 端（源节点一侧）
   */
  private _drawMark(
    ctx: CanvasRenderingContext2D,
    from: Point,
    to: Point,
    mark: RelationMark,
    isFrom: boolean,
    color: string,
  ): void {
    if (mark === RelationMark.NONE) return

    // 计算标记位置和角度
    const [px, py] = isFrom ? [from.x, from.y] : [to.x, to.y]
    const angle = isFrom
      ? Math.atan2(to.y - from.y, to.x - from.x)
      : Math.atan2(from.y - to.y, from.x - to.x)

    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(angle)
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = 1.5

    const MARK_OFFSET = 12  // 标记离节点的距离

    switch (mark) {
      case RelationMark.ONE:
        // 单竖线
        ctx.beginPath()
        ctx.moveTo(MARK_OFFSET, -6)
        ctx.lineTo(MARK_OFFSET, 6)
        ctx.stroke()
        break

      case RelationMark.MANY:
        // 叉号（三叉线）
        ctx.beginPath()
        ctx.moveTo(MARK_OFFSET, 0)
        ctx.lineTo(MARK_OFFSET + 10, -6)
        ctx.moveTo(MARK_OFFSET, 0)
        ctx.lineTo(MARK_OFFSET + 10, 0)
        ctx.moveTo(MARK_OFFSET, 0)
        ctx.lineTo(MARK_OFFSET + 10, 6)
        ctx.stroke()
        break

      case RelationMark.ZERO_OR_ONE:
        // 圆圈 + 单竖线
        ctx.beginPath()
        ctx.arc(MARK_OFFSET + 8, 0, 4, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(MARK_OFFSET + 16, -6)
        ctx.lineTo(MARK_OFFSET + 16, 6)
        ctx.stroke()
        break

      case RelationMark.ONE_OR_MANY:
        // 单竖线 + 叉号
        ctx.beginPath()
        ctx.moveTo(MARK_OFFSET, -6)
        ctx.lineTo(MARK_OFFSET, 6)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(MARK_OFFSET + 6, 0)
        ctx.lineTo(MARK_OFFSET + 14, -6)
        ctx.moveTo(MARK_OFFSET + 6, 0)
        ctx.lineTo(MARK_OFFSET + 14, 0)
        ctx.moveTo(MARK_OFFSET + 6, 0)
        ctx.lineTo(MARK_OFFSET + 14, 6)
        ctx.stroke()
        break
    }

    ctx.restore()
  }

  /** 绘制连线中点标签 */
  private _drawLabel(
    ctx: CanvasRenderingContext2D,
    from: Point,
    to: Point,
    label: string,
    color: string,
  ): void {
    const midX = (from.x + to.x) / 2
    const midY = (from.y + to.y) / 2

    ctx.font = '11px system-ui, sans-serif'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'

    // 背景白色矩形
    const textWidth = ctx.measureText(label).width
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.fillRect(midX - textWidth / 2 - 4, midY - 8, textWidth + 8, 16)

    ctx.fillStyle = color
    ctx.fillText(label, midX, midY)
  }

  // ── 辅助方法 ──────────────────────────────────────────────────────────

  /**
   * 计算两个节点之间的最近连接点（在节点边界上）
   * 策略：从中心点到另一个节点中心，取与边界的交点
   */
  private _calcConnectionPoints(
    fromNode: RenderNode,
    toNode: RenderNode,
  ): { from: Point; to: Point } {
    const fromCenter = this._nodeCenter(fromNode)
    const toCenter = this._nodeCenter(toNode)

    return {
      from: this._intersectNodeBorder(fromNode, fromCenter, toCenter),
      to: this._intersectNodeBorder(toNode, toCenter, fromCenter),
    }
  }

  private _nodeCenter(node: RenderNode): Point {
    return {
      x: node.position.x + node.size.width / 2,
      y: node.position.y + node.size.height / 2,
    }
  }

  /**
   * 计算从 from 到 to 方向，与 node 边界的交点
   */
  private _intersectNodeBorder(node: RenderNode, from: Point, to: Point): Point {
    const { x, y } = node.position
    const { width, height } = node.size

    const cx = x + width / 2
    const cy = y + height / 2
    const dx = to.x - from.x
    const dy = to.y - from.y

    if (dx === 0 && dy === 0) return from

    const absSlope = Math.abs(dy / dx)
    const halfW = width / 2
    const halfH = height / 2

    if (absSlope < halfH / halfW) {
      // 与左/右边界相交
      const side = dx > 0 ? 1 : -1
      const intersectX = cx + side * halfW
      const intersectY = cy + (dy / dx) * side * halfW
      return { x: intersectX, y: intersectY }
    } else {
      // 与上/下边界相交
      const side = dy > 0 ? 1 : -1
      const intersectX = cx + (dx / dy) * side * halfH
      const intersectY = cy + side * halfH
      return { x: intersectX, y: intersectY }
    }
  }
}
