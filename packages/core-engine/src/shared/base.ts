/**
 * 值对象基类
 * GoF: Value Object Pattern
 * 值对象无独立生命周期，靠属性相等判断是否相同
 */
export abstract class ValueObject<T> {
  protected readonly props: T

  constructor(props: T) {
    this.props = Object.freeze(props)
  }

  equals(other: ValueObject<T>): boolean {
    return JSON.stringify(this.props) === JSON.stringify(other.props)
  }
}

/**
 * 强类型 ID 基类
 * 避免 string/number 的 ID 混用导致的运行时错误
 */
export abstract class UniqueId extends ValueObject<{ value: string }> {
  get value(): string {
    return this.props.value
  }

  static generate(): string {
    return crypto.randomUUID()
  }

  toString(): string {
    return this.props.value
  }
}

/**
 * 聚合根基类
 * GoF: Template Method（registerEvent / pullDomainEvents）
 */
export abstract class AggregateRoot<TId extends UniqueId> {
  private _domainEvents: DomainEvent[] = []

  abstract get id(): TId

  protected registerEvent(event: DomainEvent): void {
    this._domainEvents.push(event)
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents]
    this._domainEvents = []
    return events
  }
}

/**
 * 领域事件基类
 */
export interface DomainEvent {
  readonly occurredAt: Date
  readonly eventType: string
}

/**
 * 仓储接口基类（依赖倒置原则：领域层定义接口，基础设施层实现）
 */
export interface Repository<T extends AggregateRoot<UniqueId>> {
  findById(id: UniqueId): Promise<T | null>
  save(entity: T): Promise<void>
  delete(id: UniqueId): Promise<void>
}

/**
 * 结果对象（避免 throw/catch 满天飞）
 * GoF: Null Object Pattern 变体
 */
export class Result<T> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: string
  ) {}

  static ok<T>(value?: T): Result<T> {
    return new Result<T>(true, value)
  }

  static fail<T>(error: string): Result<T> {
    return new Result<T>(false, undefined, error)
  }

  get isSuccess(): boolean { return this._isSuccess }
  get isFailure(): boolean { return !this._isSuccess }
  get value(): T { return this._value as T }
  get error(): string { return this._error as string }
}
