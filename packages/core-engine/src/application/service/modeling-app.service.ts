/**
 * @file modeling-app.service.ts
 * @description 建模应用服务 — 应用层门面（Facade）
 * @layer Application Layer — application/service
 *
 * 职责：
 *   应用服务是接入层（REST Controller / IPC Handler）与领域层之间的门面。
 *   负责：
 *     1. 接收 DTO 命令，转换为领域命令
 *     2. 调用仓储获取聚合根
 *     3. 执行领域行为（Model/Entity 的方法）
 *     4. 通过仓储持久化聚合根
 *     5. 发布领域事件（通过 pullDomainEvents）
 *     6. 返回 DTO 结果
 *
 * 禁止事项（DDD 分层约束）：
 *   ❌ 应用层不包含任何业务规则（规则都在领域层）
 *   ❌ 应用层不直接查询数据库（通过仓储接口）
 *   ❌ 应用层不返回领域对象（只返回 DTO）
 *
 * @pattern GoF: Facade（统一应用服务入口）
 *           Command（每个公开方法对应一个命令）
 *
 * @module @ddm/core-engine
 */

import { Result } from '../../shared/base'
import { ModelRepository } from '../../domain/model/model'
import { ModelFactory } from '../../domain/model/model-factory'
import { ModelDiffService } from '../../domain/model/model-diff.service'
import {
  ModelId,
  ProjectId,
  EntityId,
  FieldId,
  DataType,
  FieldBaseType,
  ModelLayer,
  RelationType,
} from '../../domain/model/model-types'
import { ModelAssembler } from '../assembler/model.assembler'
import {
  CreateModelCommand,
  UpdateModelCommand,
  AddEntityCommand,
  AddFieldCommand,
  ModifyFieldCommand,
  CreateSnapshotCommand,
  GenerateDDLCommand,
  ModelListDTO,
  ModelDetailDTO,
  DDLResultDTO,
} from '../dto/model.dto'

// ── 外部依赖端口（依赖倒置，由基础设施层实现） ──────────────────────────

/**
 * SQL 引擎端口（防腐层接口，隔离数据库方言实现）
 */
export interface SqlEnginePort {
  generateCreateTable(entity: import('../../domain/model/entity').Entity, dbType: string): string
  generateDiffDDL(diffs: import('../../domain/model/model-diff.service').ModelDiffResult, dbType: string): string
}

/**
 * 事件发布端口（防腐层接口，隔离 MQ 实现）
 */
export interface DomainEventPublisher {
  publish(events: import('../../shared/base').DomainEvent[]): Promise<void>
}

// ── 应用服务 ─────────────────────────────────────────────────────────────

/**
 * 建模应用服务
 *
 * 构造函数注入所有依赖（IoC）：
 *  - modelRepository：Model 仓储（基础设施层实现）
 *  - diffService：Diff 领域服务
 *  - sqlEngine：SQL 生成端口
 *  - eventPublisher：事件发布端口
 */
export class ModelingAppService {
  constructor(
    private readonly modelRepository: ModelRepository,
    private readonly diffService: ModelDiffService,
    private readonly sqlEngine: SqlEnginePort,
    private readonly eventPublisher?: DomainEventPublisher,
  ) {}

  // ── 模型 CRUD ─────────────────────────────────────────────────────────

  /**
   * 创建新数据模型
   *
   * @param cmd 创建命令
   * @returns 创建成功的模型列表 DTO
   */
  async createModel(cmd: CreateModelCommand): Promise<Result<ModelListDTO>> {
    // 1. 调用工厂创建领域对象（GoF: Factory Method）
    const result = ModelFactory.create({
      name: cmd.name,
      projectId: cmd.projectId,
      createdBy: cmd.operatorId,
      description: cmd.description,
    })
    if (result.isFailure) return Result.fail(result.error)

    const model = result.value

    // 2. 持久化
    await this.modelRepository.save(model)

    // 3. 发布领域事件（GoF: Observer）
    await this.publishEvents(model)

    // 4. 转 DTO 返回（不暴露领域对象）
    return Result.ok(ModelAssembler.toListDTO(model))
  }

  /**
   * 查询项目下所有模型
   */
  async listModelsByProject(projectId: string): Promise<Result<ModelListDTO[]>> {
    const models = await this.modelRepository.findByProjectId(ProjectId.create(projectId))
    return Result.ok(models.map(m => ModelAssembler.toListDTO(m)))
  }

