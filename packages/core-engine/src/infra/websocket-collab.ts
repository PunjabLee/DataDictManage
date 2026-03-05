/**
 * @file websocket-collab.ts
 * @description WebSocket 协同编辑服务
 * @layer core-engine — Collaboration
 *
 * 基于 OT (Operational Transformation) 算法的多人协同编辑
 *
 * @module @ddm/core-engine
 */

// ── 操作类型 ─────────────────────────────────────────────────

export type OperationType = 
  | 'insert'    // 插入
  | 'delete'    // 删除
  | 'retain'    // 保留（用于位置同步）

export interface Operation {
  type: OperationType
  position: number
  content?: string  // insert 时使用
  length?: number   // delete/retain 时使用
  userId: string
  timestamp: number
  version: number
}

// ── 消息类型 ─────────────────────────────────────────────────

export type MessageType = 
  | 'join'       // 用户加入
  | 'leave'      // 用户离开
  | 'operation'  // 操作同步
  | 'ack'        // 操作确认
  | 'sync'       // 同步请求
  | 'cursor'     // 光标位置

export interface WSMessage {
  type: MessageType
  roomId: string
  userId: string
  payload: any
  timestamp: number
}

// ── 协同房间 ─────────────────────────────────────────────────

export interface CollabRoom {
  roomId: string
  modelId: string
  users: CollabUser[]
  version: number
  content: string
}

export interface CollabUser {
  userId: string
  username: string
  color: string
  cursorPosition?: number
  lastActive: number
}

// ── 事件定义 ─────────────────────────────────────────────────

export type CollabEventType = 
  | 'user-join'
  | 'user-leave'
  | 'operation-received'
  | 'sync-complete'
  | 'cursor-update'
  | 'error'

export interface CollabEvent {
  type: CollabEventType
  data: any
}

// ── OT 算法核心 ─────────────────────────────────────────────────

export class OTEngine {
  private version: number = 0

  /**
   * 转换操作（核心 OT 算法）
   */
  static transform(op1: Operation, op2: Operation): [Operation, Operation] {
    // 简单的转换算法
    const transformed1 = { ...op1 }
    const transformed2 = { ...op2 }

    if (op1.type === 'insert' && op2.type === 'insert') {
      // 两个插入操作
      if (op1.position <= op2.position) {
        transformed2.position += op1.content?.length || 0
      } else {
        transformed1.position += op2.content?.length || 0
      }
    } else if (op1.type === 'insert' && op2.type === 'delete') {
      // op1 插入，op2 删除
      if (op1.position <= op2.position) {
        transformed2.position += op1.content?.length || 0
      } else if (op1.position >= op2.position + (op2.length || 0)) {
        transformed1.position -= op2.length || 0
      }
    } else if (op1.type === 'delete' && op2.type === 'insert') {
      // op1 删除，op2 插入
      if (op2.position <= op1.position) {
        transformed1.position += op2.content?.length || 0
      } else if (op2.position >= op1.position + (op1.length || 0)) {
        transformed2.position -= op1.length || 0
      }
    } else if (op1.type === 'delete' && op2.type === 'delete') {
      // 两个删除操作
      if (op1.position >= op2.position + (op2.length || 0)) {
        transformed1.position -= op2.length || 0
      } else if (op2.position >= op1.position + (op1.length || 0)) {
        transformed2.position -= op1.length || 0
      }
    }

    return [transformed1, transformed2]
  }

  /**
   * 应用操作到文档
   */
  apply(content: string, op: Operation): string {
    switch (op.type) {
      case 'insert':
        return (
          content.slice(0, op.position) +
          (op.content || '') +
          content.slice(op.position)
        )
      case 'delete':
        return (
          content.slice(0, op.position) +
          content.slice(op.position + (op.length || 0))
        )
      case 'retain':
        return content
      default:
        return content
    }
  }
}

// ── WebSocket 协同服务 ─────────────────────────────────────────────────

