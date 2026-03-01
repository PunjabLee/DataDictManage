import { FieldId, DataType, DataItemRef, CodeValueRef } from './model-types'
import { ValueObject } from '../shared/base'

/**
 * 字段（Field）— 值对象
 * 值对象：无独立生命周期，从属于 Entity（表），通过属性相等判断同一性
 * GoF: Value Object + Builder Pattern
 */
export class Field extends ValueObject<{
  id: FieldId
  name: string
  comment: string
  dataType: DataType
  nullable: boolean
  primaryKey: boolean
  unique: boolean
  defaultValue?: string
  autoIncrement: boolean
  standardRef?: DataItemRef    // 引用数据项标准（跨上下文）
  codeValueRef?: CodeValueRef  // 引用代码值标准
  sortOrder: number
}> {
  get id(): FieldId { return this.props.id }
  get name(): string { return this.props.name }
  get comment(): string { return this.props.comment }
  get dataType(): DataType { return this.props.dataType }
  get nullable(): boolean { return this.props.nullable }
  get primaryKey(): boolean { return this.props.primaryKey }
  get unique(): boolean { return this.props.unique }
  get defaultValue(): string | undefined { return this.props.defaultValue }
  get autoIncrement(): boolean { return this.props.autoIncrement }
  get standardRef(): DataItemRef | undefined { return this.props.standardRef }
  get codeValueRef(): CodeValueRef | undefined { return this.props.codeValueRef }
  get sortOrder(): number { return this.props.sortOrder }

  /**
   * GoF: Builder Pattern — 链式构建 Field 值对象
   */
  static builder(): FieldBuilder {
    return new FieldBuilder()
  }

  /**
   * 返回修改后的新字段（值对象不可变）
   */
  withName(name: string): Field {
    return new Field({ ...this.props, name })
  }

  withDataType(dataType: DataType): Field {
    return new Field({ ...this.props, dataType })
  }

  withComment(comment: string): Field {
    return new Field({ ...this.props, comment })
  }

  withStandardRef(ref: DataItemRef): Field {
    return new Field({ ...this.props, standardRef: ref })
  }

  withCodeValueRef(ref: CodeValueRef): Field {
    return new Field({ ...this.props, codeValueRef: ref })
  }

  /**
   * 是否引用了数据标准（用于合规检查）
   */
  hasStandardBinding(): boolean {
    return this.props.standardRef !== undefined
  }
}

/**
 * GoF: Builder Pattern
 */
class FieldBuilder {
  private id: FieldId = FieldId.create()
  private name: string = ''
  private comment: string = ''
  private dataType: DataType = DataType.varchar(255)
  private nullable: boolean = true
  private primaryKey: boolean = false
  private unique: boolean = false
  private defaultValue?: string
  private autoIncrement: boolean = false
  private standardRef?: DataItemRef
  private codeValueRef?: CodeValueRef
  private sortOrder: number = 0

  withId(id: FieldId): this { this.id = id; return this }
  withName(name: string): this { this.name = name; return this }
  withComment(comment: string): this { this.comment = comment; return this }
  withDataType(dataType: DataType): this { this.dataType = dataType; return this }
  withNullable(nullable: boolean): this { this.nullable = nullable; return this }
  withPrimaryKey(pk: boolean): this { this.primaryKey = pk; return this }
  withUnique(unique: boolean): this { this.unique = unique; return this }
  withDefault(val: string): this { this.defaultValue = val; return this }
  withAutoIncrement(ai: boolean): this { this.autoIncrement = ai; return this }
  withStandardRef(ref: DataItemRef): this { this.standardRef = ref; return this }
  withCodeValueRef(ref: CodeValueRef): this { this.codeValueRef = ref; return this }
  withSortOrder(order: number): this { this.sortOrder = order; return this }

  build(): Field {
    if (!this.name) throw new Error('Field name is required')
    return new Field({
      id: this.id,
      name: this.name,
      comment: this.comment,
      dataType: this.dataType,
      nullable: this.nullable,
      primaryKey: this.primaryKey,
      unique: this.unique,
      defaultValue: this.defaultValue,
      autoIncrement: this.autoIncrement,
      standardRef: this.standardRef,
      codeValueRef: this.codeValueRef,
      sortOrder: this.sortOrder,
    })
  }
}
