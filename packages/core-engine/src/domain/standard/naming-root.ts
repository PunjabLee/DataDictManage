/**
 * @file naming-root.ts
 * @description 命名词根（NamingRoot）— 数据标准上下文
 * @layer Domain Layer — domain/standard
 *
 * 职责：
 *   命名词根是企业信息系统中字段/表名的基础原子词汇，
 *   用于规范标识符命名，防止同义词泛滥（如 id/no/code 混用的问题）。
 *   建模设计器在创建字段时，可以基于词根智能推荐字段名。
 *
 * 例如：
 *   词根 "NAME" → 中文"名称" → 推荐字段命名规则 "*_NAME"
 *   词根 "CODE" → 中文"编码" → 推荐字段命名规则 "*_CODE"
 *
 * @pattern GoF: Factory Method
 *
 * @module @ddm/core-engine
 */

import { AggregateRoot, UniqueId, Result } from '../../shared/base'

// ── ID 值对象 ─────────────────────────────────────────────────────────────

export class NamingRootId extends UniqueId {
  private _brand!: 'NamingRootId'
  static create(value?: string): NamingRootId {
    return new NamingRootId({ value: value ?? UniqueId.generate() })
  }
}

// ── 词根词性枚举 ──────────────────────────────────────────────────────────

/**
 * 词根的词性（用于语义分类）
 */
export enum NamingRootPartOfSpeech {
  NOUN      = 'NOUN',       // 名词：人、物、地
  VERB      = 'VERB',       // 动词：创建、更新、删除
  ADJECTIVE = 'ADJECTIVE',  // 形容词：是否、有无
  ATTRIBUTE = 'ATTRIBUTE',  // 属性词：名称、编码、状态
  DATE_TIME = 'DATE_TIME',  // 时间词：日期、时间、年份
}

// ── 命名词根聚合根 ─────────────────────────────────────────────────────────

/**
 * NamingRoot（命名词根）— 聚合根
 *
 * 不变量：
 *  - 词根（root）全局唯一，大写字母
 *  - 词根与同义词集合（synonyms）的组合不能与其他词根冲突
 */
export class NamingRoot extends AggregateRoot<NamingRootId> {
  private _id: NamingRootId
  /** 词根（英文，大写，如 NAME、CODE、STATUS） */
  private _root: string
  /** 中文含义 */
  private _chineseMeaning: string
  /** 词性 */
  private _partOfSpeech: NamingRootPartOfSpeech
  /** 同义词集合（如 NAME 的同义词有 TITLE、LABEL） */
  private _synonyms: string[]
  /** 命名建议规则（如 "*_NAME" 表示后缀用法） */
  private _namingPattern: string
  /** 示例字段名 */
  private _examples: string[]
  /** 描述 */
  private _description: string
  private _createdBy: string
  private _createdAt: Date
  private _updatedAt: Date

  private constructor(
    id: NamingRootId,
    root: string,
    chineseMeaning: string,
    partOfSpeech: NamingRootPartOfSpeech,
    createdBy: string,
  ) {
    super()
    this._id = id
    this._root = root
    this._chineseMeaning = chineseMeaning
    this._partOfSpeech = partOfSpeech
    this._synonyms = []
    this._namingPattern = `*_${root}`
    this._examples = []
    this._description = ''
    this._createdBy = createdBy
    this._createdAt = new Date()
    this._updatedAt = new Date()
  }

  // ── 工厂方法 ────────────────────────────────────────────────────────────

  static create(params: {
    root: string
    chineseMeaning: string
    partOfSpeech: NamingRootPartOfSpeech
    createdBy: string
    namingPattern?: string
    description?: string
  }): Result<NamingRoot> {
    const { root, chineseMeaning, partOfSpeech, createdBy } = params
    if (!root?.trim()) return Result.fail('词根不能为空')
    if (!/^[A-Z][A-Z0-9_]*$/.test(root)) return Result.fail('词根必须大写字母开头，只含字母数字下划线')
    if (root.length > 32) return Result.fail('词根长度不能超过 32 个字符')
    if (!chineseMeaning?.trim()) return Result.fail('词根中文含义不能为空')

    const nr = new NamingRoot(NamingRootId.create(), root.trim(), chineseMeaning.trim(), partOfSpeech, createdBy)
    if (params.namingPattern) nr._namingPattern = params.namingPattern
    if (params.description) nr._description = params.description
    return Result.ok(nr)
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  get id(): NamingRootId { return this._id }
  get root(): string { return this._root }
  get chineseMeaning(): string { return this._chineseMeaning }
  get partOfSpeech(): NamingRootPartOfSpeech { return this._partOfSpeech }
  get synonyms(): readonly string[] { return this._synonyms }
  get namingPattern(): string { return this._namingPattern }
  get examples(): readonly string[] { return this._examples }
  get description(): string { return this._description }
  get createdBy(): string { return this._createdBy }
  get createdAt(): Date { return this._createdAt }

  // ── 领域行为 ─────────────────────────────────────────────────────────────

  /**
   * 添加同义词（如 NAME 可接受 TITLE/LABEL 作为同义词）
   */
  addSynonym(synonym: string): Result<void> {
    if (!/^[A-Z][A-Z0-9_]*$/.test(synonym)) return Result.fail('同义词格式必须为大写字母/数字/下划线')
    if (this._synonyms.includes(synonym)) return Result.fail(`同义词 "${synonym}" 已存在`)
    this._synonyms = [...this._synonyms, synonym]
    this._updatedAt = new Date()
    return Result.ok()
  }

  /**
   * 删除同义词
   */
  removeSynonym(synonym: string): Result<void> {
    if (!this._synonyms.includes(synonym)) return Result.fail(`同义词 "${synonym}" 不存在`)
    this._synonyms = this._synonyms.filter(s => s !== synonym)
    this._updatedAt = new Date()
    return Result.ok()
  }

  /**
   * 添加示例字段名
   */
  addExample(fieldName: string): Result<void> {
    if (this._examples.includes(fieldName)) return Result.fail(`示例 "${fieldName}" 已存在`)
    this._examples = [...this._examples, fieldName]
    this._updatedAt = new Date()
    return Result.ok()
  }

  /**
   * 更新命名模式
   */
  updateNamingPattern(pattern: string): Result<void> {
    if (!pattern?.trim()) return Result.fail('命名模式不能为空')
    this._namingPattern = pattern.trim()
    this._updatedAt = new Date()
    return Result.ok()
  }

  /**
   * 检查给定字段名是否符合该词根的命名规范
   */
  matchesNamingPattern(fieldName: string): boolean {
    // 简单检查：字段名是否包含词根或其同义词（不区分大小写）
    const upper = fieldName.toUpperCase()
    const allRoots = [this._root, ...this._synonyms]
    return allRoots.some(r => upper.includes(r))
  }
}

/**
 * 命名词根仓储接口
 */
export interface NamingRootRepository {
  findById(id: NamingRootId): Promise<NamingRoot | null>
  findByRoot(root: string): Promise<NamingRoot | null>
  findByPartOfSpeech(pos: NamingRootPartOfSpeech): Promise<NamingRoot[]>
  search(keyword: string): Promise<NamingRoot[]>
  findAll(): Promise<NamingRoot[]>
  save(item: NamingRoot): Promise<void>
  delete(id: NamingRootId): Promise<void>
}
