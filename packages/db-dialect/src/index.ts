/**
 * @file index.ts
 * @description @ddm/db-dialect 包入口 — 定义核心接口并导出所有方言实现
 * @layer db-dialect Package — Public API
 *
 * 该包是纯 TypeScript 库，不依赖任何运行时框架。
 * 设计为"即插即用"：可在浏览器（Canvas 引擎预览）和 Node.js（服务端生成）两端使用。
 *
 * @module @ddm/db-dialect
 */

// ── 核心类型定义 ─────────────────────────────────────────────────────────

/**
 * 字段快照（从建模层传入，不依赖 core-engine 领域对象）
 * 保持 db-dialect 包独立，不产生循环依赖
 */
export interface DialectFieldSnapshot {
  name: string
  /** 抽象基础类型（与 FieldBaseType 对应但用字符串避免依赖） */
  baseType: string
  length?: number
  precision?: number
  scale?: number
  nullable: boolean
  primaryKey: boolean
  unique: boolean
  autoIncrement: boolean
  defaultValue?: string
  comment: string
}

/**
 * 实体快照（数据表）
 */
export interface DialectEntitySnapshot {
  name: string
  comment: string
  schema?: string   // Schema/Database 名称（Oracle/PG 用）
  fields: DialectFieldSnapshot[]
}

/**
 * DDL 生成结果
 */
export interface DDLResult {
  /** 生成的 SQL 语句 */
  sql: string
  /** 附加注释说明 */
  notes?: string[]
}

/**
 * 数据库方言接口（核心 Strategy 接口）
 * @pattern GoF: Strategy — 所有方言实现此接口
 */
export interface IDbDialect {
  /** 方言唯一标识（大写，如 "MYSQL"） */
  readonly dbType: string
  /** 显示名称 */
  readonly displayName: string
  /** 分类（OPEN_SOURCE / COMMERCIAL / XINCHUANG / ANALYTICS） */
  readonly category: 'OPEN_SOURCE' | 'COMMERCIAL' | 'XINCHUANG' | 'ANALYTICS'
  /** 版本描述 */
  readonly version: string

  /** 将抽象类型映射为该数据库的原生类型字符串 */
  mapType(field: Pick<DialectFieldSnapshot, 'baseType' | 'length' | 'precision' | 'scale'>): string

  /** 生成建表 DDL */
  generateCreateTable(entity: DialectEntitySnapshot): DDLResult

  /** 生成新增列 DDL */
  generateAddColumn(tableName: string, field: DialectFieldSnapshot): DDLResult

  /** 生成修改列 DDL */
  generateModifyColumn(tableName: string, oldField: DialectFieldSnapshot, newField: DialectFieldSnapshot): DDLResult

  /** 生成删除列 DDL */
  generateDropColumn(tableName: string, fieldName: string): DDLResult

  /** 生成创建索引 DDL */
  generateCreateIndex(tableName: string, fields: string[], indexName?: string, unique?: boolean): DDLResult

  /** 转义标识符（表名、列名） */
  quoteIdentifier(identifier: string): string

  /** 获取分页查询语句（包装一个查询） */
  wrapPagination(query: string, offset: number, limit: number): string
}

// ── 方言实现导出 ──────────────────────────────────────────────────────────

export { MySQLDialectImpl } from './dialects/mysql'
export { PostgreSQLDialectImpl } from './dialects/postgresql'
export { OracleDialectImpl } from './dialects/oracle'
export { DaMengDialectImpl } from './dialects/dameng'
export { KingbaseDialectImpl } from './dialects/kingbase'
export { SQLServerDialectImpl } from './dialects/sqlserver'
export { ClickHouseDialectImpl } from './dialects/clickhouse'
export { OceanBaseDialectImpl } from './dialects/oceanbase'
export { GaussDBDialectImpl } from './dialects/gaussdb'
export { HiveDialectImpl } from './dialects/hive'
export { DorisDialectImpl } from './dialects/doris'
export { TiDBDialectImpl } from './dialects/tidb'

// 注册中心
export { DialectRegistry } from './dialect-registry'

// ── 默认注册工厂 ──────────────────────────────────────────────────────────

import { DialectRegistry } from './dialect-registry'
import { MySQLDialectImpl } from './dialects/mysql'
import { PostgreSQLDialectImpl } from './dialects/postgresql'
import { OracleDialectImpl } from './dialects/oracle'
import { DaMengDialectImpl } from './dialects/dameng'
import { KingbaseDialectImpl } from './dialects/kingbase'
import { SQLServerDialectImpl } from './dialects/sqlserver'
import { ClickHouseDialectImpl } from './dialects/clickhouse'
import { OceanBaseDialectImpl } from './dialects/oceanbase'
import { GaussDBDialectImpl } from './dialects/gaussdb'
import { HiveDialectImpl } from './dialects/hive'
import { DorisDialectImpl } from './dialects/doris'
import { TiDBDialectImpl } from './dialects/tidb'

/**
 * 创建并返回已注册所有内置方言的注册中心实例
 *
 * @example
 * ```ts
 * const registry = createDefaultRegistry()
 * const pg = registry.get('POSTGRESQL')
 * ```
 */
export function createDefaultRegistry(): DialectRegistry {
  const registry = DialectRegistry.getInstance()
  registry.registerAll([
    new MySQLDialectImpl(),
    new PostgreSQLDialectImpl(),
    new OracleDialectImpl(),
    new DaMengDialectImpl(),
    new KingbaseDialectImpl(),
    new SQLServerDialectImpl(),
    new ClickHouseDialectImpl(),
    new OceanBaseDialectImpl(),
    new GaussDBDialectImpl(),
    new HiveDialectImpl(),
    new DorisDialectImpl(),
    new TiDBDialectImpl(),
  ])
  return registry
}

// 自动初始化（模块加载时即注册所有方言）
createDefaultRegistry()
