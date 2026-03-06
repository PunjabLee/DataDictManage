/**
 * @file db-connector.ts
 * @description 数据库直连服务
 * @layer core-engine — Infrastructure Service
 *
 * 支持从数据库逆向读取表结构
 * 支持模型与数据库的双向同步
 *
 * @module @ddm/core-engine
 */

import { Entity } from '../domain/model/entity'
import { Field, FieldBaseType } from '../domain/model/field'

// ── 连接配置 ─────────────────────────────────────────────────

export interface DbConnectionConfig {
  /** 数据库类型 */
  dbType: DbType
  /** 主机 */
  host: string
  /** 端口 */
  port: number
  /** 数据库名 */
  database: string
  /** 用户名 */
  username: string
  /** 密码 */
  password: string
  /** Schema (Oracle/PostgreSQL 用) */
  schema?: string
}

export type DbType = 'MYSQL' | 'POSTGRESQL' | 'ORACLE' | 'SQLSERVER' | 'SQLITE' | 'DAMENG' | 'KINGBASE' | 'OCEANBASE'

// ── 表结构元数据 ─────────────────────────────────────────────────

export interface TableMeta {
  name: string
  comment: string
  columns: ColumnMeta[]
  primaryKeys: string[]
  indexes: IndexMeta[]
}

export interface ColumnMeta {
  name: string
  type: string
  nullable: boolean
  defaultValue: string | null
  comment: string
  autoIncrement: boolean
}

export interface IndexMeta {
  name: string
  columns: string[]
  unique: boolean
}

export interface DiffResult {
  /** 仅在模型中存在的表 */
  modelOnly: { tables: string[], fields: Record<string, string[]> }
  /** 仅在数据库中存在的表 */
  dbOnly: { tables: string[], fields: Record<string, string[]> }
  /** 两边都存在但定义不同的 */
  different: { tables: { name: string, fieldDiffs: FieldDiff[] }[] }
}

export interface FieldDiff {
  fieldName: string
  modelType: string
  dbType: string
  modelNullable: boolean
  dbNullable: boolean
}

// ── 连接器抽象 ─────────────────────────────────────────────────

export interface IDbConnector {
  /** 连接数据库 */
  connect(config: DbConnectionConfig): Promise<void>
  
  /** 断开连接 */
  disconnect(): Promise<void>
  
  /** 获取所有表 */
  getTables(): Promise<TableMeta[]>
  
  /** 获取表DDL */
  getTableDDL(tableName: string): Promise<string>
}

// ── MySQL 连接器实现 ─────────────────────────────────────────────────

export class MySqlConnector implements IDbConnector {
  private config!: DbConnectionConfig

  async connect(config: DbConnectionConfig): Promise<void> {
    this.config = config
    // Phase 1: 模拟连接（实际需要 mysql2 驱动）
    console.log(`[DB] 连接 MySQL: ${config.host}:${config.port}/${config.database}`)
  }

  async disconnect(): Promise<void> {
    console.log('[DB] MySQL 连接已关闭')
  }

  async getTables(): Promise<TableMeta[]> {
    // 模拟返回表结构
    return [
      {
        name: 'users',
        comment: '用户表',
        columns: [
          { name: 'id', type: 'bigint', nullable: false, defaultValue: null, comment: '主键ID', autoIncrement: true },
          { name: 'username', type: 'varchar(64)', nullable: false, defaultValue: null, comment: '用户名', autoIncrement: false },
          { name: 'email', type: 'varchar(128)', nullable: true, defaultValue: null, comment: '邮箱', autoIncrement: false },
          { name: 'created_at', type: 'datetime', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', comment: '创建时间', autoIncrement: false },
        ],
        primaryKeys: ['id'],
        indexes: [
          { name: 'idx_username', columns: ['username'], unique: true },
        ]
      }
    ]
  }

  async getTableDDL(tableName: string): Promise<string> {
    return `-- DDL for ${tableName}\nCREATE TABLE ${tableName} (...);`
  }
}

// ── PostgreSQL 连接器 ─────────────────────────────────────────────────

export class PostgresConnector implements IDbConnector {
  private config!: DbConnectionConfig

  async connect(config: DbConnectionConfig): Promise<void> {
    this.config = config
    console.log(`[DB] 连接 PostgreSQL: ${config.host}:${config.port}/${config.database}`)
  }

  async disconnect(): Promise<void> {}

  async getTables(): Promise<TableMeta[]> {
    return []
  }

