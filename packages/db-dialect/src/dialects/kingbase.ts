/**
 * @file kingbase.ts
 * @description 金仓 KingbaseES V8 方言实现（信创适配）
 * @layer db-dialect Package — Dialects
 *
 * 金仓（KingbaseES）基于 PostgreSQL 内核，
 * 高度兼容 PostgreSQL 语法（含 PG 扩展语法）。
 * 信创场景下（国产化替代 Oracle/MySQL），直接继承 PostgreSQL 方言。
 *
 * @pattern GoF: Strategy — 金仓具体策略
 *           Template Method — 继承 PostgreSQLDialectImpl 并重写差异部分
 *
 * @module @ddm/db-dialect
 */

import { DialectEntitySnapshot, DialectFieldSnapshot, DDLResult } from '../index'
import { PostgreSQLDialectImpl } from './postgresql'

/**
 * 金仓 KingbaseES V8 方言
 *
 * 与 PostgreSQL 的差异：
 * - 默认模式名为 PUBLIC（与 PG 一致）
 * - 部分系统函数与 Oracle 保持兼容（金仓支持 Oracle 兼容模式）
 * - 支持 rownum（Oracle 兼容模式下）
 * - 分页查询与 PG 完全一致
 */
export class KingbaseDialectImpl extends PostgreSQLDialectImpl {
  override readonly dbType = 'KINGBASE'
  override readonly displayName = '金仓 KingbaseES V8（信创）'
  override readonly category = 'XINCHUANG' as const
  override readonly version = 'V8R6'

  /**
   * 金仓数据类型映射
   * 与 PG 基本一致，差异极小
   */
  override mapType(field: Pick<DialectFieldSnapshot, 'baseType' | 'length' | 'precision' | 'scale' | 'autoIncrement'>): string {
    // 金仓中 SERIAL4/SERIAL8 等价 PG 的 SERIAL/BIGSERIAL
    return super.mapType(field)
  }

  /**
   * 生成金仓建表 DDL（兼容 PG，加上金仓特定注释）
   */
  override generateCreateTable(entity: DialectEntitySnapshot): DDLResult {
    const result = super.generateCreateTable(entity)
    return {
      sql: result.sql,
      notes: [
        '金仓 KingbaseES V8 兼容 PostgreSQL 语法',
        '如需 Oracle 兼容模式，在连接时设置 compatible_mode=oracle',
      ],
    }
  }
}
