/**
 * @file standard-events.ts
 * @description 数据标准上下文（Standard Bounded Context）领域事件定义
 * @layer Domain Layer — domain/standard
 *
 * 职责：
 *   标准上下文向外发布的领域事件。
 *   其他上下文（如建模上下文）订阅这些事件，实现松耦合集成。
 *
 * @pattern GoF: Observer Pattern
 *   发布方：DataItem / CodeValueGroup / NamingRoot 聚合根
 *   订阅方：应用层事件处理器（触发合规检查、通知、索引更新等）
 *
 * @module @ddm/core-engine
 */

import { DomainEvent } from '../../shared/base'
import type { DataItemId } from './data-item'
import type { CodeGroupId } from './code-value'

// ── 数据项（DataItem）相关事件 ────────────────────────────────────────────

/**
 * 数据项创建事件
 * 触发：搜索索引更新、审计日志记录
 */
export class DataItemCreatedEvent implements DomainEvent {
  readonly eventType = 'DATA_ITEM_CREATED'
  readonly occurredAt = new Date()

  constructor(
    /** 数据项 ID */
    public readonly dataItemId: DataItemId,
    /** 标准编码 */
    public readonly code: string,
    /** 中文名称 */
    public readonly name: string,
    /** 操作人 */
    public readonly operatorId: string,
  ) {}
}

/**
 * 数据项更新事件
 * 触发：检查所有引用了此数据项的字段是否仍然合规
 */
export class DataItemUpdatedEvent implements DomainEvent {
  readonly eventType = 'DATA_ITEM_UPDATED'
  readonly occurredAt = new Date()

  constructor(
    public readonly dataItemId: DataItemId,
    public readonly code: string,
    /** 更新后的版本号 */
    public readonly newVersion: number,
    public readonly operatorId: string,
  ) {}
}

/**
 * 数据项发布事件
 * 触发：通知建模模块，该数据标准可被引用
 */
export class DataItemPublishedEvent implements DomainEvent {
  readonly eventType = 'DATA_ITEM_PUBLISHED'
  readonly occurredAt = new Date()

  constructor(
    public readonly dataItemId: DataItemId,
    public readonly code: string,
    public readonly operatorId: string,
  ) {}
}

/**
 * 数据项废弃事件
 * 触发：通知建模模块，该数据标准已废弃，有引用的字段需要更新
 */
export class DataItemDeprecatedEvent implements DomainEvent {
  readonly eventType = 'DATA_ITEM_DEPRECATED'
  readonly occurredAt = new Date()

  constructor(
    public readonly dataItemId: DataItemId,
    public readonly code: string,
    public readonly deprecationReason: string,
    public readonly operatorId: string,
  ) {}
}

// ── 代码值组（CodeValueGroup）相关事件 ──────────────────────────────────

/**
 * 代码值组创建事件
 */
export class CodeGroupCreatedEvent implements DomainEvent {
  readonly eventType = 'CODE_GROUP_CREATED'
  readonly occurredAt = new Date()

  constructor(
    public readonly groupId: CodeGroupId,
    public readonly code: string,
    public readonly name: string,
    public readonly operatorId: string,
  ) {}
}

/**
 * 代码值条目添加事件
 */
export class CodeGroupItemAddedEvent implements DomainEvent {
  readonly eventType = 'CODE_GROUP_ITEM_ADDED'
  readonly occurredAt = new Date()

  constructor(
    public readonly groupId: CodeGroupId,
    public readonly groupCode: string,
    public readonly itemValue: string,
    public readonly itemLabel: string,
    public readonly operatorId: string,
  ) {}
}

/**
 * 代码值组发布事件
 */
export class CodeGroupPublishedEvent implements DomainEvent {
  readonly eventType = 'CODE_GROUP_PUBLISHED'
  readonly occurredAt = new Date()

  constructor(
    public readonly groupId: CodeGroupId,
    public readonly code: string,
    public readonly operatorId: string,
  ) {}
}
