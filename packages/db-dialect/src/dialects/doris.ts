/**
 * @file doris.ts
 * @description Apache Doris 方言实现
 * @layer db-dialect Package — Dialects
 *
 * @module @ddm/db-dialect
 */

import { IDbDialect, DialectEntitySnapshot, DialectFieldSnapshot, DDLResult } from '../index'

/**
 * Doris (StarRocks) 方言
 *
 * 特性：
 * - 使用反引号包裹标识符
 * - 支持 DUPLICATE/AGGREGATE/UNIQUE 模型
 * - 支持分区表
 */
export class DorisDialectImpl implements IDbDialect {
  readonly dbType = 'DORIS'
  readonly displayName = 'Apache Doris (StarRocks)'
  readonly category = 'ANALYTICS' as const
  readonly version = '2.x'

  mapType(field: Pick<DialectFieldSnapshot, 'baseType' | 'length' | 'precision' | 'scale'>): string {
    switch (field.baseType.toUpperCase()) {
      case 'STRING':   return `VARCHAR(${field.length ?? 255})`
      case 'INTEGER':  return 'INT'
      case 'BIGINT':   return 'BIGINT'
      case 'DECIMAL':  return `DECIMAL(${field.precision ?? 18},${field.scale ?? 4})`
      case 'BOOLEAN':  return 'BOOLEAN'
      case 'DATE':     return 'DATE'
      case 'DATETIME': return 'DATETIME'
      case 'TEXT':     return 'TEXT'
      case 'BLOB':     return 'LARGEINT'
      case 'JSON':     return 'JSON'
      default:         return `VARCHAR(${field.length ?? 255})`
    }
  }

  quoteIdentifier(identifier: string): string {
    return `\`${identifier.replace(/`/g, '``')}\``
  }

  generateCreateTable(entity: DialectEntitySnapshot): DDLResult {
    const lines: string[] = []
    const pks = entity.fields.filter(f => f.primaryKey)
    const tableName = this.quoteIdentifier(entity.name)

    lines.push(`CREATE TABLE ${tableName} (`)

    entity.fields.forEach((field, idx) => {
      const isLast = idx === entity.fields.length - 1 && pks.length === 0
      lines.push(`  ${this._fieldDef(field)}${isLast ? '' : ','}`)
    })

    if (pks.length > 0) {
      lines.push(`  PRIMARY KEY (${pks.map(f => this.quoteIdentifier(f.name)).join(', ')})`)
    }

    lines.push(') ENGINE=OLAP')
    lines.push("DUPLICATE KEY(" + (pks.length > 0 ? pks.map(f => this.quoteIdentifier(f.name)).join(', ') : this.quoteIdentifier(entity.fields[0]?.name || 'id')) + ")")
    lines.push("DISTRIBUTED BY HASH(" + (pks.length > 0 ? this.quoteIdentifier(pks[0].name) : this.quoteIdentifier('id')) + ") BUCKETS 10")

    if (entity.comment) {
      lines.push(`COMMENT '${entity.comment}'`)
    }

    lines.push(';')

    return { sql: lines.join('\n') }
  }

  generateAddColumn(tableName: string, field: DialectFieldSnapshot): DDLResult {
    return {
      sql: `ALTER TABLE ${this.quoteIdentifier(tableName)} ADD COLUMN ${this._fieldDef(field)};`,
    }
  }

  generateModifyColumn(tableName: string, _oldField: DialectFieldSnapshot, newField: DialectFieldSnapshot): DDLResult {
    return {
      sql: `ALTER TABLE ${this.quoteIdentifier(tableName)} MODIFY COLUMN ${this._fieldDef(newField)};`,
    }
  }

  generateDropColumn(tableName: string, fieldName: string): DDLResult {
    return {
      sql: `ALTER TABLE ${this.quoteIdentifier(tableName)} DROP COLUMN ${this.quoteIdentifier(fieldName)};`,
    }
  }

  generateCreateIndex(tableName: string, fields: string[], indexName?: string, unique = false): DDLResult {
    const idxName = indexName ?? `idx_${tableName}_${fields.join('_')}`
    const cols = fields.map(f => this.quoteIdentifier(f)).join(', ')
    return {
      sql: `CREATE INDEX ${this.quoteIdentifier(idxName)} ON ${this.quoteIdentifier(tableName)} (${cols});`,
    }
  }

  wrapPagination(query: string, offset: number, limit: number): string {
    return `${query}\nLIMIT ${limit} OFFSET ${offset}`
  }

  private _fieldDef(f: DialectFieldSnapshot): string {
    const type = this.mapType(f)
    const parts = [this.quoteIdentifier(f.name), type]
    if (!f.nullable) parts.push('NOT NULL')
    if (f.defaultValue !== undefined) parts.push(`DEFAULT '${f.defaultValue}'`)
    if (f.comment) parts.push(`COMMENT '${f.comment}'`)
    return parts.join(' ')
  }
}
