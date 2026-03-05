/**
 * @file web-ee.ts
 * @description EE Web 版前端架构
 * @layer web-ee Package
 *
 * 微前端架构：qiankun + React/Vue
 *
 * @module @ddm/web-ee
 */

// ── 微前端配置 ─────────────────────────────────────────────────

export const QIANKUN_CONFIG = {
  // 子应用配置
  apps: [
    {
      name: 'designermain',
      entry: '//localhost:3001',
      container: '#micro-app-container',
      activeRule: '/designer',
    },
    {
      name: 'admin',
      entry: '//localhost:3002',
      container: '#micro-app-container',
      activeRule: '/admin',
    },
  ],
  // 主应用配置
  main: {
    name: 'ddm-web-ee',
    base: '/',
  },
}

// ── 主应用入口 ─────────────────────────────────────────────────

/**
 * 主应用入口文件
 * 负责加载子应用、路由管理、状态共享
 */
export class MainApp {
  private apps: Map<string, MicroApp> = new Map()

  /**
   * 注册子应用
   */
  registerApp(config: MicroAppConfig): void {
    const app = new MicroApp(config)
    this.apps.set(config.name, app)
  }

  /**
   * 启动主应用
   */
  async start(): Promise<void> {
    console.log('[MainApp] 启动微前端主应用')
    
    // 注册子应用
    for (const config of QIANKUN_CONFIG.apps) {
      this.registerApp(config)
    }

    // 监听路由变化
    this.setupRouter()
  }

  /**
   * 设置路由
   */
  private setupRouter(): void {
    // 路由变化时加载对应的子应用
    window.addEventListener('hashchange', () => {
      this.handleRouteChange()
    })
    this.handleRouteChange()
  }

  /**
   * 处理路由变化
   */
  private handleRouteChange(): void {
    const hash = window.location.hash.slice(1) || '/'
    
    for (const [name, app] of this.apps) {
      if (app.match(hash)) {
        app.mount()
      } else {
        app.unmount()
      }
    }
  }
}

// ── 子应用类 ─────────────────────────────────────────────────

export interface MicroAppConfig {
  name: string
  entry: string
  container: string
  activeRule: string
}

export class MicroApp {
  private config: MicroAppConfig
  private mounted = false
  private instance: any = null

  constructor(config: MicroAppConfig) {
    this.config = config
  }

  /**
   * 检查是否匹配路由
   */
  match(path: string): boolean {
    return path.startsWith(this.config.activeRule)
  }

  /**
   * 挂载子应用
   */
  async mount(): Promise<void> {
    if (this.mounted) return

    console.log(`[MicroApp] 挂载子应用: ${this.config.name}`)
    
    // 动态加载子应用脚本
    const script = document.createElement('script')
    script.src = `${this.config.entry}/index.js`
    
    script.onload = () => {
      // 获取子应用导出的生命周期
      const app = (window as any)[this.config.name]
      if (app && app.mount) {
        const container = document.querySelector(this.config.container)
        if (container) {
          app.mount({ container })
          this.mounted = true
        }
      }
    }

    document.head.appendChild(script)
  }

  /**
   * 卸载子应用
   */
  async unmount(): Promise<void> {
    if (!this.mounted) return

    console.log(`[MicroApp] 卸载子应用: ${this.config.name}`)
    
    const app = (window as any)[this.config.name]
    if (app && app.unmount) {
      app.unmount()
    }
    
    this.mounted = false
  }
}

// ── 子应用生命周期 ─────────────────────────────────────────────────

/**
 * 子应用导出此对象供主应用调用
 */
export interface MicroAppLifeCycle {
  mount: (props: MountProps) => Promise<void>
  unmount: () => Promise<void>
  update?: (props: any) => Promise<void>
}

export interface MountProps {
  container: HTMLElement
  shared?: Record<string, any>
}

/**
 * 创建子应用入口
 */
export function createMicroApp(
  app: (props: MountProps) => JSX.Element
): MicroAppLifeCycle {
  let currentContainer: HTMLElement | null = null

  return {
    async mount(props: MountProps): Promise<void> {
      currentContainer = props.container
      console.log('[SubApp] 挂载')
      // React/Vue 渲染逻辑
    },

    async unmount(): Promise<void> {
      console.log('[SubApp] 卸载')
      currentContainer = null
    },
  }
}

// ── 状态共享 ─────────────────────────────────────────────────

/**
 * 全局状态共享
 */
export class SharedState {
  private state: Record<string, any> = {}
  private listeners: Set<(state: Record<string, any>) => void> = new Set()

  /**
   * 获取状态
   */
  get<T>(key: string): T | undefined {
    return this.state[key] as T
  }

  /**
   * 设置状态
   */
  set<T>(key: string, value: T): void {
    this.state[key] = value
    this.notify()
  }

  /**
   * 订阅状态变化
   */
  subscribe(listener: (state: Record<string, any>) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * 通知所有订阅者
   */
  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state)
    }
  }
}

// 全局单例
export const sharedState = new SharedState()

export default { QIKANKUN_CONFIG, MainApp, sharedState }
