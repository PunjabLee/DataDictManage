/**
 * @file clickhouse.ts
 * @description ClickHouse 24.x 方言实现（大数据分析场景）
 * @layer db-dialect Package — Dialects
 *
 * ClickHouse 是列式存储 OLAP 数据库，DDL 语法与传统关系型数据库差异较大：
 * - 使用 MergeTree 引擎家族（ReplicatedMergeTree/SummingMergeTree 等）
 * - 无事务，无外键
 * - ORDER BY 是必须的，用于定义数据排序键（影响查询性能）
 * - 分区键（PARTITION BY）用于数据生命周期管理
 * - 字段类型与 MySQL 差异较大
 *
 * @pattern GoF: Strategy — ClickHouse 具体策略
 *
 * @module @ddm/db-dialect
 */

import { IDbDialect, DialectEntitySnapshot, DialectFieldSnapshot, DDLResult } from '../index'

/**
 * ClickHouse 24.x 方言
 */
export class ClickHouseDialectImpl implements IDbDialect {
  readonly dbType = 'CLICKHOUSE'
  readonly displayName = 'ClickHouse 24.x（大数据分析）'
  readonly category = 'ANALYTICS' as const
  readonly version = '24.x'

  mapType(field: Pick<DialectFieldSnapshot, 'baseType' | 'length' | 'precision' | 'scale' | 'nullable'>): string {
    const isNullable = (field as DialectFieldSnapshot).nullable

    const baseType = (() => {
      switch (field.baseType.toUpperCase()) {
        case 'STRING':   return 'String'
        case 'INTEGER':  return 'Int64'
        case 'DECIMAL':  return `Decimal(${field.precision ?? 18}, ${field.scale ?? 4})`
        case 'BOOLEAN':  return 'Bool'
        case 'DATE':     return 'Date'
        case 'DATETIME': return 'DateTime64(3)'
        case 'TEXT':     return 'String'
        case 'BLOB':     return 'String'   // ClickHouse 没有 BLOB，用 String 存储
        case 'JSON':     return 'String'   // ClickHouse JSON 通过 JSONExtract 函数处理
        default:         return 'String'
      }
    })()

    // ClickHouse 的可空类型需要用 Nullable() 包装
    return isNullable ? `Nullable(${baseType})` : baseType
  }

  quoteIdentifier(identifier: string): string {
    return `\`${identifier.replace(/`/g, '``')}\``
  }

  /**
   * 生成 ClickHouse 建表 DDL
   *
   * 注意 ClickHouse 的特殊要求：
   * 1. 必须指定 ENGINE（默认 MergeTree）
   * 2. 必须指定 ORDER BY（排序键，影响压缩和查询性能）
   * 3. PARTITION BY 用于数据分区（通常按时间字段）
   */
  generateCreateTable(entity: DialectEntitySnapshot): DDLResult {
    const lines: string[] = []
    const tableName = this.quoteIdentifier(entity.name)

    lines.push(`-- ${entity.comment || entity.name}`)
    lines.push(`CREATE TABLE IF NOT EXISTS ${tableName}`)
    lines.push(`(`)

    entity.fields.forEach((field, idx) => {
      const isLast = idx === entity.fields.length - 1
      const type = this.mapType(field)
      const defaultClause = field.defaultValue !== undefined ? ` DEFAULT ${field.defaultValue}` : ''
      const commentClause = field.comment ? ` COMMENT '${field.comment}'` : ''
      lines.push(`  ${this.quoteIdentifier(field.name)} ${type}${defaultClause}${commentClause}${isLast ? '' : ','}`)
    })

    lines.push(`)`)

    // ClickHouse 必须指定引擎
    lines.push(`ENGINE = MergeTree()`)

    // 自动检测时间字段用于分区键
    const dateField = entity.fields.find(f =>
      f.baseType.toUpperCase() === 'DATE' || f.baseType.toUpperCase() === 'DATETIME'
    )
    if (dateField) {
      lines.push(`PARTITION BY toYYYYMM(${this.quoteIdentifier(dateField.name)})`)
    }

    // ORDER BY：优先使用主键，否则使用第一个字段
    const pkFields = entity.fields.filter(f => f.primaryKey)
    const orderByFields = pkFields.length > 0 ? pkFields : [entity.fields[0]]
    if (orderByFields.length > 0) {
      lines.push(`ORDER BY (${orderByFields.map(f => this.quoteIdentifier(f.name)).join(', ')})`)
    }

    lines.push(`SETTINGS index_granularity = 8192;`)

    return {
      sql: lines.join('\n'),
      notes: [
        'ClickHouse MergeTree 引擎：适合大规模数据写入和分析查询',
        'ORDER BY 定义主排序键，影响数据压缩效率和查询性能',
        'PARTITION BY 按月分区，便于数据生命周期管理',
        '⚠️ ClickHouse 不支持 UPDATE/DELETE（需使用 ALTER TABLE ... UPDATE/DELETE）',
        '⚠️ ClickHouse 不支持事务和外键',
      ],
    }
  }

  generateAddColumn(tableName: string, field: DialectFieldSnapshot): DDLResult {
    const type = this.mapType(field)
    return {
      sql: `ALTER TABLE ${this.quoteIdentifier(tableName)} ADD COLUMN ${this.quoteIdentifier(field.name)} ${type};`,
    }
  }

  generateModifyColumn(tableName: string, _oldField: DialectFieldSnapshot, newField: DialectFieldSnapshot): DDLResult {
    const type = this.mapType(newField)
    return {
      sql: `ALTER TABLE ${this.quoteIdentifier(tableName)} MODIFY COLUMN ${this.quoteIdentifier(newField.name)} ${type};`,
    }
  }

  generateDropColumn(tableName: string, fieldName: string): DDLResult {
    return {
      sql: `ALTER TABLE ${this.quoteIdentifier(tableName)} DROP COLUMN ${this.quoteIdentifier(fieldName)};`,
    }
  }

  generateCreateIndex(tableName: string, fields: string[], indexName?: string, unique = false): DDLResult {
    // ClickHouse 使用跳数索引（Skip Index），与关系型数据库索引不同
    const idxName = indexName ?? `idx_${tableName}_${fields.join('_')}`
    const col = fields[0]
    return {
      sql: `ALTER TABLE ${this.quoteIdentifier(tableName)} ADD INDEX ${idxName} ${this.quoteIdentifier(col)} TYPE minmax GRANULARITY 4;`,
      notes: ['ClickHouse 跳数索引（Skip Index）用于加速特定过滤条件，与 B-tree 索引机制不同'],
    }
  }

  wrapPagination(query: string, offset: number, limit: number): string {
    return `${query}\nLIMIT ${limit} OFFSET ${offset}`
  }
}
