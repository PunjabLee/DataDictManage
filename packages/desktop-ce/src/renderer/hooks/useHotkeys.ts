/**
 * @file useHotkeys.ts
 * @description 键盘快捷键 Hook
 * @layer Desktop CE — Renderer / Hooks
 *
 * 支持的快捷键：
 * - Ctrl+Z: 撤销
 * - Ctrl+Y / Ctrl+Shift+Z: 重做
 * - Delete / Backspace: 删除选中
 * - Ctrl+S: 保存
 * - Ctrl+A: 全选
 * - Escape: 取消选中
 * - +/-: 缩放
 *
 * @module @ddm/desktop-ce
 */

import { useEffect, useCallback } from 'react'
import { useUndoRedo, useModelActions } from './useModel'
import { useModelStore } from '../store/model.store'

/**
 * 键盘快捷键 Hook
 */
export function useHotkeys() {
  const { undo, redo, canUndo, canRedo } = useUndoRedo()
  const { removeEntity } = useModelActions()
  const { currentModel, selectedEntityIds, clearSelection } = useModelStore()

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isCtrl = e.ctrlKey || e.metaKey
    const isShift = e.shiftKey

    // 忽略在输入框中的快捷键
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    // Ctrl+Z: 撤销
    if (isCtrl && e.key === 'z' && !isShift) {
      e.preventDefault()
      if (canUndo) {
        undo()
      }
      return
    }

    // Ctrl+Y 或 Ctrl+Shift+Z: 重做
    if ((isCtrl && e.key === 'y') || (isCtrl && e.key === 'z' && isShift)) {
      e.preventDefault()
      if (canRedo) {
        redo()
      }
      return
    }

    // Delete / Backspace: 删除选中
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEntityIds.size > 0) {
      e.preventDefault()
      const entityIds = Array.from(selectedEntityIds)
      entityIds.forEach(async (entityId) => {
        if (currentModel && confirm(`确定删除选中的表吗？`)) {
          await removeEntity(entityId)
        }
      })
      clearSelection()
      return
    }

    // Ctrl+S: 保存
    if (isCtrl && e.key === 's') {
      e.preventDefault()
      handleSave()
      return
    }

    // Escape: 取消选中
    if (e.key === 'Escape') {
      e.preventDefault()
      clearSelection()
      return
    }

    // +/-: 缩放 (通过自定义事件)
    if (e.key === '+' || e.key === '=') {
      window.dispatchEvent(new CustomEvent('ddm:zoom-in'))
      return
    }
    if (e.key === '-') {
      window.dispatchEvent(new CustomEvent('ddm:zoom-out'))
      return
    }
  }, [canUndo, canRedo, undo, redo, selectedEntityIds, currentModel, removeEntity, clearSelection])

  // 注册快捷键
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

/**
 * 保存处理函数
 */
function handleSave() {
  // 保存到 localStorage
  const { useModelStore } = require('../store/model.store')
  const state = useModelStore.getState()
  
  if (state.currentModel) {
    const key = `ddm-model-${state.currentModel.id}`
    localStorage.setItem(key, JSON.stringify(state.currentModel))
    console.log('[DDM] 模型已保存:', state.currentModel.name)
    
    // 显示保存提示
    showSaveToast()
  }
}

/**
 * 显示保存提示
 */
function showSaveToast() {
  // 创建提示元素
  const toast = document.createElement('div')
  toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm z-50 animate-fade-in'
  toast.textContent = '✓ 已保存'
  document.body.appendChild(toast)
  
  // 2秒后移除
  setTimeout(() => {
    toast.remove()
  }, 2000)
}

export default useHotkeys
