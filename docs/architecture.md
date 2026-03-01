# DataDictManage — 系统架构说明

> 版本：v1.0.0-SNAPSHOT | 更新时间：2024-03

## 一、系统概述

DataDictManage（简称 DDM）是企业级元数据建模与数据标准管理平台，提供：

- **可视化数据建模**：ER 图设计，支持概念/逻辑/物理三层建模
- **多数据库方言**：一键生成 MySQL/PG/Oracle/达梦/金仓/SQLServer/ClickHouse DDL
- **数据标准管理**：数据项标准、代码值、命名词根的统一管理
- **版本控制**：类 Git 的模型分支和快照管理
- **多端支持**：桌面端（Electron CE）和 SaaS 版（EE）

---

## 二、整体架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           客户端层（Client）                              │
├──────────────────┬──────────────────┬──────────────────────────────────┤
│  Desktop CE      │  Web EE（SaaS）  │  CLI 工具（未来）                  │
│  Electron + React│  React SPA       │                                   │
└──────────────────┴──────────────────┴──────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    API 网关（pdmaas-gateway）                             │
│              Spring Cloud Gateway 8080                                   │
│   [路由] [JWT 校验] [限流 RateLimiter] [CORS] [链路追踪]                 │
└──────────────┬──────────────────────────────────────────────────────────┘
               │
   ┌───────────┴────────────────────────────────────┐
   │                                                 │
   ▼                                                 ▼
┌──────────────────────┐              ┌──────────────────────────────────┐
│  pdmaas-auth :8081   │              │  pdmaas-modeling :8082           │
│  认证微服务          │              │  建模微服务                       │
│  JWT 签发 / 校验     │              │  DDD 四层架构                     │
└──────────────────────┘              └──────────────────────────────────┘
         │                                           │
         ▼                                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           基础设施层（Infrastructure）                   │
├──────────────┬──────────────┬──────────────────┬────────────────────────┤
│  MySQL 8.0   │  Redis 7     │  RabbitMQ 3.12   │  MinIO（快照存储）      │
│  主数据库    │  缓存/限流   │  领域事件 MQ      │                        │
└──────────────┴──────────────┴──────────────────┴────────────────────────┘
```

---

## 三、包结构（Monorepo）

```
DataDictManage/
├── packages/
│   ├── core-engine/         # 领域核心引擎（TypeScript，DDD）
│   │   ├── src/shared/      # 共享基础类（AggregateRoot, Result 等）
│   │   ├── src/domain/      # 领域层
│   │   │   ├── model/       # 建模上下文（Model/Entity/Field）
│   │   │   ├── standard/    # 数据标准上下文（DataItem/CodeValue/NamingRoot）
│   │   │   └── team/        # 团队上下文（Team/Project）
│   │   ├── src/application/ # 应用层（DTO/Assembler/AppService）
│   │   └── src/infra/       # 基础设施（SqlEngine/Dialects）
│   │
│   ├── canvas-render/       # Canvas 渲染引擎（ER 图渲染）
│   │   └── src/engine/      # 核心引擎（CanvasEngine/NodeRenderer/EdgeRenderer）
│   │
│   ├── db-dialect/          # 数据库方言适配器（纯 TS，7种数据库）
│   │   └── src/dialects/    # MySQL/PG/Oracle/DaMeng/Kingbase/SQLServer/ClickHouse
│   │
│   └── desktop-ce/          # Electron 桌面端（Community Edition）
│       ├── src/main.ts      # Electron 主进程
│       ├── src/preload.ts   # IPC 桥接
│       └── src/renderer/    # React 渲染进程（页面/组件/Store/Hooks）
│
├── services/
│   └── ee-backend/          # EE 后端（Spring Boot 3，Maven 多模块）
│       ├── pdmaas-common/   # 公共模块（R/BizException/PageUtils）
│       ├── pdmaas-gateway/  # API 网关（Spring Cloud Gateway）
│       ├── pdmaas-auth/     # 认证服务（JWT）
│       └── pdmaas-modeling/ # 建模微服务（DDD 四层）
│
├── infra/
│   ├── docker-compose.yml   # MySQL + Redis + RabbitMQ + MinIO
│   └── sql/schema.sql       # 15 张核心数据库表
│
└── docs/                    # 文档
```

---

## 四、技术栈

| 分类 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 前端框架 | React | 18 | UI 组件 |
| 桌面 | Electron | 28 | 桌面应用壳 |
| 状态管理 | Zustand | 4 | 全局状态 |
| 构建工具 | Vite | 5 | 前端构建 |
| 包管理 | pnpm + Turborepo | 8/1.13 | Monorepo 管理 |
| 语言（前端） | TypeScript | 5.4 | 类型安全 |
| 后端框架 | Spring Boot | 3.2 | 微服务框架 |
| 语言（后端） | Java | 17 | 后端开发 |
| ORM | MyBatis-Plus | 3.5 | 数据库访问 |
| 数据库 | MySQL | 8.0 | 主数据存储 |
| 缓存 | Redis | 7 | 缓存/限流 |
| 消息队列 | RabbitMQ | 3.12 | 领域事件 |
| 对象存储 | MinIO | RELEASE.2024 | 快照存储 |
| 网关 | Spring Cloud Gateway | 4.1 | API 路由/鉴权 |
| 认证 | JJWT | 0.12 | JWT Token |

---

## 五、DDD 领域划分

### 限界上下文（Bounded Context）

```
┌─────────────────────────────────────────────────────────────────────┐
│                    建模上下文（Modeling BC）                          │
│  Model → Entity → Field → Relation → Branch                         │
│  ModelFactory / ModelDiffService / ModelDomainService               │
└─────────────────────────────────────────────────────────────────────┘
                         ↑ DataItemRef（跨上下文引用）
