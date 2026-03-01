import { UniqueId, ValueObject } from '../shared/base'

// ── 强类型 ID 值对象 ──────────────────────────────────────────────

export class ModelId extends UniqueId {
  private _brand!: 'ModelId'
  static create(value?: string): ModelId {
    return new ModelId({ value: value ?? UniqueId.generate() })
  }
}

export class ProjectId extends UniqueId {
  private _brand!: 'ProjectId'
  static create(value?: string): ProjectId {
    return new ProjectId({ value: value ?? UniqueId.generate() })
  }
}

export class EntityId extends UniqueId {
  private _brand!: 'EntityId'
  static create(value?: string): EntityId {
    return new EntityId({ value: value ?? UniqueId.generate() })
  }
}

export class FieldId extends UniqueId {
  private _brand!: 'FieldId'
  static create(value?: string): FieldId {
    return new FieldId({ value: value ?? UniqueId.generate() })
  }
}

export class BranchId extends UniqueId {
  private _brand!: 'BranchId'
  static create(value?: string): BranchId {
    return new BranchId({ value: value ?? UniqueId.generate() })
  }
}

export class UserId extends UniqueId {
  private _brand!: 'UserId'
  static create(value?: string): UserId {
    return new UserId({ value: value ?? UniqueId.generate() })
  }
}

export class TeamId extends UniqueId {
  private _brand!: 'TeamId'
  static create(value?: string): TeamId {
    return new TeamId({ value: value ?? UniqueId.generate() })
  }
}

// ── 枚举 ──────────────────────────────────────────────────────────

/** 建模层次：概念/逻辑/物理 */
export enum ModelLayer {
  CONCEPTUAL = 'CONCEPTUAL',   // 概念层：业务实体抽象
  LOGICAL    = 'LOGICAL',      // 逻辑层：无数据库依赖的结构化设计
  PHYSICAL   = 'PHYSICAL',     // 物理层：具体数据库 DDL 级别
}

/** 字段基本数据类型 */
export enum FieldBaseType {
  STRING   = 'STRING',
  INTEGER  = 'INTEGER',
  DECIMAL  = 'DECIMAL',
  BOOLEAN  = 'BOOLEAN',
  DATE     = 'DATE',
  DATETIME = 'DATETIME',
  TEXT     = 'TEXT',
  BLOB     = 'BLOB',
  JSON     = 'JSON',
}

/** 关系类型 */
export enum RelationType {
  ONE_TO_ONE  = 'ONE_TO_ONE',
  ONE_TO_MANY = 'ONE_TO_MANY',
  MANY_TO_MANY = 'MANY_TO_MANY',
}

// ── 值对象 ────────────────────────────────────────────────────────

/** 数据类型值对象（含数据库方言信息） */
export class DataType extends ValueObject<{
  baseType: FieldBaseType
  length?: number
  precision?: number
  scale?: number
}> {
  get baseType(): FieldBaseType { return this.props.baseType }
  get length(): number | undefined { return this.props.length }
  get precision(): number | undefined { return this.props.precision }
  get scale(): number | undefined { return this.props.scale }

  static varchar(length: number): DataType {
    return new DataType({ baseType: FieldBaseType.STRING, length })
  }
  static integer(): DataType {
    return new DataType({ baseType: FieldBaseType.INTEGER })
  }
  static decimal(precision: number, scale: number): DataType {
    return new DataType({ baseType: FieldBaseType.DECIMAL, precision, scale })
  }
  static text(): DataType {
    return new DataType({ baseType: FieldBaseType.TEXT })
  }
  static datetime(): DataType {
    return new DataType({ baseType: FieldBaseType.DATETIME })
  }

  toString(): string {
    const { baseType, length, precision, scale } = this.props
    if (length) return `${baseType}(${length})`
    if (precision && scale) return `${baseType}(${precision},${scale})`
    return baseType
  }
}

/** 数据项标准引用（跨上下文引用） */
export class DataItemRef extends ValueObject<{
  standardId: string
  standardName: string
}> {
  get standardId(): string { return this.props.standardId }
  get standardName(): string { return this.props.standardName }

  static of(standardId: string, standardName: string): DataItemRef {
    return new DataItemRef({ standardId, standardName })
  }
}

/** 代码值标准引用 */
export class CodeValueRef extends ValueObject<{
  groupId: string
  groupName: string
}> {
  get groupId(): string { return this.props.groupId }
  get groupName(): string { return this.props.groupName }

  static of(groupId: string, groupName: string): CodeValueRef {
    return new CodeValueRef({ groupId, groupName })
  }
}
