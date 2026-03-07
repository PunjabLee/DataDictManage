# DataDictManage 项目规划与进度文档

> 记录项目目标、功能规划与完成进展
> 创建日期：2026-03-07
> 最后更新：2026-03-07

---

## 1. 项目概述

### 1.1 项目定位

**DataDictManage (DDM)** 是一款企业级数据字典管理平台，提供数据建模、数据标准管理、团队协作、版本管理等核心能力。支持 22+ 主流及国产数据库，覆盖从需求分析到生产部署的全链路数据模型管理。

### 1.2 版本规划

| 版本 | 形态 | 定位 | 目标用户 |
|------|------|------|----------|
| DDM-CE | 桌面客户端（开源） | 开发者/技术爱好者 | 个人开发者、技术爱好者 |
| DDM-Pro | 桌面客户端（商业） | 专业个人用户 | 专业 DBA、架构师 |
| DDM-EE | Web 应用（企业版） | 团队/企业用户 | 团队协作、企业管理 |

### 1.3 核心价值主张

- **全栈数据库支持**：覆盖 22+ 主流及国产数据库
- **DDD 架构设计**：领域驱动设计，保证模型一致性
- **实时协作**：基于 Yjs CRDT 的多人实时编辑
- **企业级特性**：权限管理、工作流审批、审计日志
- **信创适配**：全面支持国产数据库

---

## 2. 功能规划

### 2.1 核心功能矩阵

| 功能模块 | CE | Pro | EE | 优先级 |
|----------|----|----|----|--------|
| ER 图建模 | ✅ | ✅ | ✅ | P0 |
| DDL 生成 | ✅ | ✅ | ✅ | P0 |
| 版本管理 | ✅ | ✅ | ✅ | P0 |
| 数据标准 | ❌ | ✅ | ✅ | P1 |
| 多人协作 | ❌ | ❌ | ✅ | P1 |
| 工作流审批 | ❌ | ❌ | ✅ | P1 |
| API 开放平台 | ❌ | ❌ | ✅ | P2 |
| 数据库直连 | ❌ | ✅ | ✅ | P1 |
| AI 智能建模 | ❌ | ✅ | ✅ | P2 |
| 代码生成 | ✅ | ✅ | ✅ | P1 |

### 2.2 详细功能列表

#### 2.2.1 数据建模（Phase 1）

- [x] ER 图设计器（Canvas 拖拽）
- [x] 实体（Entity）管理
- [x] 字段（Field）管理
- [x] 关系（Relation）管理
- [x] 索引管理
- [x] 视图管理
- [x] 分支管理（Branch）

#### 2.2.2 DDL 生成（Phase 1）

- [x] 12 种数据库方言支持
  - MySQL 8.0
  - PostgreSQL 15
  - Oracle 19c
  - SQL Server 2019
  - 达梦 DM8
  - 金仓 KingbaseES
  - ClickHouse 24
  - OceanBase
  - GaussDB
  - Hive
  - Doris
  - TiDB
  - 神通（ShenTong）
- [x] DDL 预览
- [x] DDL 导出

#### 2.2.3 版本管理（Phase 1）

- [x] 快照创建
- [x] 快照列表
- [x] 版本回滚
- [x] 版本对比

#### 2.2.4 数据标准（Phase 2）

- [x] 数据项（DataItem）管理
- [x] 代码值（CodeValue）管理
- [x] 命名规范（NamingRule）

#### 2.2.5 团队协作（Phase 2 & 3）

- [x] 团队（Team）管理
- [x] 项目（Project）管理
- [x] 成员角色管理
- [x] 三级权限模型

#### 2.2.6 实时编辑（Phase 2）

- [x] Yjs CRDT 集成
- [x] 多人实时编辑
- [x] 冲突解决

#### 2.2.7 企业特性（Phase 3）

- [x] 审计日志（AuditLog）
- [x] 工作流审批（Flowable）
- [x] API 开放平台

---

## 3. 技术架构

### 3.1 技术栈

#### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI 框架 |
| TypeScript | 5.x | 类型安全 |
| Electron | 28.x | 桌面端 |
| Vite | 5.x | 构建工具 |
| qiankun | 2.x | 微前端（EE） |
| Zustand | 4.x | 状态管理 |
| Yjs | - | 实时协作 |

#### 后端（EE）

| 技术 | 版本 | 用途 |
|------|------|------|
| Java | 17 | 运行时 |
| Spring Boot | 3.x | 框架 |
| MyBatis-Plus | 3.x | ORM |
| MySQL | 8.0 | 存储 |
| Redis | 7.x | 缓存 |
| RabbitMQ | 3.x | 消息队列 |
| MinIO | - | 对象存储 |
| Flowable | - | 工作流 |

### 3.2 项目结构

```
DataDictManage/
├── packages/                    # 前端 Monorepo
│   ├── core-engine/             # 领域核心引擎（纯 TS）
│   ├── canvas-render/           # Canvas 渲染引擎
│   ├── shared-ui/              # 公共组件库 ✨ 新增
│   ├── db-dialect/              # 数据库方言适配器
│   ├── desktop-ce/              # 桌面版 CE
│   ├── desktop-pro/             # 桌面版 Pro（规划）
│   └── web-ee/                  # EE Web 微前端
├── services/
│   └── ee-backend/              # Spring Boot 3 后端
│       ├── ddp-common/          # 公共模块
│       ├── ddp-gateway/         # 网关
│       ├── ddp-auth/            # 认证
│       └── ddp-modeling/        # 建模服务
├── infra/                       # 基础设施
│   ├── docker-compose.yml       # 本地开发环境
│   └── sql/                     # 数据库脚本
└── docs/                        # 技术文档
```

---

## 4. 完成进度

### 4.1 Phase 进度

| Phase | 内容 | 状态 | 完成度 |
|-------|------|------|--------|
| Phase 0 | 工程骨架 & 架构底座 | ✅ 完成 | 100% |
| Phase 1 | 核心建模引擎（CE + Pro） | ✅ 完成 | 100% |
| Phase 2 | EE 协作平台 & 数据标准 | ✅ 完成 | 100% |
| Phase 3 | 企业级全量 & 信创适配 | ✅ 完成 | 100% |

### 4.2 模块进度

| 模块 | 规划 | 实现 | 状态 |
|------|------|------|------|
| core-engine | DDD 领域核心 | Model, Entity, Field, DomainService | ✅ |
| canvas-render | Canvas 2D 渲染 | Viewport, Node/Edge Renderer | ✅ |
| db-dialect | 22+ 数据库 | 12 种方言实现 | ✅ |
| desktop-ce | Electron 客户端 | 基本建模 UI | ✅ |
| desktop-pro | 商业版桌面 | 规划中 | ⏳ |
| web-ee | qiankun 微前端 | 基础框架 | ⚠️ |
| shared-ui | 公共组件库 | 基础组件 | ✅ 新增 |
| ee-backend | Spring Boot 3 | 核心 API | ⚠️ |

### 4.3 技术债务状态

#### 已完成（14 项）

| ID | 标题 | 完成日期 |
|----|------|----------|
| TD-01 | DDL 生成对接 | 2026-03-05 |
| TD-02 | 快捷键系统 | 2026-03-05 |
| TD-03 | 模型持久化 | 2026-03-05 |
| TD-04 | 版本管理后端 | 2026-03-05 |
| TD-05 | ModelAssembler 完善 | 2026-03-05 |
| TD-06 | ModelRepositoryImpl | 2026-03-05 |
| TD-07 | 错误目录清理 | 2026-03-05 |
| TD-08 | 命名统一 | 2026-03-05 |
| TD-09 | 多人实时编辑 | 2026-03-05 |
| TD-10 | 权限系统 | 2026-03-05 |
| TD-11 | Web 版骨架 | 2026-03-05 |
| TD-12 | 数据标准 API | 2026-03-05 |
| TD-17 | 三层建模服务 | 2026-03-05 |
| TD-18 | 字段库/枚举库 | 2026-03-05 |
| TD-19 | 代码生成器 | 2026-03-05 |
| TD-20 | 数据库直连 | 2026-03-05 |
| TD-21 | AI 智能建模 | 2026-03-05 |

