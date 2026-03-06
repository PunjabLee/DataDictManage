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
import { getModelingService, ModelingService } from '../service/modeling-service'
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
 * CE 版本：从本地服务获取模型数据
 */
async function fetchModelFromLocalOrAPI(modelId: string): Promise<ModelDetailDTO> {
  const service = getModelingService()
  
  // 尝试从 Electron 主进程读取本地文件
  if (window.electronAPI) {
    const result = await window.electronAPI.readFile(`models/${modelId}.ddm`)
    if (result.success && result.content) {
      return JSON.parse(result.content) as ModelDetailDTO
    }
  }

  // 从建模服务获取
  try {
    return await service.getModelDetail(modelId)
  } catch {
    // 返回空模型（演示用）
    return createEmptyModel(modelId)
  }
}

/**
 * CE 版本：调用建模 API（通过 ModelingService in-process 调用）
 */
async function callModelingAPI(action: string, params: Record<string, unknown>): Promise<ModelDetailDTO> {
  const service = getModelingService()
  
  switch (action) {
    case 'addEntity': {
      const { modelId, name, comment } = params
      return await service.addEntity({ modelId: modelId as string, name: name as string, comment: comment as string })
    }
    case 'removeEntity': {
      const { modelId, entityId } = params
      await service.removeEntity(modelId as string, entityId as string)
      return await service.getModelDetail(modelId as string)
    }
    case 'addField': {
      const { modelId, entityId, name, baseType, length, nullable, primaryKey, comment } = params
      return await service.addField({
        modelId: modelId as string,
        entityId: entityId as string,
        name: name as string,
        baseType: baseType as string,
        length: length as number | undefined,
        nullable: nullable as boolean,
        primaryKey: primaryKey as boolean,
        comment: comment as string,
      })
    }
    case 'modifyField': {
      const { modelId, entityId, fieldId, name, comment, baseType, length } = params
      return await service.modifyField({
        modelId: modelId as string,
        entityId: entityId as string,
        fieldId: fieldId as string,
        name: name as string,
        comment: comment as string,
        baseType: baseType as string,
        length: length as number | undefined,
      })
    }
    case 'removeField': {
      const { modelId, entityId, fieldId } = params
      await service.removeField(modelId as string, entityId as string, fieldId as string)
      return await service.getModelDetail(modelId as string)
    }
    case 'generateDDL': {
      const { modelId, dbType } = params
      const result = await service.generateDDL(modelId as string, dbType as string)
      console.log('[DDL Result]', result.sql)
      return await service.getModelDetail(modelId as string)
    }
    default:
      throw new Error(`Unknown action: ${action}`)
  }
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
