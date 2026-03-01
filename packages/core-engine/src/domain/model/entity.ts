import { AggregateRoot, Result } from '../shared/base'
import { EntityId, FieldId, ModelLayer } from './model-types'
import { Field } from './field'
import { EntityAddedToModelEvent, FieldModifiedEvent } from './model-events'

export interface AddFieldCommand {
  name: string
  comment?: string
  dataType: import('./model-types').DataType
  nullable?: boolean
  primaryKey?: boolean
  unique?: boolean
  defaultValue?: string
  autoIncrement?: boolean
  sortOrder?: number
}

export interface ModifyFieldCommand {
  fieldId: FieldId
  name?: string
  comment?: string
  dataType?: import('./model-types').DataType
  nullable?: boolean
}

/**
 * Entity（数据表实体）— 聚合根
 * 注意：Entity 在 DDD 中既是领域概念，也对应数据库中的一张"表"
 *
 * 不变量（Invariant）：
 *  - 每个 Entity 最多有一个主键字段（复合主键除外）
 *  - 字段名在同一 Entity 内唯一
 *  - 至少保留一个字段（不允许清空所有字段）
 */
export class Entity extends AggregateRoot<EntityId> {
  private _id: EntityId
  private _name: string
  private _comment: string
  private _layer: ModelLayer
  private _fields: Map<string, Field>  // key: fieldId.value
  private _createdAt: Date
  private _updatedAt: Date

  private constructor(
    id: EntityId,
    name: string,
    comment: string,
    layer: ModelLayer,
  ) {
    super()
    this._id = id
    this._name = name
    this._comment = comment
    this._layer = layer
    this._fields = new Map()
    this._createdAt = new Date()
    this._updatedAt = new Date()
  }

  // ── 工厂方法 ──────────────────────────────────────────────────

  static create(name: string, comment: string = '', layer: ModelLayer = ModelLayer.PHYSICAL): Result<Entity> {
    if (!name?.trim()) {
      return Result.fail('表名不能为空')
    }
    if (name.length > 64) {
      return Result.fail('表名长度不能超过 64 个字符')
    }
    const entity = new Entity(EntityId.create(), name.trim(), comment, layer)
    // 自动添加默认主键字段
    entity.addDefaultPrimaryKey()
    return Result.ok(entity)
  }

  // ── Getters ───────────────────────────────────────────────────

  get id(): EntityId { return this._id }
  get name(): string { return this._name }
  get comment(): string { return this._comment }
  get layer(): ModelLayer { return this._layer }
  get fields(): Field[] { return Array.from(this._fields.values()) }
  get createdAt(): Date { return this._createdAt }
  get updatedAt(): Date { return this._updatedAt }

  // ── 领域行为 ──────────────────────────────────────────────────

  /**
   * 添加字段
   * 不变量检查：字段名在同一 Entity 内唯一
   */
  addField(cmd: AddFieldCommand): Result<Field> {
    const duplicate = this.findFieldByName(cmd.name)
    if (duplicate) {
      return Result.fail(`字段名 "${cmd.name}" 已存在`)
    }

    const field = Field.builder()
      .withName(cmd.name)
      .withComment(cmd.comment ?? '')
      .withDataType(cmd.dataType)
      .withNullable(cmd.nullable ?? true)
      .withPrimaryKey(cmd.primaryKey ?? false)
      .withUnique(cmd.unique ?? false)
      .withAutoIncrement(cmd.autoIncrement ?? false)
      .withSortOrder(cmd.sortOrder ?? this._fields.size)
      .build()

    this._fields.set(field.id.value, field)
    this._updatedAt = new Date()
    return Result.ok(field)
  }

  /**
   * 修改字段（值对象不可变，用新对象替换旧对象）
   */
  modifyField(cmd: ModifyFieldCommand, operatorId: string): Result<void> {
    const oldField = this._fields.get(cmd.fieldId.value)
    if (!oldField) {
      return Result.fail(`字段 ${cmd.fieldId.value} 不存在`)
    }

    // 字段名唯一性校验
    if (cmd.name && cmd.name !== oldField.name) {
      const dup = this.findFieldByName(cmd.name)
      if (dup) return Result.fail(`字段名 "${cmd.name}" 已存在`)
    }

    let newField = oldField
    if (cmd.name)     newField = newField.withName(cmd.name)
    if (cmd.comment !== undefined) newField = newField.withComment(cmd.comment)
    if (cmd.dataType) newField = newField.withDataType(cmd.dataType)

    this._fields.set(newField.id.value, newField)
    this._updatedAt = new Date()

    // 发布领域事件（观察者模式触发点）
    this.registerEvent(new FieldModifiedEvent(
      this._id,
      cmd.fieldId,
      oldField,
      newField,
      operatorId,
    ))
    return Result.ok()
  }

  /**
   * 删除字段
   * 不变量：至少保留 1 个字段
   */
  removeField(fieldId: FieldId): Result<void> {
    if (this._fields.size <= 1) {
      return Result.fail('至少需要保留一个字段')
    }
    if (!this._fields.has(fieldId.value)) {
      return Result.fail(`字段 ${fieldId.value} 不存在`)
    }
    this._fields.delete(fieldId.value)
    this._updatedAt = new Date()
    return Result.ok()
  }

  // ── 私有辅助 ──────────────────────────────────────────────────

  private findFieldByName(name: string): Field | undefined {
    return Array.from(this._fields.values()).find(f => f.name === name)
  }

  private addDefaultPrimaryKey(): void {
    const { Field } = require('./field')
    const { DataType, FieldId } = require('./model-types')
    const pk = Field.builder()
      .withName('id')
      .withComment('主键')
      .withDataType(DataType.varchar(36))
      .withNullable(false)
      .withPrimaryKey(true)
      .withSortOrder(0)
      .build()
    this._fields.set(pk.id.value, pk)
  }

  /**
   * 序列化（用于版本快照）
   */
  toSnapshot(): object {
    return {
      id: this._id.value,
      name: this._name,
      comment: this._comment,
      layer: this._layer,
      fields: this.fields.map(f => ({
        id: f.id.value,
        name: f.name,
        comment: f.comment,
        dataType: f.dataType.toString(),
        nullable: f.nullable,
        primaryKey: f.primaryKey,
        unique: f.unique,
        defaultValue: f.defaultValue,
        autoIncrement: f.autoIncrement,
        standardRef: f.standardRef ? { standardId: f.standardRef.standardId, standardName: f.standardRef.standardName } : null,
      })),
    }
  }
}