export class WebSocketCollabService {
  private ws: WebSocket | null = null
  private roomId: string | null = null
  private userId: string
  private userName: string
  private pendingOps: Operation[] = []
  private version: number = 0
  private eventListeners: Map<CollabEventType, Set<(event: CollabEvent) => void>> = new Map()
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5

  constructor(userId: string, userName: string) {
    this.userId = userId
    this.userName = userName
  }

  /**
   * 连接到协同房间
   */
  async connect(serverUrl: string, roomId: string): Promise<void> {
    this.roomId = roomId

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(serverUrl)

        this.ws.onopen = () => {
          console.log('[Collab] WebSocket 连接成功')
          this.reconnectAttempts = 0
          
          // 发送加入房间消息
          this.send({
            type: 'join',
            roomId,
            userId: this.userId,
            payload: { username: this.userName },
            timestamp: Date.now()
          })

          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data))
        }

        this.ws.onerror = (error) => {
          console.error('[Collab] WebSocket 错误:', error)
          this.emit('error', { error })
        }

        this.ws.onclose = () => {
          console.log('[Collab] WebSocket 连接关闭')
          this.handleDisconnect()
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.ws) {
      this.send({
        type: 'leave',
        roomId: this.roomId!,
        userId: this.userId,
        payload: {},
        timestamp: Date.now()
      })
      this.ws.close()
      this.ws = null
    }
  }

  /**
   * 发送操作
   */
  sendOperation(operation: Operation): void {
    const op: Operation = {
      ...operation,
      userId: this.userId,
      timestamp: Date.now(),
      version: this.version
    }

    this.pendingOps.push(op)

    this.send({
      type: 'operation',
      roomId: this.roomId!,
      userId: this.userId,
      payload: op,
      timestamp: Date.now()
    })
  }

  /**
   * 发送光标位置
   */
  sendCursor(position: number): void {
    this.send({
      type: 'cursor',
      roomId: this.roomId!,
      userId: this.userId,
      payload: { position },
      timestamp: Date.now()
    })
  }

  /**
   * 订阅事件
   */
  on(eventType: CollabEventType, listener: (event: CollabEvent) => void): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set())
    }
    this.eventListeners.get(eventType)!.add(listener)

    // 返回取消订阅函数
    return () => {
      this.eventListeners.get(eventType)?.delete(listener)
    }
  }

  // ── 私有方法 ─────────────────────────────────────────────

  private send(message: WSMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  private handleMessage(message: WSMessage): void {
    switch (message.type) {
      case 'join':
        this.emit('user-join', { userId: message.userId, username: message.payload.username })
        break

      case 'leave':
        this.emit('user-leave', { userId: message.userId })
        break

      case 'operation':
        this.handleRemoteOperation(message.payload as Operation)
        break

      case 'ack':
        this.handleAck(message.payload as Operation)
        break

      case 'cursor':
        this.emit('cursor-update', { 
          userId: message.userId, 
          position: message.payload.position 
        })
        break

      case 'sync':
        this.version = message.payload.version
        this.emit('sync-complete', { version: this.version })
        break
    }
  }

  private handleRemoteOperation(operation: Operation): void {
    // 使用 OT 引擎转换操作
    // ... 省略详细实现
    
    this.version++
    this.emit('operation-received', { operation, version: this.version })
  }

  private handleAck(operation: Operation): void {
    // 移除已确认的操作
    this.pendingOps = this.pendingOps.filter(
      op => op.timestamp !== operation.timestamp
    )
    this.version++
  }

  private handleDisconnect(): void {
    // 自动重连
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.roomId) {
      this.reconnectAttempts++
      console.log(`[Collab] 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        // 重新连接逻辑
      }, 1000 * this.reconnectAttempts)
    }
  }

  private emit(type: CollabEventType, data: any): void {
    const listeners = this.eventListeners.get(type)
    if (listeners) {
      for (const listener of listeners) {
        listener({ type, data })
      }
    }
  }
}

// ── 默认导出 ─────────────────────────────────────────────────

export default WebSocketCollabService