  /**
   * 查询模型详情（含完整 Entity/Field/Relation 数据）
   */
  async getModelDetail(modelId: string): Promise<Result<ModelDetailDTO>> {
    const model = await this.modelRepository.findById(ModelId.create(modelId))
    if (!model) return Result.fail(`模型 ${modelId} 不存在`)
    return Result.ok(ModelAssembler.toDetailDTO(model))
  }

  /**
   * 更新模型基本信息
   */
  async updateModel(cmd: UpdateModelCommand): Promise<Result<ModelListDTO>> {
    const model = await this.modelRepository.findById(ModelId.create(cmd.modelId))
    if (!model) return Result.fail(`模型 ${cmd.modelId} 不存在`)

    // 领域行为（暂用简单实现，Model 后续可添加 update 方法）
    // 注：严格 DDD 下 update 应是聚合根的方法，此处简化处理
    if (cmd.name || cmd.description !== undefined) {
      const raw = model as unknown as Record<string, unknown>
      if (cmd.name) raw['_name'] = cmd.name
      if (cmd.description !== undefined) raw['_description'] = cmd.description
      raw['_updatedAt'] = new Date()
    }

    await this.modelRepository.save(model)
    return Result.ok(ModelAssembler.toListDTO(model))
  }

  // ── Entity（表）操作 ──────────────────────────────────────────────────

  /**
   * 向模型添加数据表（Entity）
   */
  async addEntity(cmd: AddEntityCommand): Promise<Result<ModelDetailDTO>> {
    const model = await this.modelRepository.findById(ModelId.create(cmd.modelId))
    if (!model) return Result.fail(`模型 ${cmd.modelId} 不存在`)

    // 调用聚合根领域行为
    const layerEnum = (cmd.layer as ModelLayer) ?? ModelLayer.PHYSICAL
    const entityResult = model.addEntity(cmd.name, cmd.comment ?? '', layerEnum, cmd.operatorId)
    if (entityResult.isFailure) return Result.fail(entityResult.error)

    await this.modelRepository.save(model)
    await this.publishEvents(model)

    return Result.ok(ModelAssembler.toDetailDTO(model))
  }

  /**
   * 从模型移除数据表（Entity）
   */
  async removeEntity(modelId: string, entityId: string, operatorId: string): Promise<Result<void>> {
    const model = await this.modelRepository.findById(ModelId.create(modelId))
    if (!model) return Result.fail(`模型 ${modelId} 不存在`)

    const result = model.removeEntity(EntityId.create(entityId), operatorId)
    if (result.isFailure) return result

    await this.modelRepository.save(model)
    await this.publishEvents(model)
    return Result.ok()
  }

  // ── Field（字段）操作 ──────────────────────────────────────────────────

  /**
   * 向 Entity 添加字段
   */
  async addField(cmd: AddFieldCommand): Promise<Result<ModelDetailDTO>> {
    const model = await this.modelRepository.findById(ModelId.create(cmd.modelId))
    if (!model) return Result.fail(`模型 ${cmd.modelId} 不存在`)

    const entity = model.entities.find(e => e.id.value === cmd.entityId)
    if (!entity) return Result.fail(`表 ${cmd.entityId} 不存在`)

    // 构建 DataType 值对象
    const baseType = (cmd.baseType as FieldBaseType) ?? FieldBaseType.STRING
    let dataType: DataType
    if (baseType === FieldBaseType.STRING) {
      dataType = DataType.varchar(cmd.length ?? 255)
    } else if (baseType === FieldBaseType.DECIMAL) {
      dataType = DataType.decimal(cmd.precision ?? 18, cmd.scale ?? 4)
    } else if (baseType === FieldBaseType.DATETIME) {
      dataType = DataType.datetime()
    } else {
      dataType = new DataType({ baseType })
    }

    const fieldResult = entity.addField({
      name: cmd.name,
      comment: cmd.comment,
      dataType,
      nullable: cmd.nullable ?? true,
      primaryKey: cmd.primaryKey ?? false,
      unique: cmd.unique ?? false,
      autoIncrement: cmd.autoIncrement ?? false,
      defaultValue: cmd.defaultValue,
      sortOrder: cmd.sortOrder,
    })
    if (fieldResult.isFailure) return Result.fail(fieldResult.error)

    await this.modelRepository.save(model)
    return Result.ok(ModelAssembler.toDetailDTO(model))
  }

