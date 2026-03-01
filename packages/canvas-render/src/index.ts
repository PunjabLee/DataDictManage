/**
 * @file index.ts
 * @description @ddm/canvas-render 包入口
 * @module @ddm/canvas-render
 */

export { CanvasEngine } from './engine/canvas-engine'
export { Viewport } from './engine/viewport'
export { NodeRenderer, DEFAULT_NODE_STYLE } from './engine/node-renderer'
export { EdgeRenderer } from './engine/edge-renderer'
export { InteractionManager } from './engine/interaction'

export type {
  Point,
  Rect,
  Padding,
  NodeState,
  RenderField,
  RenderNode,
  EdgeStyle,
  RelationMark,
  RenderEdge,
  RenderGraph,
  ViewportState,
  CanvasEventType,
  CanvasEvent,
  CanvasEventListener,
  NodeStyle,
  CanvasEngineOptions,
} from './types'
