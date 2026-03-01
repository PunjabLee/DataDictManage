# DDM 本地开发快速启动指南

## 前置依赖

| 工具 | 版本要求 | 安装方法 |
|------|---------|---------|
| Node.js | ≥ 18.0.0 | https://nodejs.org |
| pnpm | ≥ 8.0.0 | `npm i -g pnpm` |
| Java | 17（LTS） | https://adoptium.net |
| Maven | ≥ 3.9 | https://maven.apache.org |
| Docker | ≥ 24.0 | https://docker.com |
| Docker Compose | ≥ 2.20 | 随 Docker Desktop 安装 |

---

## 一、启动基础设施（Docker）

```bash
# 进入 infra 目录
cd /workspace/DataDictManage/infra

# 启动 MySQL + Redis + RabbitMQ + MinIO
docker compose up -d

# 验证启动状态
docker compose ps

# 查看日志
docker compose logs -f mysql
```

**服务地址：**

| 服务 | 地址 | 账号/密码 |
|------|------|---------|
| MySQL | localhost:3306 | root / ddm123456 |
| Redis | localhost:6379 | 无密码 |
| RabbitMQ | localhost:5672 | ddm / ddm123456 |
| RabbitMQ 管理 | http://localhost:15672 | ddm / ddm123456 |
| MinIO | http://localhost:9000 | minioadmin / minioadmin |

---

## 二、初始化数据库

```bash
# 连接 MySQL 并执行建表 SQL
mysql -h 127.0.0.1 -P 3306 -u root -pddm123456 < infra/sql/schema.sql

# 验证表是否创建成功
mysql -h 127.0.0.1 -P 3306 -u root -pddm123456 ddm_ee -e "SHOW TABLES;"
```

---

## 三、启动前端包（TypeScript）

```bash
# 安装依赖（Monorepo 所有包）
cd /workspace/DataDictManage
pnpm install

# 构建 core-engine
pnpm --filter @ddm/core-engine build

# 构建 db-dialect
pnpm --filter @ddm/db-dialect build

# 启动 desktop-ce（开发模式）
pnpm --filter @ddm/desktop-ce dev:renderer

# 另开一个终端，启动 Electron 主进程
pnpm --filter @ddm/desktop-ce dev:main
```

---

## 四、启动 EE 后端（Spring Boot）

```bash
# 进入后端目录
cd /workspace/DataDictManage/services/ee-backend

# 构建所有模块（跳过测试）
mvn clean install -DskipTests

# 启动认证服务
cd pdmaas-auth
mvn spring-boot:run

# 另开终端，启动建模服务
cd ../pdmaas-modeling
mvn spring-boot:run

# 另开终端，启动网关（可选，单机开发可直接访问子服务）
cd ../pdmaas-gateway
mvn spring-boot:run
```

**服务地址：**

| 服务 | 端口 |
|------|------|
| Gateway | 8080 |
| Auth | 8081 |
| Modeling | 8082 |

---

## 五、验证服务

```bash
# 健康检查
curl http://localhost:8082/actuator/health

# 登录（获取 Token）
curl -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 创建模型（携带 Token）
curl -X POST http://localhost:8082/modeling/models \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-admin-001" \
  -d '{"name":"测试模型","projectId":"proj-001","description":"Phase 1 测试"}'
```

---

## 六、开发调试

### VS Code 推荐插件

- TypeScript Importer
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Extension Pack for Java
- Spring Boot Extension Pack

### 常用命令

```bash
# 类型检查（所有 TS 包）
pnpm type-check

# 格式化（所有文件）
pnpm format

# 运行测试
pnpm test

# 查看包依赖关系
pnpm ls --filter @ddm/core-engine

# 清理构建产物
find . -name "dist" -not -path "*/node_modules/*" -exec rm -rf {} +
```

---

## 七、常见问题

**Q: pnpm install 报错**
```bash
# 清理缓存后重试
pnpm store prune
pnpm install --frozen-lockfile=false
```

**Q: MySQL 连接失败**
```bash
# 检查容器状态
docker compose ps
# 等待 MySQL 完全启动（首次约 30 秒）
docker compose logs mysql | grep "ready for connections"
```

**Q: Spring Boot 启动失败（端口占用）**
```bash
# 查找占用端口的进程
lsof -i :8082
kill -9 <PID>
```
