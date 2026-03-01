# Changelog

All notable changes to DataDictManage will be documented in this file.
Format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0-SNAPSHOT] - 2024-03-01 — Phase 1: Core Modeling Engine

### Added

#### core-engine (TypeScript, DDD)
- `AggregateRoot`, `ValueObject`, `UniqueId`, `Result` — DDD 基础类
- `Model` 聚合根（Entity/Relation/Branch 管理，GoF: Memento 快照）
- `Entity` 聚合根（Field 管理，不变量保证）
- `Field` 值对象（GoF: Builder 链式构建）
- `ModelFactory` — GoF Factory Method，支持 create/reconstitute
- `ModelDiffService` — 跨聚合 Diff 领域服务
- 数据标准上下文：`DataItem`、`CodeValueGroup`、`NamingRoot`
- 团队上下文：`Team`（成员角色管理）、`Project`（模型容器）
- 应用层：`ModelingAppService`（GoF Facade）、`ModelAssembler`、DTO 定义
- 领域事件：7 个 DomainEvent（ModelCreated/EntityAdded/FieldModified 等）
- 方言实现：`MySQLDialect`、`OracleDialect`、`DaMengDialect`、`KingbaseDialect`

#### canvas-render (TypeScript)
- `CanvasEngine` — Canvas 2D 渲染引擎（HiDPI/虚拟化渲染/rAF 渲染循环）
- `Viewport` — 视口管理（坐标转换/缩放/平移/fitContent）
- `NodeRenderer` — 数据表卡片渲染（斑马纹/标记符号/状态样式）
- `EdgeRenderer` — 关系连线渲染（直线/折线/贝塞尔曲线/关系标记符号）
- `InteractionManager` — 交互管理（拖拽/平移/缩放/事件派发）

#### db-dialect (TypeScript)
- 7 种数据库方言：MySQL 8 / PostgreSQL 15 / Oracle 19c / 达梦 DM8 / 金仓 KingbaseES / SQL Server 2019 / ClickHouse 24
- `DialectRegistry` — GoF Singleton + Registry 模式
- 每种方言支持：类型映射/建表/加列/改列/删列/索引/分页

#### desktop-ce (Electron + React)
- Electron 28 主进程（窗口管理/IPC/菜单/系统对话框）
- Preload 安全桥接（contextBridge，GoF Bridge）
- React 18 渲染进程（HashRouter + 两个页面）
- Zustand 状态管理（含撤销/重做历史栈，GoF Command + Memento）
- 首页（项目/模型列表卡片）
- 建模设计器页面（Canvas + Sidebar + Toolbar 布局）

#### ee-backend (Spring Boot 3, Java 17)
- Maven 多模块（pdmaas-common/gateway/auth/modeling）
- `pdmaas-common`：统一响应 `R<T>`、`BizException`、全局异常处理器、分页工具
- `pdmaas-gateway`：Spring Cloud Gateway 路由/限流配置
- `pdmaas-auth`：JWT 签发（JJWT 0.12）、登录/刷新/登出接口
- `pdmaas-modeling`：完整 DDD 四层
  - 接入层：`ModelController`、`ModelVO`
  - 应用层：`ModelingFacade`、`CreateModelDTO`、`ModelAssembler`
  - 领域层：`ModelBO/EntityBO/FieldBO`、`ModelRepository`（接口）、`ModelDomainService`、`ModelCreatedEvent`
  - 基础设施层：`ModelPO`、`ModelMapper`、`ModelRepositoryImpl`、`SqlDialectPort`（ACL 防腐层）

#### docs
- `architecture.md` — 系统整体架构（ASCII 架构图）
- `ddd-design.md` — DDD 领域模型设计文档
- `dev-guide.md` — 本地开发快速启动指南
- `api.md` — REST API 文档
- `git-workflow.md` — Git 分支工作流规范

### GoF 设计模式使用统计
- Factory Method: 5 处
- Builder: 4 处
- Strategy: 6 处
- Observer: 3 处
- Facade: 4 处
- Repository: 2 处
- Singleton: 1 处
- Adapter: 3 处
- Template Method: 3 处
- Memento: 2 处
- Composite: 1 处
- Command: 2 处

---

## [0.1.0] - 2024-02-01 — Monorepo 框架搭建

### Added
- pnpm Monorepo + Turborepo 基础框架
- `packages/core-engine` 骨架（基础 DDD 类）
- `infra/docker-compose.yml`（MySQL + Redis + RabbitMQ + MinIO）
- `infra/sql/schema.sql`（15 张核心数据库表）
- 基础 tsconfig.base.json 配置
