/**
 * @file viewport.ts
 * @description 视口管理器 — 管理 Canvas 的缩放和平移状态
 * @layer Canvas Render Package — Engine
 *
 * 职责：
 *   维护视口状态（translateX, translateY, scale），
 *   提供坐标系转换方法（屏幕坐标 <-> 画布坐标），
 *   处理缩放边界约束。
 *
 * @pattern GoF: Singleton（每个 CanvasEngine 有唯一的 Viewport 实例）
 *           Observer（视口变化时通知 CanvasEngine 重绘）
 *
 * @module @ddm/canvas-render
 */

import { ViewportState, Point } from '../types'

/** 最小缩放比例 */
const MIN_SCALE = 0.1
/** 最大缩放比例 */
const MAX_SCALE = 4.0
/** 缩放步长（每次滚轮/按键缩放的量） */
const SCALE_STEP = 0.1

/**
 * 视口变化回调类型
 */
export type ViewportChangeCallback = (state: ViewportState) => void

/**
 * 视口管理器
 *
 * 坐标系说明：
 *  - 屏幕坐标（Screen Coords）：CSS 像素，以 Canvas 左上角为原点
 *  - 画布坐标（Canvas Coords）：逻辑坐标，节点的 position 使用此坐标系
 *  - 物理像素坐标（Physical Coords）：= 屏幕坐标 × devicePixelRatio（由 CanvasEngine 处理）
 */
export class Viewport {
  private _translateX: number
  private _translateY: number
  private _scale: number
  /** 变化监听器集合 */
  private _listeners: ViewportChangeCallback[] = []

  constructor(initial?: Partial<ViewportState>) {
    this._translateX = initial?.translateX ?? 0
    this._translateY = initial?.translateY ?? 0
    this._scale = initial?.scale ?? 1
  }

  // ── Getters ──────────────────────────────────────────────────────────

  get translateX(): number { return this._translateX }
  get translateY(): number { return this._translateY }
  get scale(): number { return this._scale }

  get state(): ViewportState {
    return {
      translateX: this._translateX,
      translateY: this._translateY,
      scale: this._scale,
    }
  }

  // ── 坐标转换 ──────────────────────────────────────────────────────────

  /**
   * 将屏幕坐标转换为画布坐标
   * 公式：canvasX = (screenX - translateX) / scale
   *
   * @param screenPoint 屏幕坐标（CSS 像素）
   * @returns 画布坐标
   */
  screenToCanvas(screenPoint: Point): Point {
    return {
      x: (screenPoint.x - this._translateX) / this._scale,
      y: (screenPoint.y - this._translateY) / this._scale,
    }
  }

  /**
   * 将画布坐标转换为屏幕坐标
   * 公式：screenX = canvasX * scale + translateX
   *
   * @param canvasPoint 画布坐标
   * @returns 屏幕坐标
   */
  canvasToScreen(canvasPoint: Point): Point {
    return {
      x: canvasPoint.x * this._scale + this._translateX,
      y: canvasPoint.y * this._scale + this._translateY,
    }
  }

  // ── 平移 ──────────────────────────────────────────────────────────────

  /**
   * 相对平移（增量式）
   * @param dx X 轴增量（屏幕像素）
   * @param dy Y 轴增量
   */
  pan(dx: number, dy: number): void {
    this._translateX += dx
    this._translateY += dy
    this._notify()
  }

  /**
   * 绝对定位（设置视口原点）
   */
  setTranslate(x: number, y: number): void {
    this._translateX = x
    this._translateY = y
    this._notify()
  }

  // ── 缩放 ──────────────────────────────────────────────────────────────

  /**
   * 以指定屏幕中心点为基准进行缩放
   * 缩放时保持中心点在画布上的位置不变（经典的"滚轮缩放"效果）
   *
   * @param delta 缩放增量（正值放大，负值缩小）
   * @param centerScreen 缩放中心点（屏幕坐标，通常为鼠标位置）
   */
  zoom(delta: number, centerScreen: Point): void {
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, this._scale + delta))
    if (newScale === this._scale) return

    // 保持 centerScreen 对应的画布点不变
    // canvasCenter = (centerScreen - translate) / scale  →  不变量
    // 新 translate = centerScreen - canvasCenter * newScale
    const canvasCenterX = (centerScreen.x - this._translateX) / this._scale
    const canvasCenterY = (centerScreen.y - this._translateY) / this._scale

    this._scale = newScale
    this._translateX = centerScreen.x - canvasCenterX * newScale
    this._translateY = centerScreen.y - canvasCenterY * newScale

    this._notify()
  }

  /**
   * 设置绝对缩放比例
   */
  setScale(scale: number, centerScreen?: Point): void {
    const clampedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
    const center = centerScreen ?? { x: 0, y: 0 }
    this.zoom(clampedScale - this._scale, center)
  }

  /**
   * 重置视口（回到 100% 并居中）
   */
  reset(): void {
    this._translateX = 0
    this._translateY = 0
    this._scale = 1
    this._notify()
  }

  /**
   * 适配视图（将所有内容适应到当前视口大小）
   * @param contentBounds 内容边界（画布坐标系）
   * @param viewportSize 视口大小（屏幕坐标系）
   * @param padding 内边距（默认 40px）
   */
  fitContent(
    contentBounds: { x: number; y: number; width: number; height: number },
    viewportSize: { width: number; height: number },
    padding = 40,
  ): void {
    if (contentBounds.width === 0 || contentBounds.height === 0) return

    const scaleX = (viewportSize.width - padding * 2) / contentBounds.width
    const scaleY = (viewportSize.height - padding * 2) / contentBounds.height
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.min(scaleX, scaleY)))

    this._scale = newScale
    this._translateX = (viewportSize.width - contentBounds.width * newScale) / 2 - contentBounds.x * newScale
    this._translateY = (viewportSize.height - contentBounds.height * newScale) / 2 - contentBounds.y * newScale

    this._notify()
  }

  // ── 工具方法 ──────────────────────────────────────────────────────────

  /**
   * 判断画布上的矩形是否在当前视口内（用于虚拟化渲染）
   * @param rect 画布坐标系的矩形
   * @param viewportWidth 视口宽度（屏幕坐标）
   * @param viewportHeight 视口高度（屏幕坐标）
   * @param margin 扩展边距（防止边界抖动，默认 50px）
   */
  isRectInViewport(
    rect: { x: number; y: number; width: number; height: number },
    viewportWidth: number,
    viewportHeight: number,
    margin = 50,
  ): boolean {
    const screenRect = {
      left:   rect.x * this._scale + this._translateX,
      top:    rect.y * this._scale + this._translateY,
      right:  (rect.x + rect.width) * this._scale + this._translateX,
      bottom: (rect.y + rect.height) * this._scale + this._translateY,
    }
    return (
      screenRect.right >= -margin &&
      screenRect.left <= viewportWidth + margin &&
      screenRect.bottom >= -margin &&
      screenRect.top <= viewportHeight + margin
    )
  }

  // ── 事件系统 ──────────────────────────────────────────────────────────

  /**
   * 订阅视口变化事件
   */
  onChange(callback: ViewportChangeCallback): () => void {
    this._listeners.push(callback)
    return () => {
      this._listeners = this._listeners.filter(l => l !== callback)
    }
  }

  private _notify(): void {
    const state = this.state
    this._listeners.forEach(l => l(state))
  }
}
