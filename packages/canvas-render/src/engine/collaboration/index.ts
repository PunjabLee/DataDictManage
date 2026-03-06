/**
 * @file index.ts
 * @description 协作模块导出
 */

export {
  CollaborationEngine,
  getCollabEngine,
  createCollabEngine,
} from './collaboration'

export type {
  CollabNode,
  CollabEdge,
  CollabCursor,
  CollabState,
} from './collaboration'
