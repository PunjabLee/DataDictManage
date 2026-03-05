/**
 * @file oceanbase.ts
 * @description OceanBase 方言实现（兼容 MySQL 模式）
 * @layer db-dialect Package — Dialects
 *
 * @module @ddm/db-dialect
 */

import { IDbDialect, DialectEntitySnapshot, DialectFieldSnapshot, DDLResult } from '../index'

/**
 * OceanBase 方言（MySQL 兼容模式）
 *
 * 特性：
 * - 使用反引号包裹标识符
 * - 支持 AUTO_INCREMENT
 * - 支持 COMMENT 语法
 * - 默认 InnoDB 引擎
 */
export class OceanBaseDialectImpl implements IDbDialect {
  readonly dbType = 'OCEANBASE'
  readonly displayName = 'OceanBase 4.x'
  readonly category = 'XINCHUANG' as const
  readonly version = '4.x'

  mapType(field: Pick<DialectFieldSnapshot, 'baseType' | 'length' | 'precision' | 'scale'>): string {
    switch (field.baseType.toUpperCase()) {
      case 'STRING':   return `VARCHAR(${field.length ?? 255})`
      case 'INTEGER':  return 'BIGINT'
      case 'DECIMAL':  return `DECIMAL(${field.precision ?? 18},${field.scale ?? 4})`
      case 'BOOLEAN':  return 'TINYINT(1)'
      case 'DATE':     return 'DATE'
      case 'DATETIME': return 'DATETIME(3)'
      case 'TEXT':     return 'TEXT'
      case 'BLOB':     return 'BLOB'
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

    const comment = entity.comment ? ` COMMENT='${entity.comment}'` : ''
    lines.push(`)${comment};`)

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
    const uniqueStr = unique ? 'UNIQUE ' : ''
    const cols = fields.map(f => this.quoteIdentifier(f)).join(', ')
    return {
      sql: `CREATE ${uniqueStr}INDEX ${this.quoteIdentifier(idxName)} ON ${this.quoteIdentifier(tableName)} (${cols});`,
    }
  }

  wrapPagination(query: string, offset: number, limit: number): string {
    return `${query}\nLIMIT ${limit} OFFSET ${offset}`
  }

  private _fieldDef(f: DialectFieldSnapshot): string {
    const type = this.mapType(f)
    const parts = [this.quoteIdentifier(f.name), type]
    if (!f.nullable) parts.push('NOT NULL')
    if (f.autoIncrement) parts.push('AUTO_INCREMENT')
    if (f.defaultValue !== undefined) parts.push(`DEFAULT '${f.defaultValue}'`)
    if (f.comment) parts.push(`COMMENT '${f.comment}'`)
    return parts.join(' ')
  }
}
