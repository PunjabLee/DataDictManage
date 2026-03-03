/**
 * @file modeling-service.ts
 * @description 建模服务 CE 版本入口 — 供桌面端 in-process 调用
 * @layer Desktop CE — Service Layer
 *
 * 职责：
 *   - 创建 InMemory 仓储（CE 版本不使用真实数据库）
 *   - 初始化 ModelingAppService
 *   - 封装简化调用接口供 renderer 调用
 *
 * @module @ddm/desktop-ce
 */

import {
  ModelingAppService,
  SqlEnginePort,
  DomainEventPublisher,
} from '@ddm/core-engine'
import {
  ModelRepository,
  Model,
  ModelId,
} from '@ddm/core-engine'
import {
  CreateModelCommand,
  AddEntityCommand,
  AddFieldCommand,
  ModifyFieldCommand,
  GenerateDDLCommand,
  ModelDetailDTO,
  ModelListDTO,
  DDLResultDTO,
} from '@ddm/core-engine'
import { Result } from '@ddm/core-engine'

// ── 内存仓储实现（CE 版本使用） ─────────────────────────────────────────

/**
 * 内存模型仓储（CE 版本）
 * 使用 Map 存储，支持基本的 CRUD 操作
 */
class InMemoryModelRepository implements ModelRepository {
  private models = new Map<string, Model>()
  private projectIndex = new Map<string, Set<string>>()

  async save(model: Model): Promise<void> {
    this.models.set(model.id.value, model)
    const projectModels = this.projectIndex.get(model.projectId.value) ?? new Set()
    projectModels.add(model.id.value)
    this.projectIndex.set(model.projectId.value, projectModels)
  }

  async findById(id: ModelId): Promise<Model | null> {
    return this.models.get(id.value) ?? null
  }

  async findByProjectId(projectId: import('@ddm/core-engine').ProjectId): Promise<Model[]> {
    const ids = this.projectIndex.get(projectId.value) ?? new Set()
    return Array.from(ids).map(id => this.models.get(id)!).filter(Boolean)
  }

  async delete(id: ModelId): Promise<void> {
    const model = this.models.get(id.value)
    if (model) {
      const projectModels = this.projectIndex.get(model.projectId.value)
      projectModels?.delete(id.value)
      this.models.delete(id.value)
    }
  }

  async saveSnapshot(
    modelId: ModelId,
    branchId: import('@ddm/core-engine').BranchId,
    snapshot: import('@ddm/core-engine').ModelSnapshot,
  ): Promise<string> {
    // CE 版本快照存储到 localStorage（简化实现）
    const key = `ddm-snapshot-${modelId.value}-${Date.now()}`
    const snapshots = this.getSnapshots(modelId.value)
    snapshots.push({ key, snapshot, createdAt: new Date().toISOString() })
    localStorage.setItem('ddm-snapshots', JSON.stringify(snapshots))
    return key
  }

  async findSnapshots(modelId: string): Promise<Array<{ key: string; snapshot: import('@ddm/core-engine').ModelSnapshot; createdAt: string }>> {
    return this.getSnapshots(modelId)
  }

  private getSnapshots(modelId: string): Array<{ key: string; snapshot: import('@ddm/core-engine').ModelSnapshot; createdAt: string }> {
    try {
      const data = localStorage.getItem('ddm-snapshots')
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }
}

// ── SQL 引擎实现 ───────────────────────────────────────────────────────

/**
 * SQL 引擎端口实现
 * 使用 @ddm/db-dialect 真实方言
 */
import { DialectRegistry } from '@ddm/db-dialect'

class LocalSqlEngine implements SqlEnginePort {
  generateCreateTable(entity: import('@ddm/core-engine').Entity, dbType: string): string {
    const dialect = DialectRegistry.get(dbType.toUpperCase())
    if (dialect) {
      return dialect.generateCreateTable(entity)
    }
    
    // Fallback: 简单实现
    const lines = [`CREATE TABLE ${entity.name} (`]
    const fields: string[] = []

    for (const field of entity.fields) {
      let typeStr = this.mapType(field.dataType.baseType, field.dataType.length, dbType)
      if (!field.nullable) typeStr += ' NOT NULL'
      if (field.primaryKey) typeStr += ' PRIMARY KEY'
      if (field.autoIncrement && ['MYSQL', 'ORACLE'].includes(dbType.toUpperCase())) typeStr += ' AUTO_INCREMENT'
      fields.push(`  ${this.quoteName(entity.name, dbType)}.${this.quoteName(field.name, dbType)} ${typeStr}`)
    }

    lines.push(fields.join(',\n'))
    lines.push(');')
    return lines.join('\n')
  }

  generateDiffDDL(diffs: import('@ddm/core-engine').ModelDiffResult, dbType: string): string {
    const dialect = DialectRegistry.get(dbType.toUpperCase())
    if (dialect && 'generateDiffDDL' in dialect) {
      return (dialect as any).generateDiffDDL(diffs)
    }
    return `-- Diff not implemented for ${dbType}`
  }

