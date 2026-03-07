-- Flyway 迁移脚本 V1
-- 初始化核心表结构
-- Author: DDM Team
-- Date: 2026-03-07

-- ═══════════════════════════════════════════════════════════
-- 系统管理上下文（System BC）
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS t_org (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()) COMMENT '机构ID',
  parent_id   CHAR(36)                               COMMENT '父机构ID，NULL为根节点',
  name        VARCHAR(128) NOT NULL                  COMMENT '机构名称',
  code        VARCHAR(64)  NOT NULL                  COMMENT '机构编码',
  sort_order  INT          NOT NULL DEFAULT 0        COMMENT '排序序号',
  status      TINYINT      NOT NULL DEFAULT 1        COMMENT '状态: 1-启用 0-禁用',
  created_at  DATETIME(3)  NOT NULL DEFAULT NOW(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT NOW(3) ON UPDATE NOW(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_code (code),
  INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='机构表';

CREATE TABLE IF NOT EXISTS t_user (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()) COMMENT '用户ID',
  org_id      CHAR(36)                               COMMENT '所属机构ID',
  username    VARCHAR(64)  NOT NULL                  COMMENT '登录账号',
  nickname    VARCHAR(64)  NOT NULL                  COMMENT '显示昵称',
  email       VARCHAR(128)                           COMMENT '邮箱',
  phone       VARCHAR(20)                            COMMENT '手机号',
  password    VARCHAR(256) NOT NULL                  COMMENT 'BCrypt 哈希',
  status      TINYINT      NOT NULL DEFAULT 1        COMMENT '状态: 1-启用 0-禁用',
  last_login  DATETIME(3)                            COMMENT '最后登录时间',
  created_at  DATETIME(3)  NOT NULL DEFAULT NOW(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT NOW(3) ON UPDATE NOW(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_username (username),
  INDEX idx_org_id (org_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

CREATE TABLE IF NOT EXISTS t_role (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()) COMMENT '角色ID',
  name        VARCHAR(64)  NOT NULL                  COMMENT '角色名称',
  code        VARCHAR(64)  NOT NULL                  COMMENT '角色编码（系统唯一）',
  description VARCHAR(256)                           COMMENT '描述',
  is_system   TINYINT(1)   NOT NULL DEFAULT 0        COMMENT '是否系统内置角色',
  created_at  DATETIME(3)  NOT NULL DEFAULT NOW(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT NOW(3) ON UPDATE NOW(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

CREATE TABLE IF NOT EXISTS t_user_role (
  user_id     CHAR(36)     NOT NULL                  COMMENT '用户ID',
  role_id     CHAR(36)     NOT NULL                  COMMENT '角色ID',
  created_at  DATETIME(3)  NOT NULL DEFAULT NOW(3),
  PRIMARY KEY (user_id, role_id),
  INDEX idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户-角色关联表';

-- ═══════════════════════════════════════════════════════════
-- 建模上下文（Modeling BC）
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS t_team (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()) COMMENT '团队ID',
  name        VARCHAR(128) NOT NULL                  COMMENT '团队名称',
  code        VARCHAR(64)  NOT NULL                  COMMENT '团队编码',
  description VARCHAR(512)                           COMMENT '团队描述',
  owner_id    CHAR(36)     NOT NULL                  COMMENT '所有者用户ID',
  status      TINYINT      NOT NULL DEFAULT 1        COMMENT '状态: 1-正常 0-禁用',
  created_at  DATETIME(3)  NOT NULL DEFAULT NOW(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT NOW(3) ON UPDATE NOW(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队表';

CREATE TABLE IF NOT EXISTS t_project (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()) COMMENT '项目ID',
  team_id     CHAR(36)     NOT NULL                  COMMENT '所属团队ID',
  name        VARCHAR(128) NOT NULL                  COMMENT '项目名称',
  code        VARCHAR(64)  NOT NULL                  COMMENT '项目编码',
  description VARCHAR(512)                           COMMENT '项目描述',
  status      TINYINT      NOT NULL DEFAULT 1        COMMENT '状态: 1-正常 0-禁用',
  created_at  DATETIME(3)  NOT NULL DEFAULT NOW(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT NOW(3) ON UPDATE NOW(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_team_code (team_id, code),
  INDEX idx_team_id (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目表';

CREATE TABLE IF NOT EXISTS t_team_member (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()) COMMENT '成员ID',
  team_id     CHAR(36)     NOT NULL                  COMMENT '团队ID',
  user_id     CHAR(36)     NOT NULL                  COMMENT '用户ID',
  role        VARCHAR(32)  NOT NULL                  COMMENT '角色: owner/admin/developer/viewer',
  joined_at   DATETIME(3)  NOT NULL DEFAULT NOW(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_team_user (team_id, user_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队成员表';

CREATE TABLE IF NOT EXISTS t_model (
  id              CHAR(36)     NOT NULL DEFAULT (UUID()) COMMENT '模型ID',
  project_id      CHAR(36)     NOT NULL                  COMMENT '项目ID',
  name            VARCHAR(128) NOT NULL                  COMMENT '模型名称',
  description     VARCHAR(512)                           COMMENT '模型描述',
  current_branch_id CHAR(36)                             COMMENT '当前分支ID',
  created_by      CHAR(36)     NOT NULL                  COMMENT '创建者ID',
  created_at      DATETIME(3)  NOT NULL DEFAULT NOW(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT NOW(3) ON UPDATE NOW(3),
  PRIMARY KEY (id),
  INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据模型表';

CREATE TABLE IF NOT EXISTS t_entity (
  id              CHAR(36)     NOT NULL DEFAULT (UUID()) COMMENT '实体ID',
  model_id        CHAR(36)     NOT NULL                  COMMENT '模型ID',
  branch_id       CHAR(36)     NOT NULL                  COMMENT '分支ID',
  name            VARCHAR(64)  NOT NULL                  COMMENT '表名',
  comment         VARCHAR(256)                           COMMENT '表描述',
  layer           VARCHAR(32)  NOT NULL DEFAULT 'PHYSICAL' COMMENT '层级: LOGICAL/PHYSICAL',
  sort_order      INT          NOT NULL DEFAULT 0        COMMENT '排序',
  created_at      DATETIME(3)  NOT NULL DEFAULT NOW(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT NOW(3) ON UPDATE NOW(3),
  PRIMARY KEY (id),
  INDEX idx_model_id (model_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='实体表';

CREATE TABLE IF NOT EXISTS t_field (
  id              CHAR(36)     NOT NULL DEFAULT (UUID()) COMMENT '字段ID',
  entity_id       CHAR(36)     NOT NULL                  COMMENT '实体ID',
  name            VARCHAR(64)  NOT NULL                  COMMENT '字段名',
  comment         VARCHAR(256)                           COMMENT '字段描述',
  base_type       VARCHAR(32)  NOT NULL                  COMMENT '基础类型',
  length          INT                                    COMMENT '长度',
  precision_      INT                                    COMMENT '精度',
  scale           INT                                    COMMENT '小数位',
  nullable        TINYINT(1)   NOT NULL DEFAULT 1        COMMENT '是否可空',
  primary_key     TINYINT(1)   NOT NULL DEFAULT 0        COMMENT '是否主键',
  unique_key      TINYINT(1)   NOT NULL DEFAULT 0        COMMENT '是否唯一',
  auto_increment  TINYINT(1)   NOT NULL DEFAULT 0        COMMENT '是否自增',
  default_value   VARCHAR(256)                           COMMENT '默认值',
  standard_id     CHAR(36)                               COMMENT '绑定标准ID',
  sort_order      INT          NOT NULL DEFAULT 0        COMMENT '排序',
  created_at      DATETIME(3)  NOT NULL DEFAULT NOW(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT NOW(3) ON UPDATE NOW(3),
  PRIMARY KEY (id),
  INDEX idx_entity_id (entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='字段表';

-- ═══════════════════════════════════════════════════════════
-- 数据标准上下文
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS t_data_item (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()) COMMENT '数据项ID',
  name        VARCHAR(128) NOT NULL                  COMMENT '数据项名称',
  code        VARCHAR(64)  NOT NULL                  COMMENT '数据项编码',
  base_type   VARCHAR(32)  NOT NULL                  COMMENT '数据类型',
  length      INT                                    COMMENT '长度',
  description VARCHAR(512)                           COMMENT '说明',
  status      TINYINT      NOT NULL DEFAULT 1        COMMENT '状态: 1-正常 0-禁用',
  created_at  DATETIME(3)  NOT NULL DEFAULT NOW(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT NOW(3) ON UPDATE NOW(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据项表';

CREATE TABLE IF NOT EXISTS t_code_value_group (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()) COMMENT '代码组ID',
  code        VARCHAR(64)  NOT NULL                  COMMENT '代码组编码',
  name        VARCHAR(128) NOT NULL                  COMMENT '代码组名称',
  description VARCHAR(512)                           COMMENT '说明',
  created_at  DATETIME(3)  NOT NULL DEFAULT NOW(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT NOW(3) ON UPDATE NOW(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='代码值组表';

CREATE TABLE IF NOT EXISTS t_code_value (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()) COMMENT '代码值ID',
  group_id    CHAR(36)     NOT NULL                  COMMENT '代码组ID',
  code        VARCHAR(64)  NOT NULL                  COMMENT '代码值',
  name        VARCHAR(128) NOT NULL                  COMMENT '显示名称',
  sort_order  INT          NOT NULL DEFAULT 0        COMMENT '排序',
  status      TINYINT      NOT NULL DEFAULT 1        COMMENT '状态: 1-正常 0-废弃',
  created_at  DATETIME(3)  NOT NULL DEFAULT NOW(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT NOW(3) ON UPDATE NOW(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_group_code (group_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='代码值表';
