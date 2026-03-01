/**
 * @file dameng.ts
 * @description 达梦数据库 DM8 方言实现（信创适配）
 * @layer db-dialect Package — Dialects
 *
 * 达梦（DM8）高度兼容 Oracle 语法，
 * 同时对 JSON 类型有原生支持（不同于 Oracle 19c 用 CLOB 模拟）。
 * 信创场景下（国产化替代 Oracle），直接继承 Oracle 方言并重写差异部分。
 *
 * @pattern GoF: Strategy — 达梦具体策略
 *           Template Method — 继承 OracleDialectImpl 并 override 差异方法
 *
 * @module @ddm/db-dialect
 */

import { DialectEntitySnapshot, DialectFieldSnapshot, DDLResult } from '../index'
import { OracleDialectImpl } from './oracle'

/**
 * 达梦 DM8 方言
 *
 * 与 Oracle 的差异：
 * - JSON 类型直接原生支持（不需要 CLOB 替代）
 * - IDENTITY 列语法与 Oracle 一致
 * - 默认字符集 UTF-8
 * - 双引号包裹标识符（不强制大写，可保留原始大小写）
 */
export class DaMengDialectImpl extends OracleDialectImpl {
  override readonly dbType = 'DAMENG'
  override readonly displayName = '达梦 DM8（信创）'
  override readonly category = 'XINCHUANG' as const
  override readonly version = 'DM8'

  /**
   * 达梦 DM8 数据类型映射
   * 大部分继承 Oracle，JSON 原生支持是主要差异
   */
  override mapType(field: Pick<DialectFieldSnapshot, 'baseType' | 'length' | 'precision' | 'scale'>): string {
    // 达梦 DM8 原生支持 JSON 类型（Oracle 19c 不支持原生 JSON）
    if (field.baseType.toUpperCase() === 'JSON') return 'JSON'
    // BOOLEAN 类型：达梦支持原生 BIT
    if (field.baseType.toUpperCase() === 'BOOLEAN') return 'BIT'
    return super.mapType(field)
  }

  /**
   * 达梦的标识符无需强制大写（与 Oracle 的区别）
   */
  override quoteIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`
  }

  /**
   * 生成达梦建表 DDL
   * 主体继承 Oracle，差异：CHARSET 可指定 UTF-8
   */
  override generateCreateTable(entity: DialectEntitySnapshot): DDLResult {
    const result = super.generateCreateTable(entity)
    return {
      sql: result.sql,
      notes: [
        '达梦 DM8：兼容 Oracle 语法，JSON 原生支持',
        '建议在达梦管理工具中执行，确认字符集为 UTF-8',
      ],
    }
  }

  /**
   * 分页查询（达梦使用 LIMIT...OFFSET，不同于 Oracle 的 FETCH）
   */
  override wrapPagination(query: string, offset: number, limit: number): string {
    return `${query}\nLIMIT ${limit} OFFSET ${offset}`
  }
}
