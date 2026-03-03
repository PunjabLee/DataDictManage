/**
 * @file model-persistence.ts
 * @description 模型持久化 — localStorage / Electron IPC
 * @layer Desktop CE — Service Layer
 *
 * @module @ddm/desktop-ce
 */

import type { ModelDetailDTO } from '@ddm/core-engine'

const STORAGE_PREFIX = 'ddm-model-'
const SNAPSHOT_PREFIX = 'ddm-snapshot-'

/**
 * 模型持久化服务
 */
export class ModelPersistence {
  /**
   * 保存模型到 localStorage
   */
  static save(model: ModelDetailDTO): void {
    const key = `${STORAGE_PREFIX}${model.id}`
    localStorage.setItem(key, JSON.stringify(model))
    console.log('[Persistence] 模型已保存:', model.name)
  }

  /**
   * 从 localStorage 加载模型
   */
  static load(modelId: string): ModelDetailDTO | null {
    const key = `${STORAGE_PREFIX}${modelId}`
    const data = localStorage.getItem(key)
    if (!data) return null
    try {
      return JSON.parse(data) as ModelDetailDTO
    } catch {
      console.error('[Persistence] 模型解析失败:', modelId)
      return null
    }
  }

  /**
   * 列出所有本地保存的模型 ID
   */
  static listModels(): string[] {
    const models: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(STORAGE_PREFIX)) {
        models.push(key.replace(STORAGE_PREFIX, ''))
      }
    }
    return models
  }

  /**
   * 删除模型
   */
  static delete(modelId: string): void {
    const key = `${STORAGE_PREFIX}${modelId}`
    localStorage.removeItem(key)
  }

  /**
   * 保存快照
   */
  static saveSnapshot(modelId: string, tag: string, description: string): string {
    const snapshotKey = `${SNAPSHOT_PREFIX}${modelId}`
    const existing = localStorage.getItem(snapshotKey)
    const snapshots = existing ? JSON.parse(existing) : []
    
    const snapshot = {
      id: `snap-${Date.now()}`,
      modelId,
      tag,
      description,
      createdAt: new Date().toISOString(),
    }
    
    snapshots.push(snapshot)
    localStorage.setItem(snapshotKey, JSON.stringify(snapshots))
    return snapshot.id
  }

  /**
   * 获取快照列表
   */
  static listSnapshots(modelId: string): Array<{
    id: string
    modelId: string
    tag: string
    description: string
    createdAt: string
  }> {
    const snapshotKey = `${SNAPSHOT_PREFIX}${modelId}`
    const data = localStorage.getItem(snapshotKey)
    return data ? JSON.parse(data) : []
  }

  /**
   * 删除快照
   */
  static deleteSnapshot(modelId: string, snapshotId: string): void {
    const snapshotKey = `${SNAPSHOT_PREFIX}${modelId}`
    const existing = localStorage.getItem(snapshotKey)
    if (!existing) return
    
    const snapshots = JSON.parse(existing)
    const filtered = snapshots.filter((s: any) => s.id !== snapshotId)
    localStorage.setItem(snapshotKey, JSON.stringify(filtered))
  }

  /**
   * 自动保存（定时任务）
   */
  static autoSave(model: ModelDetailDTO, intervalMs: number = 30000): () => void {
    const timer = setInterval(() => {
      this.save(model)
    }, intervalMs)
    
    // 返回停止函数
    return () => clearInterval(timer)
  }

  /**
   * 导出模型为 JSON 文件
   */
  static async exportToFile(model: ModelDetailDTO): Promise<void> {
    const json = JSON.stringify(model, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `${model.name}.ddm.json`
    a.click()
    
    URL.revokeObjectURL(url)
  }

  /**
   * 从文件导入模型
   */
  static async importFromFile(file: File): Promise<ModelDetailDTO> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const model = JSON.parse(e.target?.result as string) as ModelDetailDTO
          resolve(model)
        } catch (err) {
          reject(new Error('无效的模型文件'))
        }
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsText(file)
    })
  }
}

export default ModelPersistence
