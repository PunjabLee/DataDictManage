/**
 * @file types.ts
 * @description Canvas 渲染引擎类型定义
 * @layer Canvas Render Package — Public Types
 *
 * 所有渲染引擎的核心数据结构定义在此文件。
 * 这些类型与领域模型解耦，Canvas 渲染层只关心如何"画"，
 * 而不关心业务语义（通过适配器将 ModelDetailDTO 转为 RenderGraph）。
 *
 * @module @ddm/canvas-render
 */

// ── 基础几何类型 ─────────────────────────────────────────────────────────

/**
 * 2D 坐标点
 */
export interface Point {
  x: number
  y: number
}

/**
 * 矩形区域
 */
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 边距
 */
export interface Padding {
  top: number
  right: number
  bottom: number
  left: number
}

// ── 节点（数据表卡片）类型 ───────────────────────────────────────────────

/**
 * 渲染节点状态
 */
export enum NodeState {
  NORMAL   = 'NORMAL',   // 正常
  SELECTED = 'SELECTED', // 已选中（高亮边框）
  HOVERED  = 'HOVERED',  // 鼠标悬停
  DRAGGING = 'DRAGGING', // 正在拖拽
  EDITING  = 'EDITING',  // 正在编辑（名称输入框激活）
}

/**
 * 字段渲染数据
 */
export interface RenderField {
  id: string
  name: string
  comment: string
  typeLabel: string    // 显示用类型标签，如 "VARCHAR(255)"
  isPrimaryKey: boolean
  isForeignKey: boolean
  isNotNull: boolean
  hasStandard: boolean  // 是否绑定了数据标准
}

/**
 * 节点渲染数据（对应一张数据表）
 */
export interface RenderNode {
  /** 节点 ID（= EntityId） */
  id: string
  /** 表名 */
  name: string
  /** 表注释（中文名） */
  comment: string
  /** 节点在画布上的位置 */
  position: Point
  /** 节点尺寸（渲染时根据字段数量计算） */
  size: { width: number; height: number }
  /** 节点当前状态 */
  state: NodeState
  /** 字段列表 */
  fields: RenderField[]
  /** 层次标签颜色（概念/逻辑/物理） */
  layerColor: string
  /** 是否折叠（折叠时只显示标题） */
  collapsed: boolean
  /** z-index（拖拽时置于顶层） */
  zIndex: number
}

// ── 边（关系连线）类型 ─────────────────────────────────────────────────

/**
 * 连线样式
 */
export enum EdgeStyle {
  STRAIGHT  = 'STRAIGHT',   // 直线
  ORTHOGONAL = 'ORTHOGONAL', // 折线（水平/垂直转折）
  BEZIER    = 'BEZIER',     // 贝塞尔曲线
}

/**
 * 关系类型标记（用于连线两端的符号绘制）
 */
export enum RelationMark {
  NONE        = 'NONE',
  ONE         = 'ONE',         // 单线（1）
  MANY        = 'MANY',        // 叉号（N）
  ZERO_OR_ONE = 'ZERO_OR_ONE', // 圆圈+单线（0..1）
  ONE_OR_MANY = 'ONE_OR_MANY', // 叉号+单线（1..N）
}

/**
 * 渲染边（表间关系连线）
 */
export interface RenderEdge {
  id: string
  fromNodeId: string  // 源节点 ID
  toNodeId: string    // 目标节点 ID
  style: EdgeStyle
  fromMark: RelationMark
  toMark: RelationMark
  label?: string
  selected: boolean
  /** 连线路径上的途经点（折线时使用） */
  waypoints?: Point[]
}

// ── 渲染图（完整画布数据） ────────────────────────────────────────────

/**
 * 完整渲染图数据
 * 包含所有节点和边，是 CanvasEngine 的输入数据结构
 */
export interface RenderGraph {
  nodes: RenderNode[]
  edges: RenderEdge[]
  /** 画布背景色 */
  backgroundColor: string
  /** 是否显示网格 */
  showGrid: boolean
  /** 网格间距（像素） */
  gridSize: number
}

// ── 视口（Viewport） ──────────────────────────────────────────────────

/**
 * 视口状态（缩放和平移）
 */
export interface ViewportState {
  /** 平移 X（画布坐标系原点在屏幕的 X 偏移） */
  translateX: number
  /** 平移 Y */
  translateY: number
  /** 缩放比例（1 = 100%，范围 0.1 ~ 4.0） */
  scale: number
}

// ── 交互事件 ──────────────────────────────────────────────────────────

/**
 * Canvas 引擎派发的事件类型
 */
export type CanvasEventType =
  | 'node:select'      // 节点被选中
  | 'node:deselect'    // 节点取消选中
  | 'node:move'        // 节点被移动
  | 'node:dblclick'    // 节点被双击（触发内嵌编辑）
  | 'node:contextmenu' // 右键菜单
  | 'edge:select'      // 连线被选中
  | 'edge:dblclick'    // 连线被双击
  | 'canvas:click'     // 点击画布空白区域
  | 'canvas:zoom'      // 缩放变化
  | 'canvas:pan'       // 平移变化
  | 'viewport:change'  // 视口任意变化

/**
 * Canvas 引擎事件对象
 */
export interface CanvasEvent<T extends CanvasEventType = CanvasEventType> {
  type: T
  target?: string   // 目标节点或边的 ID
  position?: Point  // 事件在画布坐标系中的位置
  viewport?: ViewportState
  data?: unknown    // 附加数据
}

/**
 * 事件监听器类型
 */
export type CanvasEventListener<T extends CanvasEventType = CanvasEventType> = (
  event: CanvasEvent<T>
) => void

// ── 渲染配置 ──────────────────────────────────────────────────────────

/**
 * 节点渲染样式配置
 */
export interface NodeStyle {
  /** 标题栏高度 */
  headerHeight: number
  /** 字段行高 */
  fieldRowHeight: number
  /** 节点最小宽度 */
  minWidth: number
  /** 节点最大宽度 */
  maxWidth: number
  /** 圆角半径 */
  borderRadius: number
  /** 字体 */
  fontFamily: string
  /** 标题字体大小 */
  headerFontSize: number
  /** 字段字体大小 */
  fieldFontSize: number
  /** 内边距 */
  padding: Padding
  /** 主题色（标题背景） */
  primaryColor: string
  /** 标准绑定标记颜色 */
  standardBadgeColor: string
}

/**
 * Canvas 引擎初始化选项
 */
export interface CanvasEngineOptions {
  /** 挂载的 HTMLCanvasElement */
  canvas: HTMLCanvasElement
  /** 初始渲染图（可选，后续通过 setGraph 设置） */
  graph?: RenderGraph
  /** 视口初始状态 */
  viewport?: Partial<ViewportState>
  /** 节点样式覆盖 */
  nodeStyle?: Partial<NodeStyle>
  /** 是否开启 devicePixelRatio 高清渲染（默认 true） */
  hiDPI?: boolean
  /** 是否开启虚拟化渲染（默认 true，视口外的节点不渲染） */
  virtualRendering?: boolean
}
