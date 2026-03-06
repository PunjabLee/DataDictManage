/**
 * @file hive.ts
 * @description Apache Hive 方言实现
 * @layer db-dialect Package — Dialects
 *
 * @module @ddm/db-dialect
 */

import { IDbDialect, DialectEntitySnapshot, DialectFieldSnapshot, DDLResult } from '../index'

/**
 * Hive 方言
 *
 * 特性：
 * - 使用反引号包裹标识符
 * - 支持分区表
 * - 支持 SerDe 格式
 */
export class HiveDialectImpl implements IDbDialect {
  readonly dbType = 'HIVE'
  readonly displayName = 'Apache Hive 3.x'
  readonly category = 'ANALYTICS' as const
  readonly version = '3.x'

  mapType(field: Pick<DialectFieldSnapshot, 'baseType' | 'length' | 'precision' | 'scale'>): string {
    switch (field.baseType.toUpperCase()) {
      case 'STRING':   return 'STRING'
      case 'INTEGER':  return 'INT'
      case 'BIGINT':   return 'BIGINT'
      case 'DECIMAL':  return `DECIMAL(${field.precision ?? 18},${field.scale ?? 4})`
      case 'BOOLEAN':  return 'BOOLEAN'
      case 'DATE':     return 'DATE'
      case 'DATETIME': return 'TIMESTAMP'
      case 'TEXT':     return 'STRING'
      case 'BLOB':     return 'BINARY'
      case 'JSON':     return 'STRING'  // Hive 没有原生 JSON 类型
      default:         return 'STRING'
    }
  }

  quoteIdentifier(identifier: string): string {
    return `\`${identifier.replace(/`/g, '``')}\``
  }

  generateCreateTable(entity: DialectEntitySnapshot): DDLResult {
    const lines: string[] = []
    const tableName = this.quoteIdentifier(entity.name)

    lines.push(`CREATE TABLE ${tableName} (`)

    entity.fields.forEach((field, idx) => {
      const isLast = idx === entity.fields.length - 1
      lines.push(`  ${this._fieldDef(field)}${isLast ? '' : ','}`)
    })

    lines.push(')')
    lines.push("ROW FORMAT DELIMITED")
    lines.push('FIELDS TERMINATED BY "\\t"')
    lines.push('STORED AS TEXTFILE')

    if (entity.comment) {
      lines.push(`COMMENT '${entity.comment}'`)
    }

    lines.push(';')

    return { sql: lines.join('\n') }
  }

  generateAddColumn(tableName: string, field: DialectFieldSnapshot): DDLResult {
    return {
      sql: `ALTER TABLE ${this.quoteIdentifier(tableName)} ADD COLUMNS (${this._fieldDef(field)});`,
    }
  }

  generateModifyColumn(tableName: string, _oldField: DialectFieldSnapshot, newField: DialectFieldSnapshot): DDLResult {
    // Hive MODIFY COLUMN 有限制
    return {
      sql: `-- Hive 不支持直接修改列类型，请使用 REPLACE COLUMNS\nALTER TABLE ${this.quoteIdentifier(tableName)} CHANGE ${this.quoteIdentifier(newField.name)} ${this._fieldDef(newField)};`,
    }
  }

  generateDropColumn(tableName: string, fieldName: string): DDLResult {
    return {
      sql: `-- Hive 不支持直接删除列，请使用 REPLACE COLUMNS\nALTER TABLE ${this.quoteIdentifier(tableName)} REPLACE COLUMNS (${this.quoteIdentifier(fieldName)} STRING);`,
    }
  }

  generateCreateIndex(tableName: string, fields: string[], indexName?: string, unique = false): DDLResult {
    const idxName = indexName ?? `idx_${tableName}_${fields.join('_')}`
    const cols = fields.map(f => this.quoteIdentifier(f)).join(', ')
    return {
      sql: `CREATE INDEX ${this.quoteIdentifier(idxName)} ON TABLE ${this.quoteIdentifier(tableName)} (${cols}) AS 'org.apache.hadoop.hive.ql.index.compact.CompactIndexHandler';`,
    }
  }

  wrapPagination(query: string, offset: number, limit: number): string {
    return `${query}\nLIMIT ${limit} OFFSET ${offset}`
  }

  private _fieldDef(f: DialectFieldSnapshot): string {
    const type = this.mapType(f)
    const parts = [this.quoteIdentifier(f.name), type]
    if (f.comment) parts.push(`COMMENT '${f.comment}'`)
    return parts.join(' ')
  }
}
