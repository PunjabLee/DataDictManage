/**
 * @file model.dto.ts
 * @description 建模上下文应用层 DTO 定义
 * @layer Application Layer — application/dto
 *
 * 职责：
 *   DTO（Data Transfer Object）是应用层与外部（接入层、前端）之间的数据契约。
 *   DTO 只携带数据，不含业务逻辑，不引用领域对象。
 *
 * 设计原则：
 *   - DTO 扁平化，避免嵌套过深
 *   - 字段全部为 primitive 类型（string/number/boolean），不含领域类型
 *   - 命令 DTO（xxxCommand/xxxRequest）用于入参
 *   - 查询 DTO（xxxDTO/xxxView）用于出参
 *
 * @module @ddm/core-engine
 */

// ── 创建/更新命令 DTO ────────────────────────────────────────────────────

/**
 * 创建 Model 命令（前端/接入层 → 应用层）
 */
export interface CreateModelCommand {
  /** 模型名称（必填） */
  name: string
  /** 所属项目 ID（必填） */
  projectId: string
  /** 操作者用户 ID（由认证上下文注入） */
  operatorId: string
  /** 模型描述（可选） */
  description?: string
}

/**
 * 更新 Model 基本信息命令
 */
export interface UpdateModelCommand {
  modelId: string
  operatorId: string
  name?: string
  description?: string
}

/**
 * 添加 Entity（表）命令
 */
export interface AddEntityCommand {
  modelId: string
  operatorId: string
  /** 表名（英文，下划线分隔） */
  name: string
  /** 表注释/中文名称 */
  comment?: string
  /** 建模层次（默认 PHYSICAL） */
  layer?: 'CONCEPTUAL' | 'LOGICAL' | 'PHYSICAL'
}

/**
 * 添加 Field（字段）命令
 */
export interface AddFieldCommand {
  modelId: string
  entityId: string
  operatorId: string
  name: string
  comment?: string
  /** 基础类型 */
  baseType: string
  length?: number
  precision?: number
  scale?: number
  nullable?: boolean
  primaryKey?: boolean
  unique?: boolean
  autoIncrement?: boolean
  defaultValue?: string
  sortOrder?: number
  /** 绑定的数据项标准 ID */
  standardId?: string
  /** 绑定的代码值组 ID */
  codeValueGroupId?: string
}

/**
 * 修改字段命令
 */
export interface ModifyFieldCommand {
  modelId: string
  entityId: string
  fieldId: string
  operatorId: string
  name?: string
  comment?: string
  baseType?: string
  length?: number
  nullable?: boolean
}

/**
 * 创建快照命令
 */
export interface CreateSnapshotCommand {
  modelId: string
  operatorId: string
  versionTag: string
  description?: string
}

/**
 * 生成 DDL 命令
 */
export interface GenerateDDLCommand {
  modelId: string
  /** 目标数据库类型（MYSQL/POSTGRESQL/ORACLE/DAMENG/KINGBASE） */
  dbType: string
  /** 仅生成指定表（为空则生成全部） */
  entityIds?: string[]
}

// ── 查询出参 DTO ─────────────────────────────────────────────────────────

/**
 * Model 列表视图 DTO
 */
export interface ModelListDTO {
  id: string
  name: string
  description: string
  projectId: string
  entityCount: number
  currentBranchName: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

/**
 * Model 详情 DTO（含所有 Entity 和 Relation）
 */
export interface ModelDetailDTO {
  id: string
  name: string
  description: string
  projectId: string
  currentBranchId: string
  entities: EntityDTO[]
  relations: RelationDTO[]
  branches: BranchDTO[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

/**
 * Entity 详情 DTO
 */
export interface EntityDTO {
  id: string
  name: string
  comment: string
  layer: string
  fields: FieldDTO[]
  createdAt: string
  updatedAt: string
}

/**
 * Field 详情 DTO
 */
export interface FieldDTO {
  id: string
  name: string
  comment: string
  baseType: string
  length?: number
  precision?: number
  scale?: number
  nullable: boolean
  primaryKey: boolean
  unique: boolean
  autoIncrement: boolean
  defaultValue?: string
  sortOrder: number
  /** 绑定的数据标准信息 */
  standardId?: string
  standardName?: string
  /** 绑定的代码值组信息 */
  codeValueGroupId?: string
  codeValueGroupName?: string
  /** 是否绑定了数据标准 */
  hasStandardBinding: boolean
}

/**
 * 关系 DTO
 */
export interface RelationDTO {
  id: string
  fromEntityId: string
  toEntityId: string
  type: string
  comment?: string
}

/**
 * 分支 DTO
 */
export interface BranchDTO {
  id: string
  name: string
  isMain: boolean
  parentBranchId?: string
  createdAt: string
}

/**
 * DDL 生成结果 DTO
 */
export interface DDLResultDTO {
  modelId: string
  dbType: string
  sql: string
  generatedAt: string
  entityCount: number
}