  /**
   * 修改字段
   */
  async modifyField(cmd: ModifyFieldCommand): Promise<Result<ModelDetailDTO>> {
    const model = await this.modelRepository.findById(ModelId.create(cmd.modelId))
    if (!model) return Result.fail(`模型 ${cmd.modelId} 不存在`)

    const entity = model.entities.find(e => e.id.value === cmd.entityId)
    if (!entity) return Result.fail(`表 ${cmd.entityId} 不存在`)

    let dataType: DataType | undefined
    if (cmd.baseType) {
      const baseType = cmd.baseType as FieldBaseType
      if (baseType === FieldBaseType.STRING) {
        dataType = DataType.varchar(cmd.length ?? 255)
      } else {
        dataType = new DataType({ baseType })
      }
    }

    const result = entity.modifyField({
      fieldId: FieldId.create(cmd.fieldId),
      name: cmd.name,
      comment: cmd.comment,
      dataType,
    }, cmd.operatorId)

    if (result.isFailure) return Result.fail(result.error)
    await this.modelRepository.save(model)
    await this.publishEvents(model)
    return Result.ok(ModelAssembler.toDetailDTO(model))
  }

  /**
   * 删除字段
   */
  async removeField(modelId: string, entityId: string, fieldId: string): Promise<Result<void>> {
    const model = await this.modelRepository.findById(ModelId.create(modelId))
    if (!model) return Result.fail(`模型 ${modelId} 不存在`)

    const entity = model.entities.find(e => e.id.value === entityId)
    if (!entity) return Result.fail(`表 ${entityId} 不存在`)

    const result = entity.removeField(FieldId.create(fieldId))
    if (result.isFailure) return result

    await this.modelRepository.save(model)
    return Result.ok()
  }

  // ── 版本快照 ──────────────────────────────────────────────────────────

  /**
   * 创建模型快照（GoF: Memento Pattern）
   */
  async createSnapshot(cmd: CreateSnapshotCommand): Promise<Result<{ snapshotId: string }>> {
    const model = await this.modelRepository.findById(ModelId.create(cmd.modelId))
    if (!model) return Result.fail(`模型 ${cmd.modelId} 不存在`)

    const snapshot = model.toSnapshot()
    const snapshotId = await this.modelRepository.saveSnapshot(
      model.id,
      model.currentBranchId,
      { ...snapshot, versionTag: cmd.versionTag, description: cmd.description },
    )

    return Result.ok({ snapshotId })
  }

  // ── DDL 生成 ──────────────────────────────────────────────────────────

  /**
   * 生成指定数据库的 DDL 语句
   */
  async generateDDL(cmd: GenerateDDLCommand): Promise<Result<DDLResultDTO>> {
    const model = await this.modelRepository.findById(ModelId.create(cmd.modelId))
    if (!model) return Result.fail(`模型 ${cmd.modelId} 不存在`)

    let entities = model.entities
    if (cmd.entityIds && cmd.entityIds.length > 0) {
      entities = entities.filter(e => cmd.entityIds!.includes(e.id.value))
    }

    const lines: string[] = [
      `-- DDM 生成 DDL — 模型: ${model.name}`,
      `-- 目标数据库: ${cmd.dbType}`,
      `-- 生成时间: ${new Date().toISOString()}`,
      '',
    ]

    for (const entity of entities) {
      const sql = this.sqlEngine.generateCreateTable(entity, cmd.dbType)
      lines.push(sql)
      lines.push('')
    }

    return Result.ok({
      modelId: cmd.modelId,
      dbType: cmd.dbType,
      sql: lines.join('\n'),
      generatedAt: new Date().toISOString(),
      entityCount: entities.length,
    })
  }

  // ── 模型 Diff ─────────────────────────────────────────────────────────

  /**
   * 对比两个版本的模型差异
   */
  async diffModels(baseModelId: string, targetModelId: string): Promise<Result<string>> {
    const baseModel = await this.modelRepository.findById(ModelId.create(baseModelId))
    if (!baseModel) return Result.fail(`基准模型 ${baseModelId} 不存在`)

    const targetModel = await this.modelRepository.findById(ModelId.create(targetModelId))
    if (!targetModel) return Result.fail(`目标模型 ${targetModelId} 不存在`)

    const result = this.diffService.diff(baseModel, targetModel)
    return Result.ok(result.summary)
  }

  // ── 私有辅助 ─────────────────────────────────────────────────────────

  /**
   * 从聚合根拉取并发布领域事件
   */
  private async publishEvents(aggregate: { pullDomainEvents(): import('../../shared/base').DomainEvent[] }): Promise<void> {
    const events = aggregate.pullDomainEvents()
    if (events.length > 0 && this.eventPublisher) {
      await this.eventPublisher.publish(events)
    }
  }
}