  async getTableDDL(tableName: string): Promise<string> {
    return ''
  }
}

// ── Oracle 连接器 ─────────────────────────────────────────────────

export class OracleConnector implements IDbConnector {
  private config!: DbConnectionConfig

  async connect(config: DbConnectionConfig): Promise<void> {
    this.config = config
    console.log(`[DB] 连接 Oracle: ${config.host}:${config.port}/${config.schema}`)
  }

  async disconnect(): Promise<void> {}

  async getTables(): Promise<TableMeta[]> {
    return []
  }

  async getTableDDL(tableName: string): Promise<string> {
    return ''
  }
}

// ── 连接器工厂 ─────────────────────────────────────────────────

export class DbConnectorFactory {

  static create(dbType: DbType): IDbConnector {
    switch (dbType) {
      case 'MYSQL':
      case 'OCEANBASE':
        return new MySqlConnector()
      case 'POSTGRESQL':
        return new PostgresConnector()
      case 'ORACLE':
        return new OracleConnector()
      default:
        throw new Error(`不支持的数据库类型: ${dbType}`)
    }
  }
}

// ── 数据库同步服务 ─────────────────────────────────────────────────

export class DbSyncService {

  private connector: IDbConnector | null = null

  /**
   * 连接数据库
   */
  async connect(config: DbConnectionConfig): Promise<void> {
    this.connector = DbConnectorFactory.create(config.dbType)
    await this.connector.connect(config)
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    if (this.connector) {
      await this.connector.disconnect()
      this.connector = null
    }
  }

  /**
   * 从数据库逆向导入模型
   */
  async reverseToModel(): Promise<Entity[]> {
    if (!this.connector) {
      throw new Error('请先连接数据库')
    }

    const tables = await this.connector.getTables()
    return tables.map(table => this.tableMetaToEntity(table))
  }

  /**
   * 对比模型与数据库差异
   */
  async diff(modelEntities: Entity[], dbTables: TableMeta[]): Promise<DiffResult> {
    const modelTableNames = new Set(modelEntities.map(e => e.name))
    const dbTableNames = new Set(dbTables.map(t => t.name))

    // 仅在模型中
    const modelOnly = {
      tables: dbTables.filter(t => !modelTableNames.has(t.name)).map(t => t.name),
      fields: {}
    }

    // 仅在数据库中
    const dbOnly = {
      tables: modelEntities.filter(e => !dbTableNames.has(e.name)).map(e => e.name),
      fields: {}
    }

    // 定义不同
    const different = {
      tables: [] as { name: string, fieldDiffs: FieldDiff[] }[]
    }

    return { modelOnly, dbOnly, different }
  }

  /**
   * 生成同步 DDL
   */
  async generateSyncDDL(modelEntities: Entity[], direction: 'toDb' | 'toModel'): Promise<string> {
    // Phase 1: 返回模拟 DDL
    return '-- 同步 DDL 待实现'
  }

  // ── 私有方法 ─────────────────────────────────────────────

  private tableMetaToEntity(table: TableMeta): Entity {
    const entity = Entity.create(table.name, table.comment)

    for (const col of table.columns) {
      const field = Field.builder()
        .name(col.name)
        .comment(col.comment)
        .baseType(this.mapDbTypeToBaseType(col.type))
        .nullable(col.nullable)
        .primaryKey(table.primaryKeys.includes(col.name))
        .autoIncrement(col.autoIncrement)
        .defaultValue(col.defaultValue || undefined)
        .build()

      entity.addField(field)
    }

    return entity
  }

  private mapDbTypeToBaseType(dbType: string): FieldBaseType {
    const type = dbType.toUpperCase()
    if (type.includes('INT')) return FieldBaseType.INTEGER
    if (type.includes('VARCHAR') || type.includes('CHAR')) return FieldBaseType.STRING
    if (type.includes('DECIMAL') || type.includes('NUMERIC')) return FieldBaseType.DECIMAL
    if (type.includes('DATE') && type.includes('TIME')) return FieldBaseType.DATETIME
    if (type.includes('DATE')) return FieldBaseType.DATE
    if (type.includes('BOOL')) return FieldBaseType.BOOLEAN
    if (type.includes('TEXT') || type.includes('CLOB')) return FieldBaseType.TEXT
    if (type.includes('BLOB')) return FieldBaseType.BLOB
    return FieldBaseType.STRING
  }
}

export default DbSyncService
