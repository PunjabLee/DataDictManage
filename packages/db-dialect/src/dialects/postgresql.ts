/**
 * @file postgresql.ts
 * @description PostgreSQL 15 方言实现
 * @layer db-dialect Package — Dialects
 *
 * @pattern GoF: Strategy — PostgreSQL 具体策略
 *
 * @module @ddm/db-dialect
 */

import { IDbDialect, DialectEntitySnapshot, DialectFieldSnapshot, DDLResult } from '../index'

/**
 * PostgreSQL 15 方言
 *
 * 特性：
 * - 使用双引号 "" 包裹标识符
 * - 使用 SERIAL/BIGSERIAL 替代 AUTO_INCREMENT
 * - COMMENT ON TABLE/COLUMN 独立语句
 * - JSONB 原生支持（比 JSON 查询性能更好）
 * - 支持 BOOLEAN 原生类型
 */
export class PostgreSQLDialectImpl implements IDbDialect {
  readonly dbType = 'POSTGRESQL'
  readonly displayName = 'PostgreSQL 15'
  readonly category = 'OPEN_SOURCE' as const
  readonly version = '15'

  mapType(field: Pick<DialectFieldSnapshot, 'baseType' | 'length' | 'precision' | 'scale' | 'autoIncrement'>): string {
    const autoInc = (field as DialectFieldSnapshot).autoIncrement
    switch (field.baseType.toUpperCase()) {
      case 'STRING':   return `VARCHAR(${field.length ?? 255})`
      case 'INTEGER':  return autoInc ? 'BIGSERIAL' : 'BIGINT'
      case 'DECIMAL':  return `NUMERIC(${field.precision ?? 18},${field.scale ?? 4})`
      case 'BOOLEAN':  return 'BOOLEAN'
      case 'DATE':     return 'DATE'
      case 'DATETIME': return 'TIMESTAMP(3)'
      case 'TEXT':     return 'TEXT'
      case 'BLOB':     return 'BYTEA'
      case 'JSON':     return 'JSONB'
      default:         return `VARCHAR(${field.length ?? 255})`
    }
  }

  quoteIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`
  }

  generateCreateTable(entity: DialectEntitySnapshot): DDLResult {
    const lines: string[] = []
    const schemaPrefix = entity.schema ? `${this.quoteIdentifier(entity.schema)}.` : ''
    const tableName = `${schemaPrefix}${this.quoteIdentifier(entity.name)}`
    const pks = entity.fields.filter(f => f.primaryKey)
    const notes: string[] = []

    lines.push(`CREATE TABLE ${tableName} (`)

    entity.fields.forEach((field, idx) => {
      const isLast = idx === entity.fields.length - 1 && pks.length === 0
      lines.push(`  ${this._fieldDef(field)}${isLast ? '' : ','}`)
    })

    if (pks.length > 0) {
      lines.push(`  PRIMARY KEY (${pks.map(f => this.quoteIdentifier(f.name)).join(', ')})`)
    }

    lines.push(');')

    // COMMENT ON TABLE（独立语句）
    if (entity.comment) {
      lines.push(`COMMENT ON TABLE ${tableName} IS '${entity.comment}';`)
    }

    // COMMENT ON COLUMN
    entity.fields.filter(f => f.comment).forEach(f => {
      lines.push(`COMMENT ON COLUMN ${tableName}.${this.quoteIdentifier(f.name)} IS '${f.comment}';`)
    })

    return { sql: lines.join('\n'), notes }
  }

  generateAddColumn(tableName: string, field: DialectFieldSnapshot): DDLResult {
    const lines = [`ALTER TABLE ${this.quoteIdentifier(tableName)} ADD COLUMN ${this._fieldDef(field)};`]
    if (field.comment) {
      lines.push(`COMMENT ON COLUMN ${this.quoteIdentifier(tableName)}.${this.quoteIdentifier(field.name)} IS '${field.comment}';`)
    }
    return { sql: lines.join('\n') }
  }

  generateModifyColumn(tableName: string, oldField: DialectFieldSnapshot, newField: DialectFieldSnapshot): DDLResult {
    const lines: string[] = []
    const tbl = this.quoteIdentifier(tableName)
    const col = this.quoteIdentifier(newField.name)

    if (oldField.baseType !== newField.baseType || oldField.length !== newField.length) {
      lines.push(`ALTER TABLE ${tbl} ALTER COLUMN ${col} TYPE ${this.mapType(newField)};`)
    }
    if (oldField.nullable !== newField.nullable) {
      lines.push(newField.nullable
        ? `ALTER TABLE ${tbl} ALTER COLUMN ${col} DROP NOT NULL;`
        : `ALTER TABLE ${tbl} ALTER COLUMN ${col} SET NOT NULL;`)
    }
    if (newField.defaultValue !== undefined) {
      lines.push(`ALTER TABLE ${tbl} ALTER COLUMN ${col} SET DEFAULT '${newField.defaultValue}';`)
    }

    return { sql: lines.join('\n') || '-- 无变更' }
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
    // PG 中 BIGSERIAL 自带 NOT NULL，不需要 DEFAULT
    if (f.defaultValue !== undefined && !f.autoIncrement) {
      parts.push(`DEFAULT '${f.defaultValue}'`)
    }
    return parts.join(' ')
  }
}
