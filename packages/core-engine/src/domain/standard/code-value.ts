/**
 * @file code-value.ts
 * @description 代码值标准（枚举字典）聚合根 — 数据标准上下文
 * @layer Domain Layer — domain/standard
 *
 * 职责：
 *   维护企业级枚举字典（如性别、状态、类型等），
 *   字段可通过 CodeValueRef 引用代码值组，确保字段取值范围符合标准。
 *
 * @pattern GoF: Factory Method（CodeValueGroup.create）
 *           Composite：CodeValueGroup 聚合多个 CodeValueItem
 *
 * @module @ddm/core-engine
 */

import { AggregateRoot, ValueObject, UniqueId, Result } from '../../shared/base'
import { CodeGroupCreatedEvent, CodeGroupItemAddedEvent } from './standard-events'

// ── ID 值对象 ─────────────────────────────────────────────────────────────

export class CodeGroupId extends UniqueId {
  private _brand!: 'CodeGroupId'
  static create(value?: string): CodeGroupId {
    return new CodeGroupId({ value: value ?? UniqueId.generate() })
  }
}

// ── 枚举项值对象 ──────────────────────────────────────────────────────────

/**
 * 代码值条目（值对象）
 * 每个条目代表枚举中的一个选项，如 {value: 'M', label: '男'}
 */
export class CodeValueItem extends ValueObject<{
  value: string    // 存储值（数据库中的实际值）
  label: string    // 显示标签
  labelEn: string  // 英文标签
  sortOrder: number
  enabled: boolean
  remark: string
}> {
  get value(): string { return this.props.value }
  get label(): string { return this.props.label }
  get labelEn(): string { return this.props.labelEn }
  get sortOrder(): number { return this.props.sortOrder }
  get enabled(): boolean { return this.props.enabled }
  get remark(): string { return this.props.remark }

  /**
   * 创建代码值条目
   */
  static create(params: {
    value: string
    label: string
    labelEn?: string
    sortOrder?: number
    remark?: string
  }): CodeValueItem {
    if (!params.value?.trim()) throw new Error('代码值不能为空')
    if (!params.label?.trim()) throw new Error('代码值标签不能为空')
    return new CodeValueItem({
      value: params.value.trim(),
      label: params.label.trim(),
      labelEn: params.labelEn ?? '',
      sortOrder: params.sortOrder ?? 0,
      enabled: true,
      remark: params.remark ?? '',
    })
  }

  /**
   * 禁用此条目（返回新实例，值对象不可变）
   */
  disable(): CodeValueItem {
    return new CodeValueItem({ ...this.props, enabled: false })
  }
}

// ── 代码值组（枚举字典）聚合根 ────────────────────────────────────────────

/**
 * CodeValueGroup（代码值组）— 聚合根
 *
 * 对应一组枚举字典，如：
 *   - 性别: [{value:'M',label:'男'},{value:'F',label:'女'}]
 *   - 婚姻状态: [{value:'0',label:'未婚'},{value:'1',label:'已婚'}]
 *
 * 不变量：
 *  - 同一组内 value 值唯一
 *  - 至少有 1 个启用的条目（组发布后）
 */
export class CodeValueGroup extends AggregateRoot<CodeGroupId> {
  private _id: CodeGroupId
  /** 字典编码（全局唯一，如 GENDER、MARITAL_STATUS） */
  private _code: string
  /** 字典名称 */
  private _name: string
  private _description: string
  /** 条目集合（key: value） */
  private _items: Map<string, CodeValueItem>
  private _status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED'
  private _categoryId: string
  private _createdBy: string
  private _createdAt: Date
  private _updatedAt: Date

  private constructor(
    id: CodeGroupId,
    code: string,
    name: string,
    description: string,
    categoryId: string,
    createdBy: string,
  ) {
    super()
    this._id = id
    this._code = code
    this._name = name
    this._description = description
    this._items = new Map()
    this._status = 'DRAFT'
    this._categoryId = categoryId
    this._createdBy = createdBy
    this._createdAt = new Date()
    this._updatedAt = new Date()
  }

