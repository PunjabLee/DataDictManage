/**
 * @file oracle.ts
 * @description Oracle 19c 方言实现
 * @layer db-dialect Package — Dialects
 *
 * @pattern GoF: Strategy — Oracle 具体策略
 *
 * @module @ddm/db-dialect
 */

import { IDbDialect, DialectEntitySnapshot, DialectFieldSnapshot, DDLResult } from '../index'

/**
 * Oracle 19c 方言
 *
 * 特性：
 * - 使用双引号 "" 包裹标识符（通常大写）
 * - 无 AUTO_INCREMENT，使用 SEQUENCE + TRIGGER 或 GENERATED ALWAYS AS IDENTITY（12c+）
 * - COMMENT 使用独立 COMMENT ON 语句
 * - VARCHAR2 替代 VARCHAR
 * - NUMBER 类型（无 BIGINT/DECIMAL）
 */
export class OracleDialectImpl implements IDbDialect {
  readonly dbType = 'ORACLE'
  readonly displayName = 'Oracle 19c'
  readonly category = 'COMMERCIAL' as const
  readonly version = '19c'

  mapType(field: Pick<DialectFieldSnapshot, 'baseType' | 'length' | 'precision' | 'scale'>): string {
    switch (field.baseType.toUpperCase()) {
      case 'STRING':   return `VARCHAR2(${field.length ?? 255})`
      case 'INTEGER':  return 'NUMBER(19)'
      case 'DECIMAL':  return `NUMBER(${field.precision ?? 18},${field.scale ?? 4})`
      case 'BOOLEAN':  return 'NUMBER(1)'
      case 'DATE':     return 'DATE'
      case 'DATETIME': return 'TIMESTAMP(3)'
      case 'TEXT':     return 'CLOB'
      case 'BLOB':     return 'BLOB'
      case 'JSON':     return 'CLOB'   // Oracle 21c 有原生 JSON，此处兼容 19c
      default:         return `VARCHAR2(${field.length ?? 255})`
    }
  }

  quoteIdentifier(identifier: string): string {
    // Oracle 通常约定大写，不包裹引号（区分大小写时才用引号）
    return `"${identifier.toUpperCase().replace(/"/g, '""')}"`
  }

  generateCreateTable(entity: DialectEntitySnapshot): DDLResult {
    const lines: string[] = []
    const schemaPrefix = entity.schema ? `${this.quoteIdentifier(entity.schema)}.` : ''
    const tableName = `${schemaPrefix}${this.quoteIdentifier(entity.name)}`
    const pks = entity.fields.filter(f => f.primaryKey)
    const sequences: string[] = []

    lines.push(`CREATE TABLE ${tableName} (`)

    entity.fields.forEach((field, idx) => {
      const isLast = idx === entity.fields.length - 1 && pks.length === 0
      const def = this._fieldDef(field)
      lines.push(`  ${def}${isLast ? '' : ','}`)

      // Oracle 19c 使用 IDENTITY 语法
      if (field.autoIncrement) {
        // 已在 fieldDef 中处理
      }
    })

    if (pks.length > 0) {
      lines.push(`,  CONSTRAINT PK_${entity.name.toUpperCase()} PRIMARY KEY (${pks.map(f => this.quoteIdentifier(f.name)).join(', ')})`)
    }

    lines.push(');')

    // COMMENT ON TABLE
    if (entity.comment) {
      lines.push(`\nCOMMENT ON TABLE ${tableName} IS '${entity.comment}';`)
    }

    // COMMENT ON COLUMN
    entity.fields.filter(f => f.comment).forEach(f => {
      lines.push(`COMMENT ON COLUMN ${tableName}.${this.quoteIdentifier(f.name)} IS '${f.comment}';`)
    })

    return {
      sql: [...lines, ...sequences].join('\n'),
      notes: ['Oracle 19c 使用 GENERATED ALWAYS AS IDENTITY 替代 AUTO_INCREMENT'],
    }
  }

  generateAddColumn(tableName: string, field: DialectFieldSnapshot): DDLResult {
    const lines = [`ALTER TABLE ${this.quoteIdentifier(tableName)} ADD ${this._fieldDef(field)};`]
    if (field.comment) {
      lines.push(`COMMENT ON COLUMN ${this.quoteIdentifier(tableName)}.${this.quoteIdentifier(field.name)} IS '${field.comment}';`)
    }
    return { sql: lines.join('\n') }
  }

  generateModifyColumn(tableName: string, _oldField: DialectFieldSnapshot, newField: DialectFieldSnapshot): DDLResult {
    const type = this.mapType(newField)
    const notNull = !newField.nullable ? ' NOT NULL' : ''
    return {
      sql: `ALTER TABLE ${this.quoteIdentifier(tableName)} MODIFY ${this.quoteIdentifier(newField.name)} ${type}${notNull};`,
    }
  }

  generateDropColumn(tableName: string, fieldName: string): DDLResult {
    return {
      sql: `ALTER TABLE ${this.quoteIdentifier(tableName)} DROP COLUMN ${this.quoteIdentifier(fieldName)};`,
    }
  }

  generateCreateIndex(tableName: string, fields: string[], indexName?: string, unique = false): DDLResult {
    const idxName = indexName ?? `IDX_${tableName.toUpperCase()}_${fields.join('_').toUpperCase()}`
    const uniqueStr = unique ? 'UNIQUE ' : ''
    const cols = fields.map(f => this.quoteIdentifier(f)).join(', ')
    return {
      sql: `CREATE ${uniqueStr}INDEX ${this.quoteIdentifier(idxName)} ON ${this.quoteIdentifier(tableName)} (${cols});`,
    }
  }

  wrapPagination(query: string, offset: number, limit: number): string {
    // Oracle 12c+ FETCH FIRST 语法
    return `${query}\nOFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`
  }

  protected _fieldDef(f: DialectFieldSnapshot): string {
    const type = this.mapType(f)
    const parts = [this.quoteIdentifier(f.name), type]
    if (f.autoIncrement) parts.push('GENERATED ALWAYS AS IDENTITY')
    if (!f.nullable) parts.push('NOT NULL')
    if (f.defaultValue !== undefined && !f.autoIncrement) parts.push(`DEFAULT '${f.defaultValue}'`)
    return parts.join(' ')
  }
}
