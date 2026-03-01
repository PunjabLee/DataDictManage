/**
 * @file model-factory.ts
 * @description Model 聚合根工厂 — 负责从不同来源重建或创建 Model 对象
 * @layer Domain Layer — domain/model
 * @pattern GoF: Factory Method Pattern
 *          工厂封装了聚合根的构造细节，应用层只需调用工厂而不感知 Model 的 private 构造函数。
 *          同时兼容两个场景：
 *          1. 全新创建（newModel）— 由命令直接触发
 *          2. 从持久化快照重建（reconstitute）— 从数据库读取后还原聚合根状态
 *
 * @module @ddm/core-engine
 */

import { Result } from '../../shared/base'
import { Model, ModelBranch, ModelRelation } from './model'
import { Entity } from './entity'
import { Field } from './field'
import {
  ModelId,
  ProjectId,
  BranchId,
  EntityId,
  FieldId,
  DataType,
  FieldBaseType,
  ModelLayer,
  RelationType,
} from './model-types'

// ── 输入 DTO（工厂方法的参数类型，不暴露给应用层之外） ──────────────────────

/**
 * 创建新模型的命令参数
 */
export interface CreateModelParams {
  /** 模型名称（必填，1~128字符） */
  name: string
  /** 所属项目 ID */
  projectId: string
  /** 操作者用户 ID */
  createdBy: string
  /** 模型描述（可选） */
  description?: string
}

/**
 * 从持久化数据重建 Model 的快照结构
 * 对应 infra/sql/schema.sql 中的数据库字段
 */
export interface ModelSnapshot {
  id: string
  projectId: string
  name: string
  description: string
  createdBy: string
  createdAt: string   // ISO 8601
  updatedAt: string
  entities: EntitySnapshotInput[]
  relations: RelationSnapshotInput[]
  branches: BranchSnapshotInput[]
  currentBranchId: string
}

export interface EntitySnapshotInput {
  id: string
  name: string
  comment: string
  layer: ModelLayer
  fields: FieldSnapshotInput[]
}

export interface FieldSnapshotInput {
  id: string
  name: string
  comment: string
  baseType: FieldBaseType
  length?: number
  precision?: number
  scale?: number
  nullable: boolean
  primaryKey: boolean
  unique: boolean
  autoIncrement: boolean
  defaultValue?: string
  sortOrder: number
  standardId?: string
  standardName?: string
}

export interface RelationSnapshotInput {
  id: string
  fromEntityId: string
  toEntityId: string
  type: RelationType
  comment?: string
}

export interface BranchSnapshotInput {
  id: string
  name: string
  isMain: boolean
  parentBranchId?: string
  createdAt: string
}

// ── ModelFactory ──────────────────────────────────────────────────────────────

/**
 * 模型工厂
 *
 * @pattern GoF: Factory Method
 * 提供两个工厂方法：
 * - `create(params)` — 新建模型（触发 ModelCreatedEvent）
 * - `reconstitute(snapshot)` — 从数据库快照重建（不触发领域事件，只是状态还原）
 */
export class ModelFactory {
  /**
   * 创建全新 Model 聚合根
   * 等同于调用 Model.create()，加了一层语义更清晰的封装
   *
   * @param params 创建参数
   * @returns Result<Model> — 成功则携带模型对象，失败则携带错误信息
   */
  static create(params: CreateModelParams): Result<Model> {
    return Model.create(
      params.name,
      ProjectId.create(params.projectId),
      params.createdBy,
      params.description ?? '',
    )
  }

