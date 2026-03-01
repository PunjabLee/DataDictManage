import { AggregateRoot, Repository, Result } from '../shared/base'
import { ModelId, ProjectId, BranchId, EntityId, RelationType, ModelLayer } from './model-types'
import { Entity, AddFieldCommand } from './entity'
import { ModelCreatedEvent, EntityAddedToModelEvent, EntityRemovedFromModelEvent, ModelSnapshotCreatedEvent } from './model-events'

export interface ModelRelation {
  id: string
  fromEntityId: EntityId
  toEntityId: EntityId
  type: RelationType
  comment?: string
}

export interface ModelBranch {
  id: BranchId
  name: string
  isMain: boolean
  parentBranchId?: BranchId
  createdAt: Date
}

/**
 * Model（数据模型）— 聚合根（最高层级）
 *
 * 聚合边界：
 *  - Model 管辖 Entity 集合（数据表）
 *  - Model 管辖 Relation 集合（表间关系）
 *  - Model 管辖 Branch（分支版本）
 *
 * 不变量：
 *  - 每个 Model 至少有一个主干分支（main）
 *  - Entity 名称在同一 Model 内唯一
 *  - 关系的 from/to Entity 必须都属于当前 Model
 *
 * GoF 模式：
 *  - Factory Method：ModelFactory 负责创建
 *  - Observer：通过 DomainEvent 通知应用层
 *  - Memento：toSnapshot() 实现模型快照
 */
export class Model extends AggregateRoot<ModelId> {
  private _id: ModelId
  private _projectId: ProjectId
  private _name: string
  private _description: string
  private _currentBranchId: BranchId
  private _entities: Map<string, Entity>
  private _relations: ModelRelation[]
  private _branches: ModelBranch[]
  private _createdBy: string
  private _createdAt: Date
  private _updatedAt: Date

  private constructor(
    id: ModelId,
    projectId: ProjectId,
    name: string,
    description: string,
    createdBy: string,
  ) {
    super()
    this._id = id
    this._projectId = projectId
    this._name = name
    this._description = description
    this._entities = new Map()
    this._relations = []
    this._branches = []
    this._createdBy = createdBy
    this._createdAt = new Date()
    this._updatedAt = new Date()

    // 自动创建主干分支
    const mainBranch: ModelBranch = {
      id: BranchId.create(),
      name: 'main',
      isMain: true,
      createdAt: new Date(),
    }
    this._branches.push(mainBranch)
    this._currentBranchId = mainBranch.id
  }

  // ── 工厂方法（GoF: Factory Method）──────────────────────────────

  static create(
    name: string,
    projectId: ProjectId,
    createdBy: string,
    description: string = '',
  ): Result<Model> {
    if (!name?.trim()) return Result.fail('模型名称不能为空')
    if (name.length > 128) return Result.fail('模型名称不能超过 128 个字符')

    const model = new Model(ModelId.create(), projectId, name.trim(), description, createdBy)

    // 注册领域事件（GoF: Observer）
    model.registerEvent(new ModelCreatedEvent(model._id, projectId.value, createdBy))

    return Result.ok(model)
  }

  // ── Getters ───────────────────────────────────────────────────

  get id(): ModelId { return this._id }
  get projectId(): ProjectId { return this._projectId }
  get name(): string { return this._name }
  get description(): string { return this._description }
  get currentBranchId(): BranchId { return this._currentBranchId }
  get entities(): Entity[] { return Array.from(this._entities.values()) }
  get relations(): ModelRelation[] { return [...this._relations] }
  get branches(): ModelBranch[] { return [...this._branches] }
  get createdBy(): string { return this._createdBy }
  get createdAt(): Date { return this._createdAt }
  get updatedAt(): Date { return this._updatedAt }

  // ── 领域行为 ──────────────────────────────────────────────────

