# DDM REST API 文档

> Base URL: `http://localhost:8080/api`（通过网关访问）
> 直接访问：Auth `:8081/auth`，Modeling `:8082/modeling`
> 认证方式：Bearer Token（JWT）

---

## 认证接口（Auth Service）

### POST /auth/login — 用户登录

**请求体：**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
    "expiresAt": 1709999999,
    "tokenType": "Bearer",
    "userId": "user-admin-001",
    "username": "admin",
    "displayName": "系统管理员"
  }
}
```

### POST /auth/refresh — 刷新 Token

**请求头：** `X-Refresh-Token: <refreshToken>`

### POST /auth/logout — 登出

**请求头：** `Authorization: Bearer <accessToken>`

---

## 建模接口（Modeling Service）

### POST /modeling/models — 创建模型

**请求头：** `X-User-Id: <userId>`

**请求体：**
```json
{
  "name": "用户中心数据模型",
  "projectId": "proj-001",
  "description": "用户、权限、认证相关表结构"
}
```

**响应：**
```json
{
  "code": 0,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "用户中心数据模型",
    "description": "...",
    "projectId": "proj-001",
    "entityCount": 0,
    "createdBy": "user-admin-001",
    "createdAt": "2024-03-01T10:00:00",
    "updatedAt": "2024-03-01T10:00:00"
  }
}
```

### GET /modeling/models?projectId={id} — 查询模型列表

**响应：** 包含模型列表（不含字段详情）

### GET /modeling/models/{modelId} — 查询模型详情

**响应示例：**
```json
{
  "code": 0,
  "data": {
    "id": "...",
    "name": "用户中心数据模型",
    "entities": [
      {
        "id": "...",
        "name": "sys_user",
        "comment": "用户表",
        "layer": "PHYSICAL",
        "fields": [
          {
            "id": "...",
            "name": "id",
            "comment": "主键",
            "baseType": "STRING",
            "length": 36,
            "nullable": false,
            "primaryKey": true,
            "typeLabel": "VARCHAR(36)",
            "hasStandardBinding": false
          }
        ]
      }
    ]
  }
}
```

### DELETE /modeling/models/{modelId} — 删除模型

**请求头：** `X-User-Id: <userId>`

### POST /modeling/models/{modelId}/entities — 添加数据表

**请求参数：**
```
?name=sys_user&comment=用户表
```

### GET /modeling/models/{modelId}/ddl?dbType=MYSQL — 生成 DDL

**支持的 dbType：**
- `MYSQL` — MySQL 8.0
- `POSTGRESQL` — PostgreSQL 15
- `ORACLE` — Oracle 19c
- `DAMENG` — 达梦 DM8
- `KINGBASE` — 金仓 KingbaseES V8
- `SQLSERVER` — SQL Server 2019
- `CLICKHOUSE` — ClickHouse 24.x

**响应示例：**
```json
{
  "code": 0,
  "data": "CREATE TABLE `sys_user` (\n  `id` VARCHAR(36) NOT NULL COMMENT '主键',\n  PRIMARY KEY (`id`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';"
}
```

---

## 统一响应格式

所有接口返回以下格式：

```json
{
  "code": 0,          // 0=成功，非0=失败
  "message": "success",
  "data": {},         // 响应数据（成功时有值）
  "timestamp": 1709999999000
}
```

**错误码说明：**

| code | 含义 |
|------|------|
| 0 | 成功 |
| -1 | 通用失败 |
| 40001 | 参数校验失败 |
| 40003 | 权限不足 |
| 40004 | 资源不存在 |
| 40009 | 业务规则冲突（如名称重复） |
| 50000 | 系统内部错误 |