┌─────────────────────────────────────────────────────────────────────┐
│                  数据标准上下文（Standard BC）                        │
│  DataItem → CodeValueGroup → NamingRoot                             │
└─────────────────────────────────────────────────────────────────────┘
                         ↑ TeamId/ProjectId（跨上下文引用）
┌─────────────────────────────────────────────────────────────────────┐
│                    团队上下文（Team BC）                               │
│  Team → TeamMember → Project                                         │
└─────────────────────────────────────────────────────────────────────┘
```

### 核心聚合根

| 聚合根 | 所属上下文 | 描述 |
|--------|-----------|------|
| Model | Modeling | 数据模型（含 Entity/Field/Relation/Branch） |
| Entity | Modeling | 数据表（含字段集合） |
| DataItem | Standard | 数据项标准 |
| CodeValueGroup | Standard | 代码值枚举字典 |
| NamingRoot | Standard | 命名词根 |
| Team | Team | 团队（含成员） |
| Project | Team | 项目（含模型 ID 集合） |

---

## 六、GoF 设计模式汇总

| 模式 | 应用位置 | 说明 |
|------|---------|------|
| Factory Method | ModelFactory / DataItem.create() | 封装聚合根构造 |
| Builder | Field.builder() / ModelBO.builder() | 链式构建复杂对象 |
| Strategy | SqlEngine + 各方言 / CanvasEngine + EdgeStyle | 可替换的算法族 |
| Observer | DomainEvent + ApplicationEventPublisher | 领域事件解耦 |
| Facade | ModelingAppService / ModelingFacade | 统一应用层入口 |
| Repository | ModelRepository 接口 + 实现 | 聚合根持久化抽象 |
| Singleton | DialectRegistry | 方言注册中心 |
| Adapter | ModelAssembler / ModelRepositoryImpl | BO/VO/PO 转换 |
| Template Method | CanvasEngine.render() / AggregateRoot.pullDomainEvents | 固定流程+可扩展步骤 |
| Memento | Model.toSnapshot() | 版本快照 |
| Composite | RenderGraph（nodes + edges） | 树形结构渲染图 |
| Command | AppService 的每个方法对应一个命令 | 操作封装 |

---

## 七、数据流

### 创建模型流程

```
用户点击"新建模型"
  → [接入层] ModelController.createModel(CreateModelDTO)
  → [应用层] ModelingFacade.createModel(dto, operatorId)
     → [领域服务] ModelDomainService.createModel(name, projectId)
        → 检查名称唯一性（调用 ModelRepository.findByProjectIdAndName）
        → 构建 ModelBO（含默认主干分支）
     → [仓储] ModelRepository.save(ModelBO)
        → [基础设施] ModelRepositoryImpl.save(ModelBO)
           → PO 转换 → MyBatis-Plus.insert(ModelPO)
     → ApplicationEventPublisher.publishEvent(ModelCreatedEvent)
  → [装配器] ModelAssembler.toVO(ModelBO)
  → 返回 R<ModelVO>
```
