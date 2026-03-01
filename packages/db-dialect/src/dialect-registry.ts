/**
 * @file dialect-registry.ts
 * @description 数据库方言注册中心
 * @layer db-dialect Package — Registry
 *
 * 职责：
 *   作为所有数据库方言的统一注册和查询入口。
 *   内置了 7 种数据库方言（MySQL/PG/Oracle/达梦/金仓/SQLServer/ClickHouse），
 *   同时支持用户自定义方言的注册扩展。
 *
 * @pattern GoF: Singleton（DialectRegistry.getInstance）
 *           Strategy（不同方言是不同的策略实现）
 *           Registry（统一注册和查找）
 *
 * @module @ddm/db-dialect
 */

import type { IDbDialect } from './index'

/**
 * 方言注册中心（单例）
 *
 * @example
 * ```ts
 * const registry = DialectRegistry.getInstance()
 * const mysql = registry.get('MYSQL')
 * const ddl = mysql.generateCreateTable({ name: 'users', comment: '用户表', fields: [...] })
 * ```
 */
export class DialectRegistry {
  /** 单例实例 */
  private static _instance: DialectRegistry | null = null
  /** 方言存储（key: dbType 大写） */
  private readonly _dialects: Map<string, IDbDialect> = new Map()

  private constructor() {}

  /**
   * 获取注册中心单例
   * @pattern GoF: Singleton
   */
  static getInstance(): DialectRegistry {
    if (!DialectRegistry._instance) {
      DialectRegistry._instance = new DialectRegistry()
    }
    return DialectRegistry._instance
  }

  /**
   * 注册一个数据库方言
   * 如果 dbType 已存在则覆盖（支持用户自定义方言替换内置方言）
   *
   * @param dialect 方言实现
   */
  register(dialect: IDbDialect): void {
    this._dialects.set(dialect.dbType.toUpperCase(), dialect)
  }

  /**
   * 批量注册方言
   */
  registerAll(dialects: IDbDialect[]): void {
    dialects.forEach(d => this.register(d))
  }

  /**
   * 获取指定方言
   * @throws 如果方言未注册
   */
  get(dbType: string): IDbDialect {
    const dialect = this._dialects.get(dbType.toUpperCase())
    if (!dialect) {
      const available = this.listRegistered().join(', ')
      throw new Error(`数据库方言 "${dbType}" 未注册。已注册方言: ${available}`)
    }
    return dialect
  }

  /**
   * 安全获取方言（不抛异常）
   */
  tryGet(dbType: string): IDbDialect | null {
    return this._dialects.get(dbType.toUpperCase()) ?? null
  }

  /**
   * 是否已注册
   */
  has(dbType: string): boolean {
    return this._dialects.has(dbType.toUpperCase())
  }

  /**
   * 获取所有已注册的方言类型列表
   */
  listRegistered(): string[] {
    return Array.from(this._dialects.keys())
  }

  /**
   * 获取所有已注册方言的元信息（用于 UI 展示）
   */
  listDialectInfo(): Array<{ dbType: string; displayName: string; category: string }> {
    return Array.from(this._dialects.values()).map(d => ({
      dbType: d.dbType,
      displayName: d.displayName,
      category: d.category,
    }))
  }
}
