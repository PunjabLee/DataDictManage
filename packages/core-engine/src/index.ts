/**
 * @file index.ts
 * @description @ddm/core-engine 包入口 — 统一导出所有公开 API
 * @layer Package Entry Point
 *
 * 导出原则：
 *   - 只导出公开 API（接口、DTO、应用服务、领域对象的类型）
 *   - 不导出内部实现细节（_private 构造函数等）
 *   - 按层次组织导出
 *
 * @module @ddm/core-engine
 */

// ── Shared 基础设施 ───────────────────────────────────────────────────────
export {
  ValueObject,
  UniqueId,
  AggregateRoot,
  Repository,
  Result,
  DomainEvent,
} from './shared/base'

// ── Domain Layer: 建模上下文（Model Bounded Context） ────────────────────

// 类型/枚举/值对象
export {
  ModelId,
  ProjectId,
  EntityId,
  FieldId,
  BranchId,
  TeamId,
  UserId,
  ModelLayer,
  FieldBaseType,
  RelationType,
  DataType,
  DataItemRef,
  CodeValueRef,
} from './domain/model/model-types'

// Field 值对象
export { Field } from './domain/model/field'

// Entity 聚合根
export { Entity } from './domain/model/entity'
export type { AddFieldCommand as EntityAddFieldCommand } from './domain/model/entity'

// Model 聚合根 + 仓储接口
export {
  Model,
  ModelRepository,
} from './domain/model/model'
export type { ModelRelation, ModelBranch } from './domain/model/model'

// Model 工厂
export {
  ModelFactory,
  EntityFactory,
  ModelReconstituter,
  EntityReconstituter,
} from './domain/model/model-factory'
export type {
  CreateModelParams,
  ModelSnapshot,
  EntitySnapshotInput,
  FieldSnapshotInput,
} from './domain/model/model-factory'

// 领域事件
export {
  ModelCreatedEvent,
  EntityAddedToModelEvent,
  EntityRemovedFromModelEvent,
  FieldModifiedEvent,
  ModelSnapshotCreatedEvent,
  ModelPublishedEvent,
} from './domain/model/model-events'

// Diff 领域服务
export { ModelDiffService } from './domain/model/model-diff.service'
export type {
  ModelDiffResult,
  EntityDiff,
  FieldDiff,
} from './domain/model/model-diff.service'

// ── Domain Layer: 数据标准上下文（Standard Bounded Context） ─────────────

// 数据项标准
export {
  DataItemId,
  DataItemStatus,
  DataItem,
  DataItemRepository,
} from './domain/standard/data-item'

// 代码值标准
export {
  CodeGroupId,
  CodeValueItem,
  CodeValueGroup,
  CodeValueGroupRepository,
} from './domain/standard/code-value'

// 命名词根
export {
  NamingRootId,
  NamingRootPartOfSpeech,
  NamingRoot,
  NamingRootRepository,
} from './domain/standard/naming-root'

// 标准上下文领域事件
export {
  DataItemCreatedEvent,
  DataItemUpdatedEvent,
  DataItemPublishedEvent,
  DataItemDeprecatedEvent,
  CodeGroupCreatedEvent,
  CodeGroupItemAddedEvent,
  CodeGroupPublishedEvent,
} from './domain/standard/standard-events'

// ── Domain Layer: 团队上下文（Team Bounded Context） ─────────────────────

// 团队聚合根
export {
  TeamRole,
  TeamMember,
  Team,
  TeamRepository,
} from './domain/team/team'

// 项目聚合根
export {
  ProjectId as TeamProjectId,
  ProjectType,
  ProjectEnv,
  Project,
  ProjectRepository,
} from './domain/team/project'

// ── Infrastructure Layer: SQL 引擎 ────────────────────────────────────────

export {
  SqlEngine,
  DatabaseDialect,
} from './infra/sql-engine'
export type { EntitySnapshot, FieldSnapshot } from './infra/sql-engine'

// 内置方言实现
export {
  MySQLDialect,
  OracleDialect,
  DaMengDialect,
  KingbaseDialect,
} from './infra/dialects'

// ── Application Layer ─────────────────────────────────────────────────────

// DTO
export type {
  CreateModelCommand,
  UpdateModelCommand,
  AddEntityCommand,
  AddFieldCommand,
  ModifyFieldCommand,
  CreateSnapshotCommand,
  GenerateDDLCommand,
  ModelListDTO,
  ModelDetailDTO,
  EntityDTO,
  FieldDTO,
  RelationDTO,
  BranchDTO,
  DDLResultDTO,
} from './application/dto/model.dto'

// 装配器
export { ModelAssembler } from './application/assembler/model.assembler'

// 应用服务
export {
  ModelingAppService,
  SqlEnginePort,
  DomainEventPublisher,
} from './application/service/modeling-app.service'
