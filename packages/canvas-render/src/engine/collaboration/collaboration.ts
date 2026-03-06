/**
 * @file collaboration.ts
 * @description 实时协作引擎 - 基于 Yjs CRDT
 * @layer canvas-render/engine
 *
 * 职责：
 *   - 多用户实时协同编辑
 *   - 冲突解决（CRDT 算法）
 *   - 光标/选区同步
 *   - 离线支持与自动同步
 *
 * @pattern GoF: Observer（状态变化通知）
 *
 * @module @ddm/canvas-render
 */

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { BehaviorSubject, Observable } from 'rxjs'

// ── 协作数据类型 ─────────────────────────────────────────────────────────────

/**
 * 协作节点数据
 */
export interface CollabNode {
  id: string
  x: number
  y: number
  width: number
  height: number
  data: Record<string, any>
}

/**
 * 协作边数据
 */
export interface CollabEdge {
  id: string
  sourceId: string
  targetId: string
  type: string
  data: Record<string, any>
}

/**
 * 协作用户光标
 */
export interface CollabCursor {
  userId: string
  userName: string
  color: string
  x: number
  y: number
  selection?: string[] // 选中的节点 IDs
}

/**
 * 协作状态
 */
export interface CollabState {
  connected: boolean
  users: CollabCursor[]
  syncStatus: 'synced' | 'syncing' | 'error'
}

// ── 协作引擎 ─────────────────────────────────────────────────────────────

/**
 * CollaborationEngine — 实时协作引擎
 * 基于 Yjs CRDT 实现多人协同编辑
 */
export class CollaborationEngine {
  private doc: Y.Doc
  private provider: WebsocketProvider | null = null
  private nodesMap: Y.Map<any>
  private edgesMap: Y.Map<any>
  private awareness: any

  // 状态流
  private state$ = new BehaviorSubject<CollabState>({
    connected: false,
    users: [],
    syncStatus: 'synced',
  })

  // 事件流
  private nodesChange$ = new BehaviorSubject<CollabNode[]>([])
  private edgesChange$ = new BehaviorSubject<CollabEdge[]>([])
  private cursorChange$ = new BehaviorSubject<CollabCursor[]>([])

  constructor() {
    this.doc = new Y.Doc()
    this.nodesMap = this.doc.getMap('nodes')
    this.edgesMap = this.doc.getMap('edges')
    this.setupObservers()
  }

  // ── 生命周期 ─────────────────────────────────────────────────────────────