  /**
   * 从持久化快照重建 Model 聚合根
   * 用于：Repository.findById() 从数据库查询后，将 PO 转为聚合根
   *
   * 注意：此方法不会触发任何领域事件（它只是"恢复"状态，不是"改变"状态）
   *
   * @param snapshot 从持久化层读取的快照数据
   * @returns Result<Model>
   */
  static reconstitute(snapshot: ModelSnapshot): Result<Model> {
    try {
      // 1. 重建 Entity 集合
      const entities = snapshot.entities.map(es => {
        // 重建 Field 集合
        const fields = es.fields.map(fs => {
          const dataType = new DataType({
            baseType: fs.baseType,
            length: fs.length,
            precision: fs.precision,
            scale: fs.scale,
          })

          let field = Field.builder()
            .withId(FieldId.create(fs.id))
            .withName(fs.name)
            .withComment(fs.comment)
            .withDataType(dataType)
            .withNullable(fs.nullable)
            .withPrimaryKey(fs.primaryKey)
            .withUnique(fs.unique)
            .withAutoIncrement(fs.autoIncrement)
            .withSortOrder(fs.sortOrder)
            .build()

          if (fs.standardId && fs.standardName) {
            const { DataItemRef } = require('./model-types')
            field = field.withStandardRef(DataItemRef.of(fs.standardId, fs.standardName))
          }

          return field
        })

        return EntityFactory.reconstitute({
          id: es.id,
          name: es.name,
          comment: es.comment,
          layer: es.layer,
          fields,
        })
      })

      // 2. 重建 Relation 集合
      const relations: ModelRelation[] = snapshot.relations.map(rs => ({
        id: rs.id,
        fromEntityId: EntityId.create(rs.fromEntityId),
        toEntityId: EntityId.create(rs.toEntityId),
        type: rs.type,
        comment: rs.comment,
      }))

      // 3. 重建 Branch 集合
      const branches: ModelBranch[] = snapshot.branches.map(bs => ({
        id: BranchId.create(bs.id),
        name: bs.name,
        isMain: bs.isMain,
        parentBranchId: bs.parentBranchId ? BranchId.create(bs.parentBranchId) : undefined,
        createdAt: new Date(bs.createdAt),
      }))

      // 4. 调用 Model 的包级重建方法（通过 ModelReconstituter 协议）
      const model = ModelReconstituter.reconstitute({
        id: ModelId.create(snapshot.id),
        projectId: ProjectId.create(snapshot.projectId),
        name: snapshot.name,
        description: snapshot.description,
        createdBy: snapshot.createdBy,
        createdAt: new Date(snapshot.createdAt),
        updatedAt: new Date(snapshot.updatedAt),
        entities,
        relations,
        branches,
        currentBranchId: BranchId.create(snapshot.currentBranchId),
      })

      return Result.ok(model)
    } catch (err) {
      return Result.fail(`重建 Model 失败: ${String(err)}`)
    }
  }
}

// ── EntityFactory（内部用，不导出给应用层） ────────────────────────────────

/**
 * @internal Entity 重建工厂（领域内部使用）
 */
export class EntityFactory {
  /**
   * 从持久化数据重建 Entity
   */
  static reconstitute(params: {
    id: string
    name: string
    comment: string
    layer: ModelLayer
    fields: Field[]
  }): Entity {
    return EntityReconstituter.reconstitute({
      id: EntityId.create(params.id),
      name: params.name,
      comment: params.comment,
      layer: params.layer,
      fields: params.fields,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }
}

// ── 重建协议（package-private，避免 public API 污染） ─────────────────────

/**
 * @internal Model 重建器
 * 通过此协议绕过 Model 的 private 构造函数，用于仓储层的对象还原
 *
 * 真实生产实现通常使用 `Object.create()` + `Object.assign()` 来注入私有字段，
 * 或将构造函数改为 protected 并由工厂子类调用。
 * 此处使用"重建器协议"模式以保持领域纯洁性。
 */
export class ModelReconstituter {
  static reconstitute(params: {
    id: ModelId
    projectId: ProjectId
    name: string
    description: string
    createdBy: string
    createdAt: Date
    updatedAt: Date
    entities: Entity[]
    relations: ModelRelation[]
    branches: ModelBranch[]
    currentBranchId: BranchId
  }): Model {
    // 先创建一个空 Model，再通过受控方式注入状态
    // 注：实际工程中可将此改为 Model.reconstitute() 静态方法（需修改 model.ts）
    const raw = Model.create(params.name, params.projectId, params.createdBy, params.description)
    if (raw.isFailure) throw new Error(raw.error)

    const model = raw.value
    // 利用 Model 暴露的 reconstitute 钩子（在 model.ts 中预留）
    // 这里使用类型断言 hack 注入私有字段（仅 infra 层调用，不对外暴露）
    const m = model as unknown as Record<string, unknown>
    m['_id'] = params.id
    m['_projectId'] = params.projectId
    m['_name'] = params.name
    m['_description'] = params.description
    m['_createdBy'] = params.createdBy
    m['_createdAt'] = params.createdAt
    m['_updatedAt'] = params.updatedAt
    m['_entities'] = new Map(params.entities.map(e => [e.id.value, e]))
    m['_relations'] = params.relations
    m['_branches'] = params.branches
    m['_currentBranchId'] = params.currentBranchId
    // 清空重建时不需要的初始事件
    ;(m['_domainEvents'] as unknown[]) = []

    return model
  }
}

/**
 * @internal Entity 重建器
 */
export class EntityReconstituter {
  static reconstitute(params: {
    id: EntityId
    name: string
    comment: string
    layer: ModelLayer
    fields: Field[]
    createdAt: Date
    updatedAt: Date
  }): Entity {
    const raw = Entity.create(params.name, params.comment, params.layer)
    if (raw.isFailure) throw new Error(raw.error)
    const entity = raw.value
    const e = entity as unknown as Record<string, unknown>
    e['_id'] = params.id
    e['_name'] = params.name
    e['_comment'] = params.comment
    e['_layer'] = params.layer
    e['_fields'] = new Map(params.fields.map(f => [f.id.value, f]))
    e['_createdAt'] = params.createdAt
    e['_updatedAt'] = params.updatedAt
    ;(e['_domainEvents'] as unknown[]) = []
    return entity
  }
}
