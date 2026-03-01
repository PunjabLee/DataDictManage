import { DatabaseDialect, EntitySnapshot, FieldSnapshot } from './sql-engine'
import { FieldBaseType } from '../domain/model/model-types'

/**
 * MySQL 8.0 方言实现
 * GoF: Strategy Pattern — 具体策略
 */
export class MySQLDialect implements DatabaseDialect {
  readonly dbType = 'MYSQL'
  readonly displayName = 'MySQL 8.0'

  mapDataType(baseType: FieldBaseType, length?: number, precision?: number, scale?: number): string {
    switch (baseType) {
      case FieldBaseType.STRING:   return `VARCHAR(${length ?? 255})`
      case FieldBaseType.INTEGER:  return 'BIGINT'
      case FieldBaseType.DECIMAL:  return `DECIMAL(${precision ?? 18},${scale ?? 4})`
      case FieldBaseType.BOOLEAN:  return 'TINYINT(1)'
      case FieldBaseType.DATE:     return 'DATE'
      case FieldBaseType.DATETIME: return 'DATETIME(3)'
      case FieldBaseType.TEXT:     return 'LONGTEXT'
      case FieldBaseType.BLOB:     return 'LONGBLOB'
      case FieldBaseType.JSON:     return 'JSON'
      default: return 'VARCHAR(255)'
    }
  }

  generateCreateTable(entity: EntitySnapshot): string {
    const lines: string[] = []
    const pks = entity.fields.filter(f => f.primaryKey)

    lines.push(`CREATE TABLE \`${entity.name}\` (`)

    entity.fields.forEach((field, idx) => {
      const isLast = idx === entity.fields.length - 1 && pks.length === 0
      lines.push(`  ${this.fieldLine(field)}${isLast ? '' : ','}`)
    })

    if (pks.length > 0) {
      lines.push(`  PRIMARY KEY (${pks.map(f => `\`${f.name}\``).join(', ')})`)
    }

    lines.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci${entity.comment ? ` COMMENT='${entity.comment}'` : ''};`)
    return lines.join('\n')
  }

  generateAlterColumn(entityName: string, _old: FieldSnapshot, newField: FieldSnapshot): string {
    return `ALTER TABLE \`${entityName}\` MODIFY COLUMN ${this.fieldLine(newField)};`
  }

  generateAddColumn(entityName: string, field: FieldSnapshot): string {
    return `ALTER TABLE \`${entityName}\` ADD COLUMN ${this.fieldLine(field)};`
  }

  generateDropColumn(entityName: string, fieldName: string): string {
    return `ALTER TABLE \`${entityName}\` DROP COLUMN \`${fieldName}\`;`
  }

  private fieldLine(f: FieldSnapshot): string {
    const type = this.mapDataType(f.baseType, f.length, f.precision, f.scale)
    const parts = [`\`${f.name}\``, type]
    if (!f.nullable) parts.push('NOT NULL')
    if (f.autoIncrement) parts.push('AUTO_INCREMENT')
    if (f.defaultValue !== undefined) parts.push(`DEFAULT '${f.defaultValue}'`)
    if (f.comment) parts.push(`COMMENT '${f.comment}'`)
    return parts.join(' ')
  }
}

/**
 * Oracle 方言实现
 */
export class OracleDialect implements DatabaseDialect {
  readonly dbType = 'ORACLE'
  readonly displayName = 'Oracle 19c'

  mapDataType(baseType: FieldBaseType, length?: number, precision?: number, scale?: number): string {
    switch (baseType) {
      case FieldBaseType.STRING:   return `VARCHAR2(${length ?? 255})`
      case FieldBaseType.INTEGER:  return 'NUMBER(19)'
      case FieldBaseType.DECIMAL:  return `NUMBER(${precision ?? 18},${scale ?? 4})`
      case FieldBaseType.BOOLEAN:  return 'NUMBER(1)'
      case FieldBaseType.DATE:     return 'DATE'
      case FieldBaseType.DATETIME: return 'TIMESTAMP(3)'
      case FieldBaseType.TEXT:     return 'CLOB'
      case FieldBaseType.BLOB:     return 'BLOB'
      case FieldBaseType.JSON:     return 'CLOB'
      default: return 'VARCHAR2(255)'
    }
  }

  generateCreateTable(entity: EntitySnapshot): string {
    const lines: string[] = []
    lines.push(`-- ${entity.comment}`)
    lines.push(`CREATE TABLE "${entity.name.toUpperCase()}" (`)
    entity.fields.forEach((field, idx) => {
      const isLast = idx === entity.fields.length - 1
      const type = this.mapDataType(field.baseType, field.length, field.precision, field.scale)
      const notNull = !field.nullable ? ' NOT NULL' : ''
      lines.push(`  "${field.name.toUpperCase()}" ${type}${notNull}${isLast ? '' : ','}`)
    })
    lines.push(');')
    const pks = entity.fields.filter(f => f.primaryKey)
    if (pks.length > 0) {
      lines.push(`ALTER TABLE "${entity.name.toUpperCase()}" ADD PRIMARY KEY (${pks.map(f => `"${f.name.toUpperCase()}"`).join(', ')});`)
    }
    return lines.join('\n')
  }

