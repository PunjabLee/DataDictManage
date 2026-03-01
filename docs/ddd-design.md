# DDM DDD 领域模型设计文档

> 版本：v1.0.0 | 层次：领域驱动设计（DDD）

## 一、领域划分原则

DDM 系统按**限界上下文（Bounded Context）**划分为三个领域：

| 上下文 | 英文名 | 核心职责 | 包路径 |
|--------|--------|---------|--------|
| 建模上下文 | Modeling BC | 数据模型结构设计 | `domain/model` |
| 数据标准上下文 | Standard BC | 数据字段的命名和类型标准 | `domain/standard` |
| 团队上下文 | Team BC | 用户、团队、项目管理 | `domain/team` |

---

## 二、建模上下文（Modeling Bounded Context）

### 2.1 聚合边界

```
Model（聚合根）
├── Entity[]（数据表，子聚合根）
│   └── Field[]（字段，值对象）
├── ModelRelation[]（表间关系，值对象）
└── ModelBranch[]（分支版本，值对象）
```

### 2.2 核心不变量

| 聚合根 | 不变量 | 实现位置 |
|--------|--------|---------|
| Model | Entity 名称在模型内唯一 | Model.addEntity() |
| Model | 必须至少有一个主干分支（main） | Model 构造函数 |
| Model | 关系两端的 Entity 必须属于当前 Model | Model.addRelation() |
| Entity | 字段名在表内唯一 | Entity.addField() |
| Entity | 至少保留 1 个字段 | Entity.removeField() |
| DataItem | 标准编码全局唯一 | DataItemRepository（由仓储层保证） |
| CodeValueGroup | 字典 value 在组内唯一 | CodeValueGroup.addItem() |
| Team | 每个团队有且仅有一个 OWNER | Team 业务逻辑 |

### 2.3 领域事件流

```
Model.addEntity()
  → EntityAddedToModelEvent
    → [订阅者] 搜索索引更新
    → [订阅者] 审计日志记录

Entity.modifyField()
  → FieldModifiedEvent
    → [订阅者] 数据标准合规检查
    → [订阅者] 审计日志记录

Model 发布（toSnapshot）
  → ModelSnapshotCreatedEvent
    → [订阅者] MinIO 存储快照
```

### 2.4 跨上下文集成策略

| 交互 | 策略 | 实现方式 |
|------|------|---------|
| Modeling → Standard | 防腐层（ACL）引用 | Field 持有 DataItemRef（只有 ID + 名称） |
| Standard → Modeling | 发布订阅 | DataItemDeprecatedEvent → 触发合规检查 |
| Modeling → Team | 直接 ID 引用 | Model.projectId = ProjectId |

---

## 三、分层架构（COLA-DDD 风格）

```
┌─────────────────────────────────────────────┐
│  接入层（Interface Layer）                   │
│  ModelController / VO / RequestDTO          │
│  职责：HTTP 协议适配，不含业务逻辑           │
├─────────────────────────────────────────────┤
│  应用层（Application Layer）                 │
│  ModelingFacade / DTO / Assembler           │
│  职责：用例协调，不含业务规则               │
├─────────────────────────────────────────────┤
│  领域层（Domain Layer）                      │
│  ModelBO / EntityBO / FieldBO               │
│  ModelDomainService / DomainEvent           │
│  ModelRepository（接口）                    │
│  职责：所有业务规则，不依赖框架             │
├─────────────────────────────────────────────┤
│  基础设施层（Infrastructure Layer）          │
│  ModelRepositoryImpl / ModelPO / Mapper     │
│  SqlDialectAdapter（ACL）                   │
│  职责：持久化/外部系统集成，不含业务逻辑   │
└─────────────────────────────────────────────┘
```

### 分层依赖规则

```
接入层 → 应用层 → 领域层 ← 基础设施层（依赖倒置）
```

- ✅ 领域层不依赖任何框架（Spring/MyBatis 等）
- ✅ 应用层只依赖领域接口，不依赖基础设施实现
- ✅ 基础设施层通过实现领域接口注入（IoC）
- ❌ 领域层不 import `org.springframework.*`
- ❌ 接入层 Controller 不直接调用 Repository

---

## 四、值对象 vs 实体 vs 聚合根

| 概念 | 例子 | 特征 |
|------|------|------|
| 值对象（Value Object） | Field, DataType, DataItemRef | 无独立标识，按值相等，不可变 |
| 实体（Entity） | Entity（表） | 有 EntityId，生命周期由聚合根管理 |
| 聚合根（Aggregate Root） | Model, DataItem, Team | 有全局唯一 ID，外部只通过聚合根访问内部 |

### Field 为什么是值对象？

`Field` 在 DDD 中设计为**值对象**（非实体），原因：

1. Field 的身份意义来自其所有属性的组合，不存在"同一个字段但属性不同"的语义
2. Field 修改时返回新对象（`withName()` / `withDataType()`），体现不可变性
3. Field 无独立生命周期，依附于 Entity（表）存在

---

## 五、Repository 设计规范

```typescript
// 领域层：定义接口（不知道具体实现）
export interface ModelRepository extends Repository<Model> {
  findByProjectId(projectId: ProjectId): Promise<Model[]>
  saveSnapshot(modelId: ModelId, ...): Promise<string>
}

// 基础设施层：实现接口（依赖倒置）
export class ModelRepositoryImpl implements ModelRepository {
  // 使用 MySQL / Redis / MinIO 等具体技术
}
```

---

## 六、领域服务 vs 应用服务

| | 领域服务（Domain Service） | 应用服务（Application Service） |
|---|---|---|
| 包路径 | `domain/service` | `application/service` |
| 含业务规则 | ✅ 是 | ❌ 否 |
| 依赖仓储 | ✅ 是（领域接口） | ✅ 是（通过注入） |
| 依赖框架 | ❌ 否（纯业务逻辑） | ✅ 是（@Transactional 等） |
| 典型方法 | `validateModelName()` / `addEntity()` | `createModel()` / `generateDDL()` |
