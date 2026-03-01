/**
 * @file main.ts
 * @description Electron 主进程入口
 * @layer Desktop CE — Main Process
 *
 * 职责：
 *   - 创建并管理 BrowserWindow（渲染进程窗口）
 *   - 提供 IPC 通信通道（主进程 <-> 渲染进程）
 *   - 管理应用生命周期（ready/quit/activate 等）
 *   - 在开发模式下加载 Vite Dev Server
 *   - 在生产模式下加载打包后的静态文件
 *
 * @module @ddm/desktop-ce
 */

import { app, BrowserWindow, ipcMain, shell, dialog, Menu, nativeTheme } from 'electron'
import * as path from 'path'
import * as fs from 'fs'

// ── 常量 ──────────────────────────────────────────────────────────────────

const isDev = process.env['NODE_ENV'] === 'development' || !app.isPackaged
const DEV_SERVER_URL = 'http://localhost:5173'

/** 主窗口引用（防止被垃圾回收） */
let mainWindow: BrowserWindow | null = null

// ── 窗口创建 ──────────────────────────────────────────────────────────────

/**
 * 创建主窗口
 */
function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    title: 'DataDictManage',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#F8FAFF',
    webPreferences: {
      // 加载 preload 脚本（提供安全的 IPC 桥接）
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,    // 隔离主进程和渲染进程上下文（安全）
      nodeIntegration: false,    // 渲染进程不直接使用 Node API（安全）
      sandbox: false,            // 允许 preload 脚本访问 Node API
    },
  })

  // 开发模式：加载 Vite Dev Server
  if (isDev) {
    win.loadURL(DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    // 生产模式：加载打包后的 index.html
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // 外部链接在系统默认浏览器中打开
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  return win
}

// ── IPC 处理器注册 ────────────────────────────────────────────────────────

/**
 * 注册所有 IPC 通信处理器
 * 渲染进程通过 preload 暴露的 API 调用这些处理器
 */
function registerIpcHandlers(): void {
  // ── 文件系统操作 ──────────────────────────────────────────────────────

  /**
   * 打开文件选择对话框
   */
  ipcMain.handle('dialog:openFile', async (_event, options: Electron.OpenDialogOptions) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      filters: [
        { name: 'DDM 模型文件', extensions: ['ddm', 'json'] },
        { name: '所有文件', extensions: ['*'] },
      ],
      ...options,
    })
    return result
  })

  /**
   * 打开保存对话框
   */
  ipcMain.handle('dialog:saveFile', async (_event, options: Electron.SaveDialogOptions) => {
    return await dialog.showSaveDialog(mainWindow!, {
      filters: [
        { name: 'DDM 模型文件', extensions: ['ddm'] },
        { name: 'SQL 文件', extensions: ['sql'] },
      ],
      ...options,
    })
  })

  /**
   * 读取文件
   */
  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      return { success: true, content }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  /**
   * 写入文件
   */
  ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
    try {
      fs.writeFileSync(filePath, content, 'utf-8')
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // ── 窗口操作 ──────────────────────────────────────────────────────────

  /**
   * 最小化窗口
   */
  ipcMain.on('window:minimize', () => {
    mainWindow?.minimize()
  })

  /**
   * 最大化/还原窗口
   */
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  /**
   * 关闭窗口
   */
  ipcMain.on('window:close', () => {
    mainWindow?.close()
  })

  // ── 主题切换 ──────────────────────────────────────────────────────────

  ipcMain.handle('theme:toggle', () => {
    nativeTheme.themeSource = nativeTheme.shouldUseDarkColors ? 'light' : 'dark'
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  })

  ipcMain.handle('theme:get', () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  })

  // ── 应用信息 ──────────────────────────────────────────────────────────

  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })
}

// ── 应用生命周期 ──────────────────────────────────────────────────────────

/**
 * 创建应用菜单
 */
function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        { label: '新建模型', accelerator: 'CmdOrCtrl+N', click: () => mainWindow?.webContents.send('menu:newModel') },
        { label: '打开...', accelerator: 'CmdOrCtrl+O', click: () => mainWindow?.webContents.send('menu:openFile') },
        { label: '保存', accelerator: 'CmdOrCtrl+S', click: () => mainWindow?.webContents.send('menu:save') },
        { type: 'separator' },
        { role: 'quit', label: '退出' },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { label: '重置视图', accelerator: 'CmdOrCtrl+0', click: () => mainWindow?.webContents.send('menu:resetView') },
        { label: '适应画布', accelerator: 'CmdOrCtrl+Shift+F', click: () => mainWindow?.webContents.send('menu:fitContent') },
        { type: 'separator' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { role: 'reload', label: '刷新' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        { label: '关于 DDM', click: () => {
          dialog.showMessageBox(mainWindow!, {
            title: '关于 DataDictManage',
            message: 'DataDictManage — 企业级数据字典管理平台',
            detail: `版本: ${app.getVersion()}\n社区版 (CE) | MIT License`,
            type: 'info',
          })
        }},
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// ── 启动 ──────────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  registerIpcHandlers()
  createMenu()
  mainWindow = createMainWindow()

  // macOS：点击 Dock 图标时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow()
    }
  })
})

// 所有窗口关闭时退出（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