  generateAlterColumn(entityName: string, _old: FieldSnapshot, newField: FieldSnapshot): string {
    const type = this.mapDataType(newField.baseType, newField.length, newField.precision, newField.scale)
    return `ALTER TABLE "${entityName.toUpperCase()}" MODIFY "${newField.name.toUpperCase()}" ${type};`
  }

  generateAddColumn(entityName: string, field: FieldSnapshot): string {
    const type = this.mapDataType(field.baseType, field.length, field.precision, field.scale)
    return `ALTER TABLE "${entityName.toUpperCase()}" ADD "${field.name.toUpperCase()}" ${type};`
  }

  generateDropColumn(entityName: string, fieldName: string): string {
    return `ALTER TABLE "${entityName.toUpperCase()}" DROP COLUMN "${fieldName.toUpperCase()}";`
  }
}

/**
 * 达梦数据库（DM8）方言 — 信创适配
 * 达梦高度兼容 Oracle 语法
 */
export class DaMengDialect extends OracleDialect {
  override readonly dbType = 'DAMENG'
  override readonly displayName = '达梦 DM8（信创）'

  override mapDataType(baseType: FieldBaseType, length?: number, precision?: number, scale?: number): string {
    // 达梦对 JSON 有原生支持
    if (baseType === FieldBaseType.JSON) return 'JSON'
    return super.mapDataType(baseType, length, precision, scale)
  }
}

/**
 * 金仓（KingbaseES）方言 — 信创适配
 * 金仓基于 PostgreSQL 内核，兼容 PG 语法
 */
export class KingbaseDialect implements DatabaseDialect {
  readonly dbType = 'KINGBASE'
  readonly displayName = '金仓 KingbaseES（信创）'

  mapDataType(baseType: FieldBaseType, length?: number, precision?: number, scale?: number): string {
    switch (baseType) {
      case FieldBaseType.STRING:   return `VARCHAR(${length ?? 255})`
      case FieldBaseType.INTEGER:  return 'BIGINT'
      case FieldBaseType.DECIMAL:  return `NUMERIC(${precision ?? 18},${scale ?? 4})`
      case FieldBaseType.BOOLEAN:  return 'BOOLEAN'
      case FieldBaseType.DATE:     return 'DATE'
      case FieldBaseType.DATETIME: return 'TIMESTAMP(3)'
      case FieldBaseType.TEXT:     return 'TEXT'
      case FieldBaseType.BLOB:     return 'BYTEA'
      case FieldBaseType.JSON:     return 'JSONB'
      default: return 'VARCHAR(255)'
    }
  }

  generateCreateTable(entity: EntitySnapshot): string {
    const lines: string[] = []
    lines.push(`-- ${entity.comment}`)
    lines.push(`CREATE TABLE "${entity.name}" (`)
    const pks = entity.fields.filter(f => f.primaryKey)
    entity.fields.forEach((field, idx) => {
      const isLast = idx === entity.fields.length - 1 && pks.length === 0
      const type = this.mapDataType(field.baseType, field.length, field.precision, field.scale)
      const notNull = !field.nullable ? ' NOT NULL' : ''
      lines.push(`  "${field.name}" ${type}${notNull}${isLast ? '' : ','}`)
    })
    if (pks.length > 0) {
      lines.push(`  PRIMARY KEY (${pks.map(f => `"${f.name}"`).join(', ')})`)
    }
    lines.push(`);`)
    if (entity.comment) {
      lines.push(`COMMENT ON TABLE "${entity.name}" IS '${entity.comment}';`)
    }
    return lines.join('\n')
  }

  generateAlterColumn(entityName: string, _old: FieldSnapshot, newField: FieldSnapshot): string {
    const type = this.mapDataType(newField.baseType, newField.length, newField.precision, newField.scale)
    return `ALTER TABLE "${entityName}" ALTER COLUMN "${newField.name}" TYPE ${type};`
  }

  generateAddColumn(entityName: string, field: FieldSnapshot): string {
    const type = this.mapDataType(field.baseType, field.length, field.precision, field.scale)
    return `ALTER TABLE "${entityName}" ADD COLUMN "${field.name}" ${type};`
  }

  generateDropColumn(entityName: string, fieldName: string): string {
    return `ALTER TABLE "${entityName}" DROP COLUMN "${fieldName}";`
  }
}