  private mapType(baseType: string, length: number | undefined, dbType: string): string {
    const typeMap: Record<string, Record<string, string>> = {
      STRING: { mysql: 'VARCHAR', oracle: 'VARCHAR2', postgres: 'VARCHAR', dameng: 'VARCHAR', kingbase: 'VARCHAR' },
      INT: { mysql: 'INT', oracle: 'NUMBER', postgres: 'INT', dameng: 'INTEGER', kingbase: 'INTEGER' },
      BIGINT: { mysql: 'BIGINT', oracle: 'NUMBER(19)', postgres: 'BIGINT', dameng: 'BIGINT', kingbase: 'BIGINT' },
      DECIMAL: { mysql: 'DECIMAL', oracle: 'NUMBER', postgres: 'DECIMAL', dameng: 'DECIMAL', kingbase: 'NUMERIC' },
      DATETIME: { mysql: 'DATETIME', oracle: 'TIMESTAMP', postgres: 'TIMESTAMP', dameng: 'TIMESTAMP', kingbase: 'TIMESTAMP' },
      TEXT: { mysql: 'TEXT', oracle: 'CLOB', postgres: 'TEXT', dameng: 'TEXT', kingbase: 'TEXT' },
    }

    const mapping = typeMap[baseType] ?? {}
    const type = mapping[dbType.toLowerCase()] ?? 'VARCHAR(255)'

    if (baseType === 'STRING' && length) return `${type}(${length})`
    if (baseType === 'DECIMAL') return `${type}`
    return type
  }

  private quoteName(name: string, dbType: string): string {
    const upper = dbType.toUpperCase()
    if (['MYSQL', 'CLICKHOUSE'].includes(upper)) return `\`${name}\``
    if (['ORACLE', 'DAMENG', 'KINGBASE', 'SQLSERVER'].includes(upper)) return `"${name}"`
    return `"${name}"`
  }
}

// ── 单例服务实例 ─────────────────────────────────────────────────────────

let modelingServiceInstance: ModelingService | null = null

/**
 * 获取建模服务单例
 */
export function getModelingService(): ModelingService {
  if (!modelingServiceInstance) {
    const repository = new InMemoryModelRepository()
    const sqlEngine = new LocalSqlEngine()
    const appService = new ModelingAppService(repository, {} as any, sqlEngine)
    modelingServiceInstance = new ModelingService(appService)
  }
  return modelingServiceInstance!
}

// ── 简化调用接口 ─────────────────────────────────────────────────────────

/**
 * 建模服务简化接口
 * 封装 ModelingAppService 的调用，简化前端使用
 */
export class ModelingService {
  constructor(private readonly appService: ModelingAppService) {}

  /**
   * 创建模型
   */
  async createModel(cmd: Omit<CreateModelCommand, 'operatorId'> & { operatorId?: string }): Promise<ModelListDTO> {
    const result = await this.appService.createModel({
      ...cmd,
      operatorId: cmd.operatorId ?? 'local',
    } as CreateModelCommand)
    if (result.isFailure) throw new Error(result.error)
    return result.value
  }

  /**
   * 获取模型详情
   */
  async getModelDetail(modelId: string): Promise<ModelDetailDTO> {
    const result = await this.appService.getModelDetail(modelId)
    if (result.isFailure) throw new Error(result.error)
    return result.value
  }

  /**
   * 列出项目下所有模型
   */
  async listModels(projectId: string): Promise<ModelListDTO[]> {
    const result = await this.appService.listModelsByProject(projectId)
    if (result.isFailure) throw new Error(result.error)
    return result.value
  }

  /**
   * 添加实体（表）
   */
  async addEntity(cmd: { modelId: string; name: string; comment?: string } & { operatorId?: string }): Promise<ModelDetailDTO> {
    const result = await this.appService.addEntity({
      ...cmd,
      operatorId: cmd.operatorId ?? 'local',
    } as AddEntityCommand)
    if (result.isFailure) throw new Error(result.error)
    return result.value
  }

  /**
   * 删除实体
   */
  async removeEntity(modelId: string, entityId: string): Promise<void> {
    const result = await this.appService.removeEntity(modelId, entityId, 'local')
    if (result.isFailure) throw new Error(result.error)
  }

  /**
   * 添加字段
   */
  async addField(cmd: Omit<AddFieldCommand, 'modelId' | 'operatorId'> & { modelId: string; entityId: string }): Promise<ModelDetailDTO> {
    const result = await this.appService.addField({
      ...cmd,
      operatorId: 'local',
    } as AddFieldCommand)
    if (result.isFailure) throw new Error(result.error)
    return result.value
  }

  /**
   * 修改字段
   */
  async modifyField(cmd: Omit<ModifyFieldCommand, 'modelId' | 'operatorId'> & { modelId: string; entityId: string }): Promise<ModelDetailDTO> {
    const result = await this.appService.modifyField({
      ...cmd,
      operatorId: 'local',
    } as ModifyFieldCommand)
    if (result.isFailure) throw new Error(result.error)
    return result.value
  }

  /**
   * 删除字段
   */
  async removeField(modelId: string, entityId: string, fieldId: string): Promise<void> {
    const result = await this.appService.removeField(modelId, entityId, fieldId)
    if (result.isFailure) throw new Error(result.error)
  }

  /**
   * 生成 DDL
   */
  async generateDDL(modelId: string, dbType: string = 'MYSQL'): Promise<DDLResultDTO> {
    const result = await this.appService.generateDDL({ modelId, dbType } as GenerateDDLCommand)
    if (result.isFailure) throw new Error(result.error)
    return result.value
  }
}