  /**
   * 连接到协作服务器
   */
  connect(serverUrl: string, roomId: string, userId: string, userName: string): void {
    // 创建 WebSocket provider
    this.provider = new WebsocketProvider(serverUrl, roomId, this.doc)

    // 设置 Awareness（光标/状态同步）
    this.awareness = this.provider.awareness
    this.awareness.setLocalState({
      user: { id: userId, name: userName },
      color: this.generateUserColor(userId),
      cursor: { x: 0, y: 0 },
    })

    // 监听连接状态
    this.provider.on('status', (event: { status: string }) => {
      this.updateState({ connected: event.status === 'connected' })
    })

    // 监听同步状态
    this.provider.on('sync', (isSynced: boolean) => {
      this.updateState({ syncStatus: isSynced ? 'synced' : 'syncing' })
    })

    // 监听 Awareness 变化（其他用户光标）
    this.awareness.on('change', () => {
      this.handleAwarenessChange()
    })

    console.log(`[Collab] 已连接到房间: ${roomId}`)
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.provider) {
      this.provider.disconnect()
      this.provider.destroy()
      this.provider = null
    }
    this.updateState({ connected: false, users: [] })
    console.log('[Collab] 已断开连接')
  }

  /**
   * 销毁引擎
   */
  destroy(): void {
    this.disconnect()
    this.doc.destroy()
    this.state$.complete()
    this.nodesChange$.complete()
    this.edgesChange$.complete()
    this.cursorChange$.complete()
  }

  // ── 节点操作 ─────────────────────────────────────────────────────────────

  /**
   * 添加或更新节点
   */
  upsertNode(node: CollabNode): void {
    this.doc.transact(() => {
      this.nodesMap.set(node.id, node)
    })
  }

  /**
   * 删除节点
   */
  deleteNode(nodeId: string): void {
    this.doc.transact(() => {
      this.nodesMap.delete(nodeId)
      // 同时删除关联的边
      const edges = this.getEdges()
      edges.forEach(edge => {
        if (edge.sourceId === nodeId || edge.targetId === nodeId) {
          this.edgesMap.delete(edge.id)
        }
      })
    })
  }

  /**
   * 获取所有节点
   */
  getNodes(): CollabNode[] {
    return Array.from(this.nodesMap.values()) as CollabNode[]
  }

  // ── 边操作 ─────────────────────────────────────────────────────────────

  /**
   * 添加或更新边
   */
  upsertEdge(edge: CollabEdge): void {
    this.doc.transact(() => {
      this.edgesMap.set(edge.id, edge)
    })
  }

  /**
   * 删除边
   */
  deleteEdge(edgeId: string): void {
    this.doc.transact(() => {
      this.edgesMap.delete(edgeId)
    })
  }

  /**
   * 获取所有边
   */
  getEdges(): CollabEdge[] {
    return Array.from(this.edgesMap.values()) as CollabEdge[]
  }

  // ── 光标操作 ─────────────────────────────────────────────────────────────

  /**
   * 更新本地光标位置
   */
  updateCursor(x: number, y: number, selection?: string[]): void {
    if (this.awareness) {
      this.awareness.setLocalStateField('cursor', { x, y, selection })
    }
  }

  // ── 状态流 ─────────────────────────────────────────────────────────────

  /**
   * 获取协作状态 Observable
   */
  getState(): Observable<CollabState> {
    return this.state$.asObservable()
  }

  /**
   * 获取当前状态
   */
  getCurrentState(): CollabState {
    return this.state$.value
  }

  /**
   * 获取节点变化 Observable
   */
  onNodesChange(): Observable<CollabNode[]> {
    return this.nodesChange$.asObservable()
  }

  /**
   * 获取边变化 Observable
   */
  onEdgesChange(): Observable<CollabEdge[]> {
    return this.edgesChange$.asObservable()
  }

  /**
   * 获取光标变化 Observable
   */
  onCursorsChange(): Observable<CollabCursor[]> {
    return this.cursorChange$.asObservable()
  }

  // ── 私有方法 ─────────────────────────────────────────────────────────────

  private setupObservers(): void {
    // 监听节点变化
    this.nodesMap.observe(() => {
      const nodes = this.getNodes()
      this.nodesChange$.next(nodes)
    })

    // 监听边变化
    this.edgesMap.observe(() => {
      const edges = this.getEdges()
      this.edgesChange$.next(edges)
    })
  }

  private handleAwarenessChange(): void {
    if (!this.awareness) return

    const states = this.awareness.getStates()
    const cursors: CollabCursor[] = []

    states.forEach((state: any, clientId: number) => {
      if (clientId !== this.doc.clientID && state.user && state.cursor) {
        cursors.push({
          userId: state.user.id,
          userName: state.user.name,
          color: state.color,
          x: state.cursor.x,
          y: state.cursor.y,
          selection: state.cursor.selection,
        })
      }
    })

    this.cursorChange$.next(cursors)
    this.updateState({ users: cursors })
  }

  private updateState(partial: Partial<CollabState>): void {
    this.state$.next({ ...this.state$.value, ...partial })
  }

  private generateUserColor(userId: string): string {
    // 生成固定的用户颜色
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    ]
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }
}

// ── 单例导出 ─────────────────────────────────────────────────────────────

let instance: CollaborationEngine | null = null

/**
 * 获取协作引擎实例（单例）
 */
export function getCollabEngine(): CollaborationEngine {
  if (!instance) {
    instance = new CollaborationEngine()
  }
  return instance
}

/**
 * 创建新的协作引擎实例
 */
export function createCollabEngine(): CollaborationEngine {
  return new CollaborationEngine()
}

export default CollaborationEngine