  // ── 工厂方法 ────────────────────────────────────────────────────────────

  static create(params: {
    code: string
    name: string
    categoryId: string
    createdBy: string
    description?: string
  }): Result<CodeValueGroup> {
    const { code, name, categoryId, createdBy, description = '' } = params
    if (!code?.trim()) return Result.fail('字典编码不能为空')
    if (!/^[A-Z][A-Z0-9_]*$/.test(code)) return Result.fail('字典编码必须大写字母开头，只含字母数字下划线')
    if (!name?.trim()) return Result.fail('字典名称不能为空')

    const group = new CodeValueGroup(CodeGroupId.create(), code, name.trim(), description, categoryId, createdBy)
    group.registerEvent(new CodeGroupCreatedEvent(group._id, code, name, createdBy))
    return Result.ok(group)
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  get id(): CodeGroupId { return this._id }
  get code(): string { return this._code }
  get name(): string { return this._name }
  get description(): string { return this._description }
  get items(): CodeValueItem[] { return Array.from(this._items.values()) }
  get enabledItems(): CodeValueItem[] { return this.items.filter(i => i.enabled) }
  get status(): 'DRAFT' | 'PUBLISHED' | 'DEPRECATED' { return this._status }
  get categoryId(): string { return this._categoryId }
  get createdBy(): string { return this._createdBy }
  get createdAt(): Date { return this._createdAt }
  get updatedAt(): Date { return this._updatedAt }

  // ── 领域行为 ─────────────────────────────────────────────────────────────

  /**
   * 添加枚举条目
   * 不变量：value 在组内唯一
   */
  addItem(item: CodeValueItem, operatorId: string): Result<void> {
    if (this._items.has(item.value)) {
      return Result.fail(`代码值 "${item.value}" 已存在`)
    }
    this._items.set(item.value, item)
    this._updatedAt = new Date()
    this.registerEvent(new CodeGroupItemAddedEvent(this._id, this._code, item.value, item.label, operatorId))
    return Result.ok()
  }

  /**
   * 移除枚举条目
   */
  removeItem(value: string): Result<void> {
    if (!this._items.has(value)) {
      return Result.fail(`代码值 "${value}" 不存在`)
    }
    const enabledCount = this.enabledItems.length
    const item = this._items.get(value)!
    if (this._status === 'PUBLISHED' && item.enabled && enabledCount <= 1) {
      return Result.fail('已发布的字典至少需要保留一个启用的条目')
    }
    this._items.delete(value)
    this._updatedAt = new Date()
    return Result.ok()
  }

  /**
   * 发布字典（DRAFT → PUBLISHED）
   */
  publish(operatorId: string): Result<void> {
    if (this._status !== 'DRAFT') return Result.fail('只有草稿字典可以发布')
    if (this.enabledItems.length === 0) return Result.fail('字典至少需要一个启用的条目才能发布')
    this._status = 'PUBLISHED'
    this._updatedAt = new Date()
    return Result.ok()
  }

  /**
   * 废弃字典
   */
  deprecate(): Result<void> {
    if (this._status !== 'PUBLISHED') return Result.fail('只有已发布的字典可以废弃')
    this._status = 'DEPRECATED'
    this._updatedAt = new Date()
    return Result.ok()
  }

  /**
   * 根据 value 查找条目
   */
  findItem(value: string): CodeValueItem | undefined {
    return this._items.get(value)
  }

  /**
   * 验证给定 value 是否合法（是否在字典中）
   */
  isValidValue(value: string): boolean {
    const item = this._items.get(value)
    return !!item && item.enabled
  }
}

/**
 * 代码值组仓储接口
 */
export interface CodeValueGroupRepository {
  findById(id: CodeGroupId): Promise<CodeValueGroup | null>
  findByCode(code: string): Promise<CodeValueGroup | null>
  findByCategoryId(categoryId: string): Promise<CodeValueGroup[]>
  findPublished(): Promise<CodeValueGroup[]>
  save(group: CodeValueGroup): Promise<void>
  delete(id: CodeGroupId): Promise<void>
}
