/**
 * @file shentong.ts
 * @description 神通数据库（ShenTong）方言实现
 * @layer db-dialect Package — Dialects
 *
 * @module @ddm/db-dialect
 */

import { IDbDialect, DialectEntitySnapshot, DialectFieldSnapshot, DDLResult } from '../index'

/**
 * 神通数据库（ShenTong）— 国产数据库
 *
 * 特性：
 * - 支持自增序列
 * - 支持注释
 * - 支持多种数据类型
 */
export class ShenTongDialectImpl implements IDbDialect {
  readonly dbType = 'SHENTONG'
  readonly displayName = 'ShenTong 神通数据库'
  readonly category = 'XINCHUANG' as const
  readonly version = '7.0'

  mapType(field: Pick<DialectFieldSnapshot, 'baseType' | 'length' | 'precision' | 'scale'>): string {
    switch (field.baseType.toUpperCase()) {
      case 'STRING':   return `VARCHAR(${field.length ?? 255})`
      case 'INTEGER':  return 'INTEGER'
      case 'BIGINT':   return 'BIGINT'
      case 'DECIMAL':  return `DECIMAL(${field.precision ?? 18},${field.scale ?? 4})`
      case 'BOOLEAN':  return 'SMALLINT'
      case 'DATE':     return 'DATE'
      case 'DATETIME': return 'TIMESTAMP'
      case 'TIME':     return 'TIME'
      case 'TEXT':     return 'TEXT'
      case 'CLOB':     return 'CLOB'
      case 'BLOB':     return 'BLOB'
      case 'JSON':     return 'TEXT'
      default:         return `VARCHAR(${field.length ?? 255})`
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

    const fieldLines = entity.fields.map(field => {
      const fieldDef = [
        this.quoteIdentifier(field.name),
        this.mapType(field),
        field.nullable ? 'NULL' : 'NOT NULL',
        field.autoIncrement ? 'IDENTITY' : '',
        field.defaultValue ? `DEFAULT ${field.defaultValue}` : '',
      ].filter(Boolean).join(' ')

      return fieldDef
    })

    lines.push(fieldLines.join(',\n  '))

    // 主键
    if (pks.length > 0) {
      lines.push(`,  PRIMARY KEY (${pks.map(f => this.quoteIdentifier(f.name)).join(', ')})`)
    }

    lines.push(')')

    // 表注释
    if (entity.description) {
      lines.push(`;`)
      lines.push(`COMMENT ON TABLE ${tableName} IS '${entity.description.replace(/'/g, "''")}'`)
    }

    // 字段注释
    entity.fields.forEach(field => {
      if (field.comment) {
        lines.push(`COMMENT ON COLUMN ${tableName}.${this.quoteIdentifier(field.name)} IS '${field.comment.replace(/'/g, "''")}'`)
      }
    })

    // 索引
    entity.indexes.forEach(idx => {
      const idxName = this.quoteIdentifier(idx.name || `${entity.name}_${idx.columns.join('_')}_idx`)
      const idxType = idx.unique ? 'UNIQUE' : ''
      lines.push(`CREATE ${idxType} INDEX ${idxName} ON ${tableName} (${idx.columns.map(c => this.quoteIdentifier(c)).join(', ')})`)
    })

    return {
      ddl: lines.filter(Boolean).join('\n'),
      warnings: [],
    }
  }

  generateAddColumn(entity: DialectEntitySnapshot, field: DialectFieldSnapshot): DDLResult {
    const tableName = this.quoteIdentifier(entity.name)
    const fieldDef = [
      this.quoteIdentifier(field.name),
      this.mapType(field),
      field.nullable ? 'NULL' : 'NOT NULL',
    ].filter(Boolean).join(' ')

    let ddl = `ALTER TABLE ${tableName} ADD ${fieldDef}`

    if (field.comment) {
      ddl += `; COMMENT ON COLUMN ${tableName}.${this.quoteIdentifier(field.name)} IS '${field.comment.replace(/'/g, "''")}'`
    }

    return { ddl, warnings: [] }
  }

  generateModifyColumn(entity: DialectEntitySnapshot, field: DialectFieldSnapshot, oldField: DialectFieldSnapshot): DDLResult {
    const tableName = this.quoteIdentifier(entity.name)
    const ddl = `ALTER TABLE ${tableName} ALTER COLUMN ${this.quoteIdentifier(field.name)} TYPE ${this.mapType(field)}`
    return { ddl, warnings: ['数据类型的修改可能导致数据丢失，请提前备份'] }
  }

  generateDropColumn(entity: DialectEntitySnapshot, fieldName: string): DDLResult {
    const tableName = this.quoteIdentifier(entity.name)
    return {
      ddl: `ALTER TABLE ${tableName} DROP COLUMN ${this.quoteIdentifier(fieldName)}`,
      warnings: ['删除列会同时删除列中的数据，请提前备份'],
    }
  }

  generateDropTable(tableName: string): DDLResult {
    return { ddl: `DROP TABLE ${this.quoteIdentifier(tableName)} CASCADE`, warnings: [] }
  }

  generateCreateIndex(tableName: string, indexName: string, columns: string[], unique: boolean): DDLResult {
    const idxName = this.quoteIdentifier(indexName)
    const tblName = this.quoteIdentifier(tableName)
    return {
      ddl: `CREATE ${unique ? 'UNIQUE' : ''} INDEX ${idxName} ON ${tblName} (${columns.map(c => this.quoteIdentifier(c)).join(', ')})`,
      warnings: [],
    }
  }
}
