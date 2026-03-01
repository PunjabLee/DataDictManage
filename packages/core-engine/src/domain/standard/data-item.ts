/**
 * @file data-item.ts
 * @description 数据项标准 聚合根 — 数据标准上下文（Standard Bounded Context）
 * @layer Domain Layer — domain/standard
 *
 * 职责：
 *   数据项标准定义了企业级字段命名、类型、长度的规范基线。
 *   当建模上下文的 Field 绑定了 DataItemRef，就意味着该字段遵循此标准。
 *   合规检查服务会对比 Field 实际定义与标准定义的差异。
 *
 * @pattern GoF: Factory Method（DataItem.create）
 *           Template Method（validate 流程可扩展）
 *
 * @module @ddm/core-engine
 */

import { AggregateRoot, Result } from '../../shared/base'
import { UniqueId } from '../../shared/base'
import { FieldBaseType, DataType } from '../model/model-types'
import { DataItemCreatedEvent, DataItemUpdatedEvent } from './standard-events'

// ── 数据项 ID 值对象 ─────────────────────────────────────────────────────────

/**
 * 数据项 ID（强类型，避免与其他 ID 混用）
 */
export class DataItemId extends UniqueId {
  private _brand!: 'DataItemId'
  static create(value?: string): DataItemId {
    return new DataItemId({ value: value ?? UniqueId.generate() })
  }
}

// ── 枚举：数据项状态 ─────────────────────────────────────────────────────────

/**
 * 数据项标准状态
 * - DRAFT：草稿，未发布，不可被业务字段引用
 * - PUBLISHED：已发布，可被引用
 * - DEPRECATED：已废弃，现有引用保留但不允许新建引用
 */
export enum DataItemStatus {
  DRAFT      = 'DRAFT',
  PUBLISHED  = 'PUBLISHED',
  DEPRECATED = 'DEPRECATED',
}

// ── 数据项聚合根 ─────────────────────────────────────────────────────────────

/**
 * DataItem（数据项标准）— 聚合根
 *
 * 不变量：
 *  - 标准编码（code）在整个系统内全局唯一（由仓储层保证）
 *  - 只有 PUBLISHED 状态的数据项才能被字段引用
 *  - DEPRECATED 状态不可回退为 PUBLISHED
 */
export class DataItem extends AggregateRoot<DataItemId> {
  private _id: DataItemId
  /** 标准编码（全局唯一，如 CUST_NAME、ORG_CODE） */
  private _code: string
  /** 中文名称 */
  private _name: string
  /** 英文名称（可选） */
  private _nameEn: string
  /** 业务描述 */
  private _description: string
  /** 标准数据类型 */
  private _dataType: DataType
  /** 示例值 */
  private _example: string
  /** 所属分类 ID */
  private _categoryId: string
  /** 状态 */
  private _status: DataItemStatus
  /** 版本号（每次更新自增） */
  private _version: number
  /** 标签（逗号分隔，支持检索） */
  private _tags: string[]
  /** 创建人 */
  private _createdBy: string
  private _createdAt: Date
  private _updatedAt: Date

  private constructor(
    id: DataItemId,
    code: string,
    name: string,
    nameEn: string,
    description: string,
    dataType: DataType,
    categoryId: string,
    createdBy: string,
  ) {
    super()
    this._id = id
    this._code = code
    this._name = name
    this._nameEn = nameEn
    this._description = description
    this._dataType = dataType
    this._example = ''
    this._categoryId = categoryId
    this._status = DataItemStatus.DRAFT
    this._version = 1
    this._tags = []
    this._createdBy = createdBy
    this._createdAt = new Date()
    this._updatedAt = new Date()
  }

  // ── 工厂方法 ──────────────────────────────────────────────────────────────

