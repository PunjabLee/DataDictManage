# @ddm/db-dialect

> DDM 数据库方言适配器 — 支持 7 种数据库的 DDL 生成（纯 TypeScript，无运行时依赖）

## 支持的数据库

| 方言 | 版本 | 分类 | dbType |
|------|------|------|--------|
| MySQL | 8.0 | 开源 | `MYSQL` |
| PostgreSQL | 15 | 开源 | `POSTGRESQL` |
| Oracle | 19c | 商业 | `ORACLE` |
| 达梦 DM | DM8 | 信创 | `DAMENG` |
| 金仓 KingbaseES | V8R6 | 信创 | `KINGBASE` |
| SQL Server | 2019 | 商业 | `SQLSERVER` |
| ClickHouse | 24.x | 大数据分析 | `CLICKHOUSE` |

## 安装

```bash
pnpm add @ddm/db-dialect
```

## 快速上手

```typescript
import { DialectRegistry, DialectEntitySnapshot } from '@ddm/db-dialect'
// 自动注册所有内置方言（import 时触发）

const registry = DialectRegistry.getInstance()

const entity: DialectEntitySnapshot = {
  name: 'sys_user',
  comment: '用户表',
  fields: [
    {
      name: 'id',
      comment: '主键',
      baseType: 'STRING',
      length: 36,
      nullable: false,
      primaryKey: true,
      unique: true,
      autoIncrement: false,
    },
    {
      name: 'username',
      comment: '用户名',
      baseType: 'STRING',
      length: 64,
      nullable: false,
      primaryKey: false,
      unique: true,
      autoIncrement: false,
    },
    {
      name: 'created_at',
      comment: '创建时间',
      baseType: 'DATETIME',
      nullable: false,
      primaryKey: false,
      unique: false,
      autoIncrement: false,
    },
  ],
}

// 生成 MySQL DDL
const mysql = registry.get('MYSQL')
const mysqlResult = mysql.generateCreateTable(entity)
console.log(mysqlResult.sql)
// CREATE TABLE `sys_user` (
//   `id` VARCHAR(36) NOT NULL COMMENT '主键',
//   `username` VARCHAR(64) NOT NULL COMMENT '用户名',
//   `created_at` DATETIME(3) NOT NULL COMMENT '创建时间',
//   PRIMARY KEY (`id`), UNIQUE KEY (`username`)
// ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

// 生成达梦 DDL
const dameng = registry.get('DAMENG')
const damengResult = dameng.generateCreateTable(entity)
console.log(damengResult.sql)
```

## 注册自定义方言

```typescript
import { DialectRegistry, IDbDialect } from '@ddm/db-dialect'

class MyCustomDialect implements IDbDialect {
  readonly dbType = 'MY_DB'
  readonly displayName = '我的自定义数据库'
  readonly category = 'OPEN_SOURCE' as const
  readonly version = '1.0'

  mapType(field) { /* ... */ }
  generateCreateTable(entity) { /* ... */ }
  // ... 实现其他方法
}

DialectRegistry.getInstance().register(new MyCustomDialect())
```
