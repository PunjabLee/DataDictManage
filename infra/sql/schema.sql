-- DDM 数据库初始化脚本
-- 数据库：datadictmanage
-- 字符集：utf8mb4 / utf8mb4_unicode_ci

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

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
  INDEX idx_org_id (org_id),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

CREATE TABLE IF NOT EXISTS t_role (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()) COMMENT '角色ID',
  name        VARCHAR(64)  NOT NULL                  COMMENT '角色名称',
  code        VARCHAR(64)  NOT NULL                  COMMENT '角色编码（系统唯一）',
  description VARCHAR(256)                           COMMENT '描述',
  is_system   TINYINT(1)   NOT NULL DEFAULT 0        COMMENT '是否系统内置角色',
  created_at  DATETIME(3)  NOT NULL DEFAULT NOW(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

CREATE TABLE IF NOT EXISTS t_user_role (
  user_id     CHAR(36)     NOT NULL COMMENT '用户ID',
  role_id     CHAR(36)     NOT NULL COMMENT '角色ID',
  scope_type  VARCHAR(32)  NOT NULL DEFAULT 'GLOBAL' COMMENT '权限范围: GLOBAL/TEAM/PROJECT',
  scope_id    CHAR(36)                               COMMENT '范围ID（团队/项目ID）',
  PRIMARY KEY (user_id, role_id, scope_type),
  INDEX idx_user_id (user_id),
  INDEX idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户-角色关联表';

CREATE TABLE IF NOT EXISTS t_audit_log (
  id          BIGINT       NOT NULL AUTO_INCREMENT   COMMENT '审计日志ID',
  user_id     CHAR(36)     NOT NULL                  COMMENT '操作人ID',
  username    VARCHAR(64)  NOT NULL                  COMMENT '操作人账号（冗余）',
  op_type     VARCHAR(64)  NOT NULL                  COMMENT '操作类型',
  module      VARCHAR(64)  NOT NULL                  COMMENT '功能模块',
  resource_id VARCHAR(36)                            COMMENT '操作资源ID',
  detail      TEXT                                   COMMENT 'JSON格式操作详情',
  ip          VARCHAR(64)                            COMMENT '客户端IP',
  user_agent  VARCHAR(512)                           COMMENT '客户端UA',
  created_at  DATETIME(3)  NOT NULL DEFAULT NOW(3),
  PRIMARY KEY (id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_op_type (op_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作审计日志表';

-- ═══════════════════════════════════════════════════════════
-- 团队上下文（Team BC）
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS t_team (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()) COMMENT '团队ID',
  name        VARCHAR(128) NOT NULL                  COMMENT '团队名称',
  description TEXT                                   COMMENT '团队描述',
  owner_id    CHAR(36)     NOT NULL                  COMMENT '创建人（Owner）ID',
  status      TINYINT      NOT NULL DEFAULT 1        COMMENT '状态: 1-正常 0-禁用',
  created_at  DATETIME(3)  NOT NULL DEFAULT NOW(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT NOW(3) ON UPDATE NOW(3),
  PRIMARY KEY (id),
  INDEX idx_owner_id (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队表';

CREATE TABLE IF NOT EXISTS t_team_member (
  team_id     CHAR(36)     NOT NULL COMMENT '团队ID',
  user_id     CHAR(36)     NOT NULL COMMENT '用户ID',
  role        VARCHAR(32)  NOT NULL DEFAULT 'MEMBER' COMMENT 'OWNER/ADMIN/MEMBER/VIEWER',
  joined_at   DATETIME(3)  NOT NULL DEFAULT NOW(3),
  PRIMARY KEY (team_id, user_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队成员表';

CREATE TABLE IF NOT EXISTS t_project (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()) COMMENT '项目ID',
  team_id     CHAR(36)     NOT NULL                  COMMENT '所属团队ID',
  name        VARCHAR(128) NOT NULL                  COMMENT '项目名称',
  description TEXT                                   COMMENT '项目描述',
  biz_domain  VARCHAR(64)                            COMMENT '业务域分类',
  status      TINYINT      NOT NULL DEFAULT 1        COMMENT '状态: 1-活跃 2-归档',
  created_by  CHAR(36)     NOT NULL                  COMMENT '创建人ID',
  created_at  DATETIME(3)  NOT NULL DEFAULT NOW(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT NOW(3) ON UPDATE NOW(3),
  PRIMARY KEY (id),
  INDEX idx_team_id (team_id),
  INDEX idx_biz_domain (biz_domain)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目表';

-- ═══════════════════════════════════════════════════════════
-- 建模上下文（Modeling BC）
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS t_model (
  id              CHAR(36)     NOT NULL DEFAULT (UUID()) COMMENT '模型ID',
  project_id      CHAR(36)     NOT NULL                  COMMENT '所属项目ID',
  name            VARCHAR(128) NOT NULL                  COMMENT '模型名称',
  description     TEXT                                   COMMENT '模型描述',
  current_branch  CHAR(36)                               COMMENT '当前激活分支ID',
  created_by      CHAR(36)     NOT NULL                  COMMENT '创建人ID',
  created_at      DATETIME(3)  NOT NULL DEFAULT NOW(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT NOW(3) ON UPDATE NOW(3),
  PRIMARY KEY (id),
  INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据模型表';

CREATE TABLE IF NOT EXISTS t_branch (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()) COMMENT '分支ID',
  model_id    CHAR(36)     NOT NULL                  COMMENT '所属模型ID',
  name        VARCHAR(128) NOT NULL                  COMMENT '分支名称',
  parent_id   CHAR(36)                               COMMENT '父分支ID',
  is_main     TINYINT(1)   NOT NULL DEFAULT 0        COMMENT '是否主干分支',
  created_by  CHAR(36)     NOT NULL                  COMMENT '创建人ID',
  created_at  DATETIME(3)  NOT NULL DEFAULT NOW(3),
  PRIMARY KEY (id),
  INDEX idx_model_id (model_id),
  UNIQUE KEY uk_model_branch_name (model_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模型分支表';

CREATE TABLE IF NOT EXISTS t_model_snapshot (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()) COMMENT '快照ID',
  model_id      CHAR(36)     NOT NULL                  COMMENT '所属模型ID',
  branch_id     CHAR(36)     NOT NULL                  COMMENT '所属分支ID',
  version_tag   VARCHAR(64)                            COMMENT '版本标签（如 v1.0.0）',
  content       LONGTEXT     NOT NULL                  COMMENT 'JSON 格式完整模型内容',
  content_hash  VARCHAR(64)  NOT NULL                  COMMENT 'SHA256，用于快速判断是否变更',
  created_by    CHAR(36)     NOT NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT NOW(3),
  PRIMARY KEY (id),
  INDEX idx_model_branch (model_id, branch_id),
  INDEX idx_content_hash (content_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模型版本快照表';

CREATE TABLE IF NOT EXISTS t_operation_log (
  id          BIGINT       NOT NULL AUTO_INCREMENT   COMMENT '操作日志ID',
  model_id    CHAR(36)     NOT NULL                  COMMENT '模型ID',
  branch_id   CHAR(36)     NOT NULL                  COMMENT '分支ID',
  op_type     VARCHAR(64)  NOT NULL                  COMMENT '操作类型',
  op_payload  TEXT         NOT NULL                  COMMENT 'JSON格式操作内容',
  operator_id CHAR(36)     NOT NULL                  COMMENT '操作人ID',
  created_at  DATETIME(3)  NOT NULL DEFAULT NOW(3),
  PRIMARY KEY (id),
  INDEX idx_model_branch_time (model_id, branch_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模型操作历史日志';

-- ═══════════════════════════════════════════════════════════
-- 数据标准上下文（Standard BC）
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS t_data_item_standard (
  id              CHAR(36)     NOT NULL DEFAULT (UUID()) COMMENT '数据项标准ID',
  team_id         CHAR(36)     NOT NULL                  COMMENT '所属团队ID',
  chinese_name    VARCHAR(128) NOT NULL                  COMMENT '中文名称',
  english_abbr    VARCHAR(64)  NOT NULL                  COMMENT '英文缩写',
  base_type       VARCHAR(32)  NOT NULL                  COMMENT '基本数据类型',
  length          INT                                    COMMENT '长度',
  precision_val   INT                                    COMMENT '精度',
  scale_val       INT                                    COMMENT '小数位数',
  nullable        TINYINT(1)   NOT NULL DEFAULT 1        COMMENT '是否可空',
  business_desc   TEXT                                   COMMENT '业务描述',
  code_value_group CHAR(36)                              COMMENT '关联代码值组ID',
  status          TINYINT      NOT NULL DEFAULT 1,
  created_by      CHAR(36)     NOT NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT NOW(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT NOW(3) ON UPDATE NOW(3),
  PRIMARY KEY (id),
  INDEX idx_team_id (team_id),
  INDEX idx_english_abbr (english_abbr),
  FULLTEXT INDEX ft_chinese_name (chinese_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据项标准表';

CREATE TABLE IF NOT EXISTS t_code_value_group (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()) COMMENT '代码值组ID',
  team_id     CHAR(36)     NOT NULL                  COMMENT '所属团队ID',
  name        VARCHAR(128) NOT NULL                  COMMENT '代码值组名称',
  code        VARCHAR(64)  NOT NULL                  COMMENT '组编码',
  description TEXT,
  created_by  CHAR(36)     NOT NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT NOW(3),
  PRIMARY KEY (id),
  INDEX idx_team_id (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='代码值标准组表';

CREATE TABLE IF NOT EXISTS t_code_value_item (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()) COMMENT '代码值ID',
  group_id    CHAR(36)     NOT NULL                  COMMENT '所属组ID',
  code        VARCHAR(64)  NOT NULL                  COMMENT '代码值键',
  label       VARCHAR(128) NOT NULL                  COMMENT '代码值显示名',
  description VARCHAR(256)                           COMMENT '说明',
  sort_order  INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  INDEX idx_group_id (group_id),
  UNIQUE KEY uk_group_code (group_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='代码值明细表';

CREATE TABLE IF NOT EXISTS t_naming_root (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()) COMMENT '词根ID',
  team_id     CHAR(36)     NOT NULL                  COMMENT '所属团队ID',
  chinese     VARCHAR(64)  NOT NULL                  COMMENT '中文词语',
  english     VARCHAR(64)  NOT NULL                  COMMENT '英文缩写',
  description VARCHAR(256)                           COMMENT '释义说明',
  created_by  CHAR(36)     NOT NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT NOW(3),
  PRIMARY KEY (id),
  INDEX idx_team_id (team_id),
  FULLTEXT INDEX ft_chinese (chinese)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='命名词根表';

SET FOREIGN_KEY_CHECKS = 1;

-- 初始化内置角色
INSERT IGNORE INTO t_role (id, name, code, description, is_system) VALUES
  (UUID(), '系统管理员', 'SYS_ADMIN',    '拥有所有权限', 1),
  (UUID(), '团队管理员', 'TEAM_ADMIN',   '管理团队成员和项目', 1),
  (UUID(), '建模工程师', 'MODELER',      '可创建和编辑数据模型', 1),
  (UUID(), '只读查看员', 'VIEWER',       '仅可查看，不可修改', 1);
