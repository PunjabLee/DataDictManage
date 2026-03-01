/**
 * @file project.ts
 * @description 项目（Project）聚合根 — 团队上下文（Team Bounded Context）
 * @layer Domain Layer — domain/team
 *
 * 职责：
 *   Project 是 Model 的容器，归属于 Team。
 *   一个项目可以包含多个数据模型（Model），并管理项目级别的访问控制。
 *   项目是模型版本发布的基本单元（项目有发布环境的概念）。
 *
 * @pattern GoF: Factory Method（Project.create）
 *
 * @module @ddm/core-engine
 */

import { AggregateRoot, UniqueId, Result } from '../../shared/base'
import { TeamId, UserId, ModelId } from '../model/model-types'

// ── 项目 ID 值对象 ────────────────────────────────────────────────────────

export class ProjectId extends UniqueId {
  private _brand!: 'ProjectId'
  static create(value?: string): ProjectId {
    return new ProjectId({ value: value ?? UniqueId.generate() })
  }
}

// ── 项目类型枚举 ──────────────────────────────────────────────────────────

/**
 * 项目类型
 */
export enum ProjectType {
  /** 业务系统建模 */
  BUSINESS_SYSTEM = 'BUSINESS_SYSTEM',
  /** 数据湖/数仓建模 */
  DATA_WAREHOUSE  = 'DATA_WAREHOUSE',
  /** API 数据目录 */
  API_CATALOG     = 'API_CATALOG',
  /** 自定义 */
  CUSTOM          = 'CUSTOM',
}

/**
 * 项目环境（用于发布管理）
 */
export enum ProjectEnv {
  DEV  = 'DEV',
  TEST = 'TEST',
  PROD = 'PROD',
}

// ── 项目聚合根 ────────────────────────────────────────────────────────────

/**
 * Project（项目）— 聚合根
 *
 * 不变量：
 *  - 项目必须归属于一个 Team
 *  - 项目名称在同一 Team 内唯一（由仓储层保证）
 *  - modelIds 只记录归属此项目的 Model ID，不持有 Model 对象（跨聚合引用只用 ID）
 */
export class Project extends AggregateRoot<ProjectId> {
  private _id: ProjectId
  private _teamId: TeamId
  private _name: string
  private _description: string
  private _type: ProjectType
  /** 该项目下所有 Model 的 ID 集合（跨聚合引用，只用 ID） */
  private _modelIds: Set<string>
  /** 项目图标 emoji 或 URL */
  private _icon: string
  /** 项目是否已归档 */
  private _archived: boolean
  /** 项目发布环境配置（envName → 数据库连接 DSN 占位） */
  private _envConfigs: Map<ProjectEnv, string>
  private _createdBy: string
  private _createdAt: Date
  private _updatedAt: Date

  private constructor(
    id: ProjectId,
    teamId: TeamId,
    name: string,
    description: string,
    type: ProjectType,
    createdBy: string,
  ) {
    super()
    this._id = id
    this._teamId = teamId
    this._name = name
    this._description = description
    this._type = type
    this._modelIds = new Set()
    this._icon = '📊'
    this._archived = false
    this._envConfigs = new Map()
    this._createdBy = createdBy
    this._createdAt = new Date()
    this._updatedAt = new Date()
  }

  // ── 工厂方法 ────────────────────────────────────────────────────────────

  static create(params: {
    name: string
    teamId: string
    createdBy: string
    type?: ProjectType
    description?: string
    icon?: string
  }): Result<Project> {
    if (!params.name?.trim()) return Result.fail('项目名称不能为空')
    if (params.name.length > 64) return Result.fail('项目名称不能超过 64 个字符')
    if (!params.teamId) return Result.fail('项目必须归属于一个团队')

    const project = new Project(
      ProjectId.create(),
      TeamId.create(params.teamId),
      params.name.trim(),
      params.description ?? '',
      params.type ?? ProjectType.BUSINESS_SYSTEM,
      params.createdBy,
    )
    if (params.icon) project._icon = params.icon
    return Result.ok(project)
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  get id(): ProjectId { return this._id }
  get teamId(): TeamId { return this._teamId }
  get name(): string { return this._name }
  get description(): string { return this._description }
  get type(): ProjectType { return this._type }
  get modelIds(): string[] { return Array.from(this._modelIds) }
  get icon(): string { return this._icon }
  get archived(): boolean { return this._archived }
  get envConfigs(): Map<ProjectEnv, string> { return new Map(this._envConfigs) }
  get createdBy(): string { return this._createdBy }
  get createdAt(): Date { return this._createdAt }
  get updatedAt(): Date { return this._updatedAt }
  get modelCount(): number { return this._modelIds.size }

  // ── 领域行为 ─────────────────────────────────────────────────────────────

  /**
   * 更新项目基本信息
   */
  update(params: {
    name?: string
    description?: string
    icon?: string
    type?: ProjectType
  }): Result<void> {
    if (this._archived) return Result.fail('已归档的项目不可修改')
    if (params.name !== undefined) {
      if (!params.name.trim()) return Result.fail('项目名称不能为空')
      if (params.name.length > 64) return Result.fail('项目名称不能超过 64 个字符')
      this._name = params.name.trim()
    }
    if (params.description !== undefined) this._description = params.description
    if (params.icon !== undefined) this._icon = params.icon
    if (params.type !== undefined) this._type = params.type
    this._updatedAt = new Date()
    return Result.ok()
  }

  /**
   * 将 Model 加入项目（记录跨聚合引用 ID）
   */
  addModel(modelId: ModelId): Result<void> {
    if (this._archived) return Result.fail('已归档的项目不可添加模型')
    if (this._modelIds.has(modelId.value)) return Result.fail(`模型 ${modelId.value} 已属于此项目`)
    this._modelIds.add(modelId.value)
    this._updatedAt = new Date()
    return Result.ok()
  }

  /**
   * 从项目移除 Model（只移除引用，不删除 Model 聚合根）
   */
  removeModel(modelId: ModelId): Result<void> {
    if (!this._modelIds.has(modelId.value)) return Result.fail(`模型 ${modelId.value} 不属于此项目`)
    this._modelIds.delete(modelId.value)
    this._updatedAt = new Date()
    return Result.ok()
  }

  /**
   * 归档项目（不可逆，归档后不可编辑）
   */
  archive(): Result<void> {
    if (this._archived) return Result.fail('项目已经是归档状态')
    this._archived = true
    this._updatedAt = new Date()
    return Result.ok()
  }

  /**
   * 配置发布环境（DEV/TEST/PROD）
   * dsn 为目标数据库连接串（加密存储，此处只存占位符）
   */
  configureEnv(env: ProjectEnv, dsn: string): Result<void> {
    if (!dsn?.trim()) return Result.fail('数据库连接配置不能为空')
    this._envConfigs.set(env, dsn)
    this._updatedAt = new Date()
    return Result.ok()
  }

  /**
   * 检查模型是否属于此项目
   */
  hasModel(modelId: ModelId): boolean {
    return this._modelIds.has(modelId.value)
  }
}

/**
 * 项目仓储接口
 */
export interface ProjectRepository {
  findById(id: ProjectId): Promise<Project | null>
  findByTeamId(teamId: TeamId): Promise<Project[]>
  findByName(teamId: TeamId, name: string): Promise<Project | null>
  save(project: Project): Promise<void>
  delete(id: ProjectId): Promise<void>
}