  /**
   * 添加数据表（Entity）
   * 不变量：表名在当前模型内唯一
   */
  addEntity(
    name: string,
    comment: string = '',
    layer: ModelLayer = ModelLayer.PHYSICAL,
    operatorId: string,
  ): Result<Entity> {
    if (this.findEntityByName(name)) {
      return Result.fail(`表 "${name}" 已存在`)
    }
    const entityResult = Entity.create(name, comment, layer)
    if (entityResult.isFailure) return Result.fail(entityResult.error)

    const entity = entityResult.value
    this._entities.set(entity.id.value, entity)
    this._updatedAt = new Date()

    this.registerEvent(new EntityAddedToModelEvent(this._id, entity.id, name, operatorId))
    return Result.ok(entity)
  }

  /**
   * 删除数据表
   * 同时清理与该表相关的所有关系
   */
  removeEntity(entityId: EntityId, operatorId: string): Result<void> {
    if (!this._entities.has(entityId.value)) {
      return Result.fail(`表 ${entityId.value} 不存在`)
    }
    this._entities.delete(entityId.value)
    // 清理相关关系
    this._relations = this._relations.filter(
      r => r.fromEntityId.value !== entityId.value && r.toEntityId.value !== entityId.value
    )
    this._updatedAt = new Date()
    this.registerEvent(new EntityRemovedFromModelEvent(this._id, entityId, operatorId))
    return Result.ok()
  }

  /**
   * 添加表间关系
   */
  addRelation(
    fromEntityId: EntityId,
    toEntityId: EntityId,
    type: RelationType,
    comment: string = '',
  ): Result<ModelRelation> {
    if (!this._entities.has(fromEntityId.value)) {
      return Result.fail(`来源表 ${fromEntityId.value} 不在当前模型中`)
    }
    if (!this._entities.has(toEntityId.value)) {
      return Result.fail(`目标表 ${toEntityId.value} 不在当前模型中`)
    }

    const relation: ModelRelation = {
      id: crypto.randomUUID(),
      fromEntityId,
      toEntityId,
      type,
      comment,
    }
    this._relations.push(relation)
    this._updatedAt = new Date()
    return Result.ok(relation)
  }

  /**
   * 创建分支（类 Git Branch）
   */
  createBranch(name: string, parentBranchId?: BranchId): Result<ModelBranch> {
    const exists = this._branches.find(b => b.name === name)
    if (exists) return Result.fail(`分支 "${name}" 已存在`)

    const branch: ModelBranch = {
      id: BranchId.create(),
      name,
      isMain: false,
      parentBranchId,
      createdAt: new Date(),
    }
    this._branches.push(branch)
    return Result.ok(branch)
  }

  /**
   * 切换当前分支
   */
  switchBranch(branchId: BranchId): Result<void> {
    const branch = this._branches.find(b => b.id.value === branchId.value)
    if (!branch) return Result.fail(`分支 ${branchId.value} 不存在`)
    this._currentBranchId = branchId
    return Result.ok()
  }

  /**
   * GoF: Memento Pattern — 生成模型快照（用于版本管理）
   */
  toSnapshot(): object {
    return {
      modelId: this._id.value,
      projectId: this._projectId.value,
      name: this._name,
      description: this._description,
      snapshotAt: new Date().toISOString(),
      entities: this.entities.map(e => e.toSnapshot()),
      relations: this._relations.map(r => ({
        id: r.id,
        fromEntityId: r.fromEntityId.value,
        toEntityId: r.toEntityId.value,
        type: r.type,
        comment: r.comment,
      })),
    }
  }

  // ── 私有辅助 ──────────────────────────────────────────────────

  private findEntityByName(name: string): Entity | undefined {
    return Array.from(this._entities.values()).find(e => e.name === name)
  }
}

/**
 * Model 仓储接口（依赖倒置：领域层定义，基础设施层实现）
 */
export interface ModelRepository extends Repository<Model> {
  findByProjectId(projectId: ProjectId): Promise<Model[]>
  findByName(projectId: ProjectId, name: string): Promise<Model | null>
  saveSnapshot(modelId: ModelId, branchId: BranchId, snapshot: object): Promise<string>
  findSnapshot(snapshotId: string): Promise<object | null>
}