  /**
   * 创建新数据项标准
   * @param code 标准编码（必填，字母+下划线）
   * @param name 中文名称
   * @param dataType 标准数据类型
   * @param categoryId 所属分类
   * @param createdBy 创建人
   * @param nameEn 英文名称（可选）
   * @param description 描述（可选）
   */
  static create(params: {
    code: string
    name: string
    dataType: DataType
    categoryId: string
    createdBy: string
    nameEn?: string
    description?: string
  }): Result<DataItem> {
    const { code, name, dataType, categoryId, createdBy, nameEn = '', description = '' } = params

    if (!code?.trim()) return Result.fail('数据项编码不能为空')
    if (!/^[A-Z][A-Z0-9_]*$/.test(code)) return Result.fail('数据项编码必须为大写字母、数字、下划线，且以字母开头')
    if (code.length > 64) return Result.fail('数据项编码不能超过 64 个字符')
    if (!name?.trim()) return Result.fail('数据项名称不能为空')
    if (name.length > 128) return Result.fail('数据项名称不能超过 128 个字符')

    const item = new DataItem(DataItemId.create(), code, name.trim(), nameEn, description, dataType, categoryId, createdBy)
    item.registerEvent(new DataItemCreatedEvent(item._id, code, name, createdBy))
    return Result.ok(item)
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get id(): DataItemId { return this._id }
  get code(): string { return this._code }
  get name(): string { return this._name }
  get nameEn(): string { return this._nameEn }
  get description(): string { return this._description }
  get dataType(): DataType { return this._dataType }
  get example(): string { return this._example }
  get categoryId(): string { return this._categoryId }
  get status(): DataItemStatus { return this._status }
  get version(): number { return this._version }
  get tags(): readonly string[] { return this._tags }
  get createdBy(): string { return this._createdBy }
  get createdAt(): Date { return this._createdAt }
  get updatedAt(): Date { return this._updatedAt }

  // ── 领域行为 ──────────────────────────────────────────────────────────────

  /**
   * 更新数据项基本信息（版本号自动+1）
   */
  update(params: {
    name?: string
    nameEn?: string
    description?: string
    dataType?: DataType
    example?: string
    tags?: string[]
    operatorId: string
  }): Result<void> {
    if (this._status === DataItemStatus.DEPRECATED) {
      return Result.fail('已废弃的数据项不可修改')
    }
    if (params.name) {
      if (params.name.length > 128) return Result.fail('数据项名称不能超过 128 个字符')
      this._name = params.name
    }
    if (params.nameEn !== undefined) this._nameEn = params.nameEn
    if (params.description !== undefined) this._description = params.description
    if (params.dataType) this._dataType = params.dataType
    if (params.example !== undefined) this._example = params.example
    if (params.tags) this._tags = [...params.tags]

    this._version++
    this._updatedAt = new Date()

    this.registerEvent(new DataItemUpdatedEvent(this._id, this._code, this._version, params.operatorId))
    return Result.ok()
  }

  /**
   * 发布数据项（DRAFT → PUBLISHED）
   * 发布后可被业务字段引用
   */
  publish(operatorId: string): Result<void> {
    if (this._status !== DataItemStatus.DRAFT) {
      return Result.fail('只有草稿状态的数据项才可以发布')
    }
    this._status = DataItemStatus.PUBLISHED
    this._updatedAt = new Date()
    return Result.ok()
  }

  /**
   * 废弃数据项（PUBLISHED → DEPRECATED）
   * 废弃后不可新建引用，但已有引用仍然保留
   */
  deprecate(operatorId: string, reason: string): Result<void> {
    if (this._status !== DataItemStatus.PUBLISHED) {
      return Result.fail('只有已发布的数据项才可以废弃')
    }
    if (!reason?.trim()) return Result.fail('废弃原因不能为空')
    this._status = DataItemStatus.DEPRECATED
    this._description = `[已废弃: ${reason}] ${this._description}`
    this._updatedAt = new Date()
    return Result.ok()
  }

  /**
   * 检查是否可以被字段引用
   */
  canBeReferenced(): boolean {
    return this._status === DataItemStatus.PUBLISHED
  }
}

/**
 * DataItem 仓储接口
 * @pattern GoF: Repository（领域层定义，基础设施层实现）
 */
export interface DataItemRepository {
  findById(id: DataItemId): Promise<DataItem | null>
  findByCode(code: string): Promise<DataItem | null>
  findByCategoryId(categoryId: string): Promise<DataItem[]>
  findPublished(keyword?: string): Promise<DataItem[]>
  save(item: DataItem): Promise<void>
  delete(id: DataItemId): Promise<void>
  existsByCode(code: string): Promise<boolean>
}
