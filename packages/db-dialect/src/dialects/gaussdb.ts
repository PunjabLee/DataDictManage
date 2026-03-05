/**
 * @file gaussdb.ts
 * @description 华为 GaussDB 方言实现
 * @layer db-dialect Package — Dialects
 *
 * @module @ddm/db-dialect
 */

import { IDbDialect, DialectEntitySnapshot, DialectFieldSnapshot, DDLResult } from '../index'

/**
 * GaussDB 方言（华为高斯数据库，兼容 PostgreSQL）
 *
 * 特性：
 * - 使用双引号包裹标识符
 * - 支持 SERIAL 自增类型
 * - 支持 COMMENT 语法
 */
export class GaussDBDialectImpl implements IDbDialect {
  readonly dbType = 'GAUSSDB'
  readonly displayName = 'Huawei GaussDB 100'
  readonly category = 'XINCHUANG' as const
  readonly version = '100'

  mapType(field: Pick<DialectFieldSnapshot, 'baseType' | 'length' | 'precision' | 'scale'>): string {
    switch (field.baseType.toUpperCase()) {
      case 'STRING':   return `VARCHAR2(${field.length ?? 255})`
      case 'INTEGER':  return 'INTEGER'
      case 'BIGINT':   return 'BIGINT'
      case 'DECIMAL':  return `NUMBER(${field.precision ?? 18},${field.scale ?? 4})`
      case 'BOOLEAN':  return 'NUMBER(1)'
      case 'DATE':     return 'DATE'
      case 'DATETIME': return 'TIMESTAMP'
      case 'TEXT':     return 'CLOB'
      case 'BLOB':     return 'BLOB'
      case 'JSON':     return 'JSON'
      default:         return `VARCHAR2(${field.length ?? 255})`
    }
  }

  quoteIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`
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
      sql: `ALTER TABLE ${this.quoteIdentifier(tableName)} ADD ${this._fieldDef(field)};`,
    }
  }

  generateModifyColumn(tableName: string, _oldField: DialectFieldSnapshot, newField: DialectFieldSnapshot): DDLResult {
    return {
      sql: `ALTER TABLE ${this.quoteIdentifier(tableName)} MODIFY ${this._fieldDef(newField)};`,
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
    if (f.defaultValue !== undefined) parts.push(`DEFAULT '${f.defaultValue}'`)
    if (f.comment) parts.push(`COMMENT '${f.comment}'`)
    return parts.join(' ')
  }
}
