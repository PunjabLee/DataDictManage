import { FieldBaseType } from '../domain/model/model-types'

/**
 * 数据库方言接口
 * GoF: Strategy Pattern — 不同数据库 DDL 语法封装为独立策略
 * 防腐层（ACL）的一部分，隔离具体数据库实现
 */
export interface DatabaseDialect {
  readonly dbType: string
  readonly displayName: string

  /** 生成建表 DDL */
  generateCreateTable(entity: EntitySnapshot): string

  /** 生成 ALTER TABLE 修改列 DDL */
  generateAlterColumn(entityName: string, oldField: FieldSnapshot, newField: FieldSnapshot): string

  /** 生成新增列 DDL */
  generateAddColumn(entityName: string, field: FieldSnapshot): string

  /** 生成删除列 DDL */
  generateDropColumn(entityName: string, fieldName: string): string

  /** 将抽象数据类型映射为该数据库的具体类型 */
  mapDataType(baseType: FieldBaseType, length?: number, precision?: number, scale?: number): string
}

export interface EntitySnapshot {
  name: string
  comment: string
  fields: FieldSnapshot[]
}

export interface FieldSnapshot {
  name: string
  baseType: FieldBaseType
  length?: number
  precision?: number
  scale?: number
  nullable: boolean
  primaryKey: boolean
  unique: boolean
  autoIncrement: boolean
  defaultValue?: string
  comment: string
}

/**
 * SQL 引擎（上下文）
 * GoF: Strategy Pattern Context — 根据数据库类型动态选择方言
 */
export class SqlEngine {
  private readonly dialects: Map<string, DatabaseDialect> = new Map()

  registerDialect(dialect: DatabaseDialect): void {
    this.dialects.set(dialect.dbType, dialect)
  }

  getDialect(dbType: string): DatabaseDialect {
    const dialect = this.dialects.get(dbType)
    if (!dialect) throw new Error(`不支持的数据库类型: ${dbType}，已注册: ${[...this.dialects.keys()].join(', ')}`)
    return dialect
  }

  getSupportedDatabases(): string[] {
    return [...this.dialects.keys()]
  }

  generateCreateTable(entity: EntitySnapshot, dbType: string): string {
    return this.getDialect(dbType).generateCreateTable(entity)
  }

  generateDiffDDL(
    diffs: import('../domain/model/model-diff.service').ModelDiffResult,
    dbType: string,
  ): string {
    const dialect = this.getDialect(dbType)
    const lines: string[] = []
    lines.push(`-- DDM 自动生成增量 DDL（目标数据库: ${dialect.displayName}）`)
    lines.push(`-- 生成时间: ${new Date().toISOString()}`)
    lines.push('')

    for (const entity of diffs.addedEntities) {
      const snap = entity.toSnapshot() as EntitySnapshot
      lines.push(dialect.generateCreateTable(snap))
      lines.push('')
    }

    for (const diff of diffs.modifiedEntities) {
      for (const field of diff.addedFields) {
        const snap = field as unknown as FieldSnapshot
        lines.push(dialect.generateAddColumn(diff.entityName, snap))
      }
      for (const field of diff.removedFields) {
        lines.push(dialect.generateDropColumn(diff.entityName, field.name))
      }
    }

    return lines.join('\n')
  }
}
