import { DomainEvent } from '../shared/base'
import { ModelId, EntityId, FieldId } from './model-types'
import { Field } from './field'

/**
 * 领域事件定义
 * GoF: Observer Pattern — 通过事件解耦各聚合间通信
 * 应用层订阅这些事件，触发副作用（通知推送、合规检查、MQ发布等）
 */

export class ModelCreatedEvent implements DomainEvent {
  readonly eventType = 'MODEL_CREATED'
  readonly occurredAt = new Date()
  constructor(
    public readonly modelId: ModelId,
    public readonly projectId: string,
    public readonly operatorId: string,
  ) {}
}

export class EntityAddedToModelEvent implements DomainEvent {
  readonly eventType = 'ENTITY_ADDED'
  readonly occurredAt = new Date()
  constructor(
    public readonly modelId: ModelId,
    public readonly entityId: EntityId,
    public readonly entityName: string,
    public readonly operatorId: string,
  ) {}
}

export class EntityRemovedFromModelEvent implements DomainEvent {
  readonly eventType = 'ENTITY_REMOVED'
  readonly occurredAt = new Date()
  constructor(
    public readonly modelId: ModelId,
    public readonly entityId: EntityId,
    public readonly operatorId: string,
  ) {}
}

/**
 * 字段修改事件 — 触发数据标准合规检查
 */
export class FieldModifiedEvent implements DomainEvent {
  readonly eventType = 'FIELD_MODIFIED'
  readonly occurredAt = new Date()
  constructor(
    public readonly entityId: EntityId,
    public readonly fieldId: FieldId,
    public readonly oldField: Field,
    public readonly newField: Field,
    public readonly operatorId: string,
  ) {}
}

export class ModelSnapshotCreatedEvent implements DomainEvent {
  readonly eventType = 'SNAPSHOT_CREATED'
  readonly occurredAt = new Date()
  constructor(
    public readonly modelId: ModelId,
    public readonly snapshotId: string,
    public readonly versionTag: string,
    public readonly operatorId: string,
  ) {}
}

export class ModelPublishedEvent implements DomainEvent {
  readonly eventType = 'MODEL_PUBLISHED'
  readonly occurredAt = new Date()
  constructor(
    public readonly modelId: ModelId,
    public readonly shareToken: string,
    public readonly operatorId: string,
  ) {}
}
