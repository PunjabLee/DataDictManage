/**
 * @file useModel.ts
 * @description 建模操作 Hooks — 封装常用的模型操作逻辑
 * @layer Desktop CE — Renderer / Hooks
 *
 * 职责：
 *   将 Zustand Store 操作和 API 调用组合成高层级的业务 Hooks，
 *   让页面组件只需调用简洁的 Hook，不需要关心底层实现。
 *
 * @module @ddm/desktop-ce
 */

import { useCallback } from 'react'
import { useModelStore } from '../store/model.store'
import type { ModelDetailDTO } from '@ddm/core-engine'

/**
 * 模型加载 Hook
 * 提供加载/卸载当前模型的能力
 */
export function useModelLoader() {
  const { loadModel, clearModel, setLoading, setError } = useModelStore()

  /**
   * 从 API 加载模型详情
   * @param modelId 模型 ID
   */
  const fetchAndLoadModel = useCallback(async (modelId: string) => {
    setLoading(true)
    setError(null)
    try {
      // CE 版本：从本地文件或内存读取
      // EE 版本：调用 HTTP API
      const data = await fetchModelFromLocalOrAPI(modelId)
      loadModel(data)
    } catch (err) {
      setError(`加载模型失败: ${String(err)}`)
    } finally {
      setLoading(false)
    }
  }, [loadModel, setLoading, setError])

  return { fetchAndLoadModel, clearModel }
}

/**
 * 模型操作 Hook
 * 提供添加表、删除表、添加字段等操作
 */
export function useModelActions() {
  const { currentModel, updateModel, setLoading, setError } = useModelStore()

  /**
   * 添加新数据表
   */
  const addEntity = useCallback(async (name: string, comment?: string) => {
    if (!currentModel) return
    setLoading(true)
    try {
      const updatedModel = await callModelingAPI('addEntity', {
        modelId: currentModel.id,
        name,
        comment,
      })
      updateModel(updatedModel)
    } catch (err) {
      setError(`添加表失败: ${String(err)}`)
    } finally {
      setLoading(false)
    }
  }, [currentModel, updateModel, setLoading, setError])

  /**
   * 删除数据表
   */
  const removeEntity = useCallback(async (entityId: string) => {
    if (!currentModel) return
    setLoading(true)
    try {
      const updatedModel = await callModelingAPI('removeEntity', {
        modelId: currentModel.id,
        entityId,
      })
      updateModel(updatedModel)
    } catch (err) {
      setError(`删除表失败: ${String(err)}`)
    } finally {
      setLoading(false)
    }
  }, [currentModel, updateModel, setLoading, setError])

  /**
   * 生成 DDL SQL
   */
  const generateDDL = useCallback(async (dbType: string, entityIds?: string[]): Promise<string> => {
    if (!currentModel) return ''
    try {
      const result = await callModelingAPI('generateDDL', {
        modelId: currentModel.id,
        dbType,
        entityIds,
      })
      return result.sql
    } catch (err) {
      setError(`生成 DDL 失败: ${String(err)}`)
      return ''
    }
  }, [currentModel, setError])

  return { addEntity, removeEntity, generateDDL }
}

/**
 * 撤销/重做 Hook
 */
export function useUndoRedo() {
  const { undo, redo, canUndo, canRedo } = useModelStore()
  return { undo, redo, canUndo: canUndo(), canRedo: canRedo() }
}

// ── 内部辅助函数（CE 版本使用本地模拟，EE 版本替换为 HTTP 调用） ─────────

/**
 * CE 版本：从本地存储或内存中获取模型数据
 * EE 版本：替换为 fetch('/api/modeling/models/{modelId}')
 */
async function fetchModelFromLocalOrAPI(modelId: string): Promise<ModelDetailDTO> {
  // 尝试从 Electron 主进程读取本地文件
  if (window.electronAPI) {
    // CE 版本：从 userData 目录读取 .ddm 文件
    const result = await window.electronAPI.readFile(`models/${modelId}.ddm`)
    if (result.success && result.content) {
      return JSON.parse(result.content) as ModelDetailDTO
    }
  }

  // Fallback：返回空模型（演示用）
  return createEmptyModel(modelId)
}

/**
 * CE 版本：调用建模 API（本地 in-process 调用 core-engine）
 * EE 版本：替换为 HTTP API 调用
 */
async function callModelingAPI(action: string, params: Record<string, unknown>): Promise<ModelDetailDTO> {
  // TODO: CE 版本直接调用 core-engine 的 ModelingAppService（in-process）
  // EE 版本：return fetch('/api/modeling/' + action, { method: 'POST', body: JSON.stringify(params) }).then(r => r.json())
  console.log(`[API] ${action}`, params)
  throw new Error('CE 版本 API 调用未实现，请对接 core-engine 的 ModelingAppService')
}

/**
 * 创建空模型（演示用）
 */
function createEmptyModel(id: string): ModelDetailDTO {
  return {
    id,
    name: '新建模型',
    description: '',
    projectId: '',
    currentBranchId: '',
    entities: [],
    relations: [],
    branches: [{ id: 'main', name: 'main', isMain: true, createdAt: new Date().toISOString() }],
    createdBy: 'local',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
