/**
 * @file sqlserver.ts
 * @description SQL Server 2019+ 方言实现
 * @layer db-dialect Package — Dialects
 *
 * @pattern GoF: Strategy — SQL Server 具体策略
 *
 * @module @ddm/db-dialect
 */

import { IDbDialect, DialectEntitySnapshot, DialectFieldSnapshot, DDLResult } from '../index'

/**
 * SQL Server 2019 方言
 *
 * 特性：
 * - 使用方括号 [] 包裹标识符
 * - AUTO_INCREMENT 使用 IDENTITY(1,1)
 * - 注释通过扩展属性 sp_addextendedproperty 添加
 * - NVARCHAR 替代 VARCHAR（支持 Unicode）
 * - 分页使用 OFFSET/FETCH 语法
 */
export class SQLServerDialectImpl implements IDbDialect {
  readonly dbType = 'SQLSERVER'
  readonly displayName = 'SQL Server 2019'
  readonly category = 'COMMERCIAL' as const
  readonly version = '2019'

  mapType(field: Pick<DialectFieldSnapshot, 'baseType' | 'length' | 'precision' | 'scale'>): string {
    switch (field.baseType.toUpperCase()) {
      case 'STRING':   return `NVARCHAR(${field.length ?? 255})`
      case 'INTEGER':  return 'BIGINT'
      case 'DECIMAL':  return `DECIMAL(${field.precision ?? 18},${field.scale ?? 4})`
      case 'BOOLEAN':  return 'BIT'
      case 'DATE':     return 'DATE'
      case 'DATETIME': return 'DATETIME2(3)'
      case 'TEXT':     return 'NVARCHAR(MAX)'
      case 'BLOB':     return 'VARBINARY(MAX)'
      case 'JSON':     return 'NVARCHAR(MAX)'  // SQL Server 2016+ 支持 JSON 函数，但无原生类型
      default:         return `NVARCHAR(${field.length ?? 255})`
    }
  }

  quoteIdentifier(identifier: string): string {
    return `[${identifier.replace(/\]/g, ']]')}]`
  }

  generateCreateTable(entity: DialectEntitySnapshot): DDLResult {
    const lines: string[] = []
    const schemaPrefix = entity.schema ? `${this.quoteIdentifier(entity.schema)}.` : '[dbo].'
    const tableName = `${schemaPrefix}${this.quoteIdentifier(entity.name)}`
    const pks = entity.fields.filter(f => f.primaryKey)
    const commentLines: string[] = []

    lines.push(`CREATE TABLE ${tableName} (`)

    entity.fields.forEach((field, idx) => {
      const isLast = idx === entity.fields.length - 1 && pks.length === 0
      lines.push(`  ${this._fieldDef(field)}${isLast ? '' : ','}`)

      // 记录字段注释（后续用 sp_addextendedproperty 添加）
      if (field.comment) {
        commentLines.push(
          `EXEC sp_addextendedproperty 'MS_Description', N'${field.comment}',` +
          ` 'SCHEMA', N'dbo', 'TABLE', N'${entity.name}', 'COLUMN', N'${field.name}';`
        )
      }
    })

    if (pks.length > 0) {
      lines.push(`  CONSTRAINT [PK_${entity.name}] PRIMARY KEY CLUSTERED (`)
      pks.forEach((pk, idx) => {
        lines.push(`    ${this.quoteIdentifier(pk.name)} ASC${idx < pks.length - 1 ? ',' : ''}`)
      })
      lines.push(`  )`)
    }

    lines.push(`);`)

    // 表注释
    if (entity.comment) {
      commentLines.unshift(
        `EXEC sp_addextendedproperty 'MS_Description', N'${entity.comment}', 'SCHEMA', N'dbo', 'TABLE', N'${entity.name}';`
      )
    }

    return {
      sql: [...lines, '', ...commentLines].join('\n').trim(),
      notes: ['SQL Server 通过扩展属性(Extended Properties)存储表和列注释'],
    }
  }

  generateAddColumn(tableName: string, field: DialectFieldSnapshot): DDLResult {
    return {
      sql: `ALTER TABLE ${this.quoteIdentifier(tableName)} ADD ${this._fieldDef(field)};`,
    }
  }

  generateModifyColumn(tableName: string, _oldField: DialectFieldSnapshot, newField: DialectFieldSnapshot): DDLResult {
    const type = this.mapType(newField)
    const notNull = !newField.nullable ? ' NOT NULL' : ' NULL'
    return {
      sql: `ALTER TABLE ${this.quoteIdentifier(tableName)} ALTER COLUMN ${this.quoteIdentifier(newField.name)} ${type}${notNull};`,
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
    // SQL Server 2012+ OFFSET/FETCH 语法（需要 ORDER BY）
    return `${query}\nORDER BY (SELECT NULL)\nOFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`
  }

  private _fieldDef(f: DialectFieldSnapshot): string {
    const type = this.mapType(f)
    const parts = [this.quoteIdentifier(f.name), type]
    if (f.autoIncrement) parts.push('IDENTITY(1,1)')
    if (!f.nullable) parts.push('NOT NULL')
    else parts.push('NULL')
    if (f.defaultValue !== undefined) parts.push(`DEFAULT '${f.defaultValue}'`)
    return parts.join(' ')
  }
}