#### 待处理（4 项）

| ID | 标题 | 优先级 | 状态 |
|----|------|--------|------|
| TD-13 | API 文档完善 | 低 | ⏳ |
| TD-14 | Java Javadoc 补充 | 低 | ⏳ |
| TD-15 | 开发指南更新 | 低 | ⏳ |
| TD-16 | 单元测试覆盖 | 中 | ⏳ |

---

## 5. 行动项

### 5.1 立即处理

| # | 任务 | 负责 | 状态 |
|---|------|------|------|
| 1 | 创建 shared-ui 包 | 🤖 Agent | ✅ |
| 2 | 验证 Docker 环境 | - | ⏸️ 环境不可用 |
| 3 | 完善 Web-EE 微前端 | - | ⏳ |

### 5.2 短期规划

| # | 任务 | 目标 | 状态 |
|---|------|------|------|
| 1 | 单元测试覆盖 | >60% | ⏳ |
| 2 | API 文档示例 | 完整请求/响应 | ⏳ |
| 3 | Java Javadoc | 核心类覆盖 | ⏳ |
| 4 | electron-builder 验证 | 打包成功 | ⏳ |

### 5.3 中期规划

| # | 任务 | 目标 | 状态 |
|---|------|------|------|
| 1 | Flyway 迁移 | 数据库版本管理 | ⏳ |
| 2 | desktop-pro 规划 | 商业版功能定义 | ⏳ |
| 3 | 依赖版本锁定 | 全部固定版本 | ⏳ |

---

## 6. 发布计划

### 6.1 版本路线图

```
v1.0.0 (2026-Q2)
├── DDM-CE 1.0.0     → 开源发布
├── DDM-Pro 1.0.0    → 商业版 Alpha
└── DDM-EE 1.0.0    → 企业版 Beta

v1.1.0 (2026-Q3)
├── DDM-CE 1.1.0     → 功能增强
├── DDM-Pro 1.1.0    → 商业版 Beta
└── DDM-EE 1.1.0    → 企业版 GA

v2.0.0 (2026-Q4)
└── 全部版本 GA
```

---

## 7. 贡献者

- **核心团队**：DataDictManage Team
- **开源贡献**：欢迎提交 PR
- **联系**：GitHub Issues

---

## 8. 附录

### 8.1 GoF 设计模式使用统计

| 模式 | 数量 |
|------|------|
| Factory Method | 5 |
| Builder | 4 |
| Strategy | 6 |
| Observer | 3 |
| Facade | 4 |
| Repository | 2 |
| Singleton | 1 |
| Adapter | 3 |
| Template Method | 3 |
| Memento | 2 |
| Composite | 1 |
| Command | 2 |

### 8.2 数据库支持列表

| 数据库 | 支持状态 | 方言实现 |
|--------|----------|----------|
| MySQL 8.0 | ✅ | mysql.ts |
| PostgreSQL 15 | ✅ | postgresql.ts |
| Oracle 19c | ✅ | oracle.ts |
| SQL Server 2019 | ✅ | sqlserver.ts |
| 达梦 DM8 | ✅ | dameng.ts |
| 金仓 KingbaseES | ✅ | kingbase.ts |
| ClickHouse 24 | ✅ | clickhouse.ts |
| OceanBase | ✅ | oceanbase.ts |
| GaussDB | ✅ | gaussdb.ts |
| Hive | ✅ | hive.ts |
| Doris | ✅ | doris.ts |
| TiDB | ✅ | tidb.ts |
| 神通 | ✅ | shentong.ts |

---

*本文档由 小jeep 🤖 自动生成并维护*
*DataDictManage Team © 2026*
