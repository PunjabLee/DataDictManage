# DataDictManage (DDM)

> 数据字典管理平台 — 企业级元数据建模与数据标准管理系统

[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://openjdk.org/projects/jdk/17/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-green.svg)](https://spring.io/projects/spring-boot)
[![Node](https://img.shields.io/badge/Node-18+-brightgreen.svg)](https://nodejs.org/)

## 项目简介

DataDictManage (DDM) 是一款企业级数据字典管理平台，提供数据建模、数据标准管理、团队协作、版本管理等核心能力。
支持 22+ 主流及国产数据库，覆盖从需求分析到生产部署的全链路数据模型管理。

## 版本规划

| 版本 | 形态 | 定位 |
|------|------|------|
| DDM-CE | 桌面客户端（开源） | 开发者 / 技术爱好者 |
| DDM-Pro | 桌面客户端（商业） | 专业个人用户 |
| DDM-EE | Web 应用（企业版） | 团队 / 企业用户 |

## 技术栈

### 前端
- 桌面端：Electron + React + TypeScript
- Web 端：Vue 3 + React（微前端 qiankun）
- 构建：Vite + pnpm Monorepo + Turborepo
- 图形：自研 Canvas 渲染引擎

### 后端（EE）
- 框架：Java 17 + Spring Boot 3
- 持久层：MyBatis-Plus + MySQL 8.0
- 缓存：Redis 7
- 消息队列：RabbitMQ 3.x
- 文件存储：MinIO
- 实时通信：Netty + WebSocket + Yjs CRDT

## 项目结构

```
DataDictManage/
├── packages/                    # 前端 Monorepo 包
│   ├── core-engine/             # 领域核心引擎（纯 TS）
│   ├── canvas-render/           # Canvas 渲染引擎
│   ├── shared-ui/               # 公共组件库
│   ├── db-dialect/              # 数据库方言适配器
│   ├── desktop-ce/              # 桌面版 CE（Electron）
│   ├── desktop-pro/             # 桌面版 Pro（Electron）
│   └── web-ee/                  # EE Web 微前端主框架
├── services/
│   └── ee-backend/              # Spring Boot 3 后端服务
├── infra/                       # 基础设施配置
│   ├── docker-compose.yml       # 本地开发环境
│   └── sql/                     # 数据库初始化脚本
└── docs/                        # 技术文档
```

## 快速开始

### 环境要求
- Node.js 18+
- pnpm 8+
- Java 17+
- Docker & Docker Compose

### 启动本地开发环境

```bash
# 1. 克隆项目
git clone https://github.com/PunjabLee/DataDictManage.git
cd DataDictManage

# 2. 启动基础设施（MySQL + Redis + RabbitMQ + MinIO）
docker-compose -f infra/docker-compose.yml up -d

# 3. 安装前端依赖
pnpm install

# 4. 启动桌面版 CE
pnpm --filter desktop-ce dev

# 5. 启动后端（EE）
cd services/ee-backend
./mvnw spring-boot:run
```

## Git 分支规范

```
main              ← 生产发布，只接受 PR 合并
develop           ← 集成分支，所有 feature 合并到此
release/vX.X.X    ← 发版前稳定分支
hotfix/xxx        ← 紧急修复
feature/xxx       ← 功能开发（从 develop 切出）
```

## 开发进度

- [x] Phase 0：工程骨架 & 架构底座
- [ ] Phase 1：核心建模引擎（CE + Pro）
- [ ] Phase 2：EE 协作平台 & 数据标准
- [ ] Phase 3：企业级全量 & 信创适配

## 许可证

[AGPL-3.0](LICENSE)

---

*由 小jeep 🚙 构建 · DataDictManage Team*
