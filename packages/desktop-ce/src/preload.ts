/**
 * @file preload.ts
 * @description Electron Preload 脚本 — 主进程/渲染进程安全桥接（IPC Bridge）
 * @layer Desktop CE — Preload (Bridge)
 *
 * 职责：
 *   在渲染进程的 window 对象上暴露受控的 API（electronAPI），
 *   让渲染进程可以安全地调用主进程功能（文件操作、窗口控制、主题等），
 *   而无需在渲染进程中直接使用 Node.js API（安全边界）。
 *
 * 安全模型：
 *   - contextIsolation: true — 渲染进程不能访问 preload 的 Node.js 上下文
 *   - nodeIntegration: false — 渲染进程不能直接使用 Node.js API
 *   - 只通过 contextBridge.exposeInMainWorld 暴露白名单 API
 *
 * @pattern GoF: Facade（将多个 ipcRenderer.invoke/send 调用封装为语义化 API）
 *           Bridge（桥接主进程与渲染进程的不同上下文）
 *
 * @module @ddm/desktop-ce
 */

import { contextBridge, ipcRenderer } from 'electron'

// ── ElectronAPI 类型声明（与渲染进程共享） ────────────────────────────────

/**
 * 暴露给渲染进程的 API 类型
 * 在 renderer 侧通过 `window.electronAPI.xxx()` 调用
 */
export interface ElectronAPI {
  // 文件操作
  openFileDialog: (options?: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>
  saveFileDialog: (options?: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>

  // 窗口控制
  minimize: () => void
  maximize: () => void
  close: () => void

  // 主题
  toggleTheme: () => Promise<'light' | 'dark'>
  getTheme: () => Promise<'light' | 'dark'>

  // 应用信息
  getVersion: () => Promise<string>

  // 菜单事件订阅（渲染进程监听主进程菜单点击）
  onMenuEvent: (event: string, callback: () => void) => () => void
}

// ── contextBridge 暴露 ────────────────────────────────────────────────────

/**
 * 将 electronAPI 注入到 window 对象
 * 渲染进程通过 window.electronAPI 访问
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // ── 文件操作 ────────────────────────────────────────────────────────

  openFileDialog: (options?: Electron.OpenDialogOptions) =>
    ipcRenderer.invoke('dialog:openFile', options),

  saveFileDialog: (options?: Electron.SaveDialogOptions) =>
    ipcRenderer.invoke('dialog:saveFile', options),

  readFile: (filePath: string) =>
    ipcRenderer.invoke('fs:readFile', filePath),

  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('fs:writeFile', filePath, content),

  // ── 窗口控制 ────────────────────────────────────────────────────────

  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // ── 主题 ────────────────────────────────────────────────────────────

  toggleTheme: () => ipcRenderer.invoke('theme:toggle'),
  getTheme: () => ipcRenderer.invoke('theme:get'),

  // ── 应用信息 ────────────────────────────────────────────────────────

  getVersion: () => ipcRenderer.invoke('app:getVersion'),

  // ── 菜单事件 ────────────────────────────────────────────────────────

  /**
   * 订阅主进程菜单事件
   * @param event 菜单事件名（如 'menu:newModel'）
   * @param callback 事件触发时的回调
   * @returns 取消订阅的函数
   */
  onMenuEvent: (event: string, callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on(event, handler)
    // 返回清理函数（React useEffect cleanup）
    return () => ipcRenderer.removeListener(event, handler)
  },
} as ElectronAPI)

// ── 全局类型扩展（让 TS 知道 window.electronAPI 的类型） ─────────────────
// 注意：此声明在 renderer/global.d.ts 中也需要有，此处仅作 preload 侧声明
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
