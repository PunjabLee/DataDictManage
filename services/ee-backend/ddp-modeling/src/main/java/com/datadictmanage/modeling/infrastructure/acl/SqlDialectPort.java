package com.datadictmanage.modeling.infrastructure.acl;

import java.util.List;

/**
 * SqlDialectPort — SQL 方言防腐层接口（ACL: Anti-Corruption Layer）
 *
 * 职责：
 *   将领域层与外部 SQL 生成工具（@ddm/db-dialect 或其他实现）隔离。
 *   领域层（domain）和应用层（application）只依赖此接口，
 *   不直接依赖具体的 SQL 生成库，从而避免外部技术细节渗透到领域层。
 *
 * 反腐层（ACL）设计说明：
 *   - 隔离的外部系统：@ddm/db-dialect（Node.js 包，通过 subprocess 或 HTTP 调用）
 *                     或 Java 版本的 DDL 生成器
 *   - 防腐层的实现类（SqlDialectAdapter）在 infrastructure 包中
 *   - 领域层和应用层只知道 SqlDialectPort 接口，不知道具体实现
 *
 * @layer Infrastructure Layer（接口定义）— infrastructure/acl
 * @pattern GoF: Adapter + Facade（防腐层）
 */
public interface SqlDialectPort {

    /**
     * 生成建表 DDL
     *
     * @param entityName   表名
     * @param entityComment 表注释
     * @param fields        字段元数据列表
     * @param dbType        目标数据库类型（MYSQL/POSTGRESQL/ORACLE/DAMENG/KINGBASE）
     * @return SQL 字符串
     */
    String generateCreateTable(String entityName, String entityComment, List<FieldMeta> fields, String dbType);

    /**
     * 生成增量 DDL（基于 Diff 结果）
     *
     * @param diffs  差异列表
     * @param dbType 目标数据库类型
     * @return SQL 字符串
     */
    String generateDiffDDL(List<ColumnDiff> diffs, String dbType);

    /**
     * 检查数据库类型是否被支持
     *
     * @param dbType 数据库类型
     * @return true 如果支持
     */
    boolean supportsDbType(String dbType);

    /**
     * 获取所有支持的数据库类型
     */
    List<String> getSupportedDbTypes();

    // ── 内部数据类（防腐层专用，不暴露给外部） ─────────────────────────────

    /**
     * 字段元数据（防腐层内部传输对象）
     * 不使用 FieldBO（防止领域对象跨层）
     */
    record FieldMeta(
        String name,
        String comment,
        String baseType,
        Integer length,
        Integer precision,
        Integer scale,
        boolean nullable,
        boolean primaryKey,
        boolean unique,
        boolean autoIncrement,
        String defaultValue
    ) {}

    /**
     * 列差异（用于增量 DDL 生成）
     */
    record ColumnDiff(
        String operation,    // ADD/MODIFY/DROP
        String tableName,
        FieldMeta oldField,  // MODIFY 时有值
        FieldMeta newField   // DROP 时为 null
    ) {}
}
