package com.datadictmanage.modeling.infrastructure.acl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.*;

/**
 * SqlDialectAdapter — SQL 方言适配器（SqlDialectPort 实现）
 *
 * 职责：
 *   实现 SqlDialectPort 接口，负责将领域对象转换为 DDL SQL。
 *   Phase 1 使用简化实现：Java 内部处理基本映射，未来可替换为：
 *   - 调用 Node.js 子进程（执行 @ddm/db-dialect）
 *   - 调用独立的 DDL 生成服务（HTTP）
 *   - 使用 GraalJS 直接执行 TypeScript
 *
 * @layer Infrastructure Layer
 * @pattern GoF: Adapter（适配 Java 与 DDL 生成逻辑）
 */
@Slf4j
@Component
public class SqlDialectAdapter implements SqlDialectPort {

    // 抽象基础类型 → MySQL 类型映射（默认）
    private static final Map<String, String> DEFAULT_TYPE_MAP = new HashMap<>();
    
    static {
        DEFAULT_TYPE_MAP.put("VARCHAR", "VARCHAR");
        DEFAULT_TYPE_MAP.put("INTEGER", "INT");
        DEFAULT_TYPE_MAP.put("BIGINT", "BIGINT");
        DEFAULT_TYPE_MAP.put("DECIMAL", "DECIMAL");
        DEFAULT_TYPE_MAP.put("DATETIME", "DATETIME");
        DEFAULT_TYPE_MAP.put("TEXT", "TEXT");
        DEFAULT_TYPE_MAP.put("BOOLEAN", "TINYINT");
        DEFAULT_TYPE_MAP.put("FLOAT", "FLOAT");
        DEFAULT_TYPE_MAP.put("DOUBLE", "DOUBLE");
        DEFAULT_TYPE_MAP.put("DATE", "DATE");
        DEFAULT_TYPE_MAP.put("TIME", "TIME");
        DEFAULT_TYPE_MAP.put("TIMESTAMP", "TIMESTAMP");
        DEFAULT_TYPE_MAP.put("BLOB", "BLOB");
        DEFAULT_TYPE_MAP.put("JSON", "JSON");
    }

    // 数据库特定映射
    private static final Map<String, Map<String, String>> DB_TYPE_MAPS = new HashMap<>();
    
    static {
        // MySQL
        Map<String, String> mysql = new HashMap<>(DEFAULT_TYPE_MAP);
        mysql.put("BOOLEAN", "TINYINT(1)");
        mysql.put("TEXT", "TEXT");
        DB_TYPE_MAPS.put("MYSQL", mysql);
        
        // PostgreSQL
        Map<String, String> pg = new HashMap<>(DEFAULT_TYPE_MAP);
        pg.put("BOOLEAN", "BOOLEAN");
        pg.put("TEXT", "TEXT");
        pg.put("INTEGER", "INTEGER");
        pg.put("VARCHAR", "VARCHAR");
        DB_TYPE_MAPS.put("POSTGRESQL", pg);
        
        // Oracle
        Map<String, String> oracle = new HashMap<>(DEFAULT_TYPE_MAP);
        oracle.put("INTEGER", "NUMBER(10)");
        oracle.put("BIGINT", "NUMBER(19)");
        oracle.put("VARCHAR", "VARCHAR2");
        oracle.put("TEXT", "CLOB");
        oracle.put("BOOLEAN", "NUMBER(1)");
        DB_TYPE_MAPS.put("ORACLE", oracle);
        
        // 达梦 (DM8)
        Map<String, String> dameng = new HashMap<>(DEFAULT_TYPE_MAP);
        dameng.put("BOOLEAN", "NUMBER(1)");
        dameng.put("TEXT", "TEXT");
        DB_TYPE_MAPS.put("DAMENG", dameng);
        
        // 金仓 (KingbaseES)
        Map<String, String> kingbase = new HashMap<>(DEFAULT_TYPE_MAP);
        kingbase.put("BOOLEAN", "NUMBER(1)");
        kingbase.put("TEXT", "TEXT");
        DB_TYPE_MAPS.put("KINGBASE", kingbase);
        
        // SQL Server
        Map<String, String> mssql = new HashMap<>(DEFAULT_TYPE_MAP);
        mssql.put("BOOLEAN", "BIT");
        mssql.put("TEXT", "NVARCHAR(MAX)");
        mssql.put("INTEGER", "INT");
        DB_TYPE_MAPS.put("SQLSERVER", mssql);
        
        // ClickHouse
        Map<String, String> ch = new HashMap<>(DEFAULT_TYPE_MAP);
        ch.put("BOOLEAN", "UInt8");
        ch.put("INTEGER", "Int32");
        ch.put("BIGINT", "Int64");
        ch.put("VARCHAR", "String");
        ch.put("TEXT", "String");
        ch.put("DATETIME", "DateTime");
        DB_TYPE_MAPS.put("CLICKHOUSE", ch);
    }

    @Override
    public String generateCreateTable(String entityName, String entityComment, List<FieldMeta> fields, String dbType) {
        String normalizedDbType = normalizeDbType(dbType);
        Map<String, String> typeMap = DB_TYPE_MAPS.getOrDefault(normalizedDbType, DEFAULT_TYPE_MAP);
        
        StringBuilder sql = new StringBuilder();
        sql.append("CREATE TABLE ").append(quoteIdentifier(entityName, normalizedDbType)).append(" (\n");
        
        List<String> columnDefs = new ArrayList<>();
        List<String> primaryKeys = new ArrayList<>();
        
        for (FieldMeta field : fields) {
            String columnDef = buildColumnDef(field, typeMap, normalizedDbType);
            columnDefs.add("  " + columnDef);
            
            if (field.primaryKey()) {
                primaryKeys.add(quoteIdentifier(field.name(), normalizedDbType));
            }
        }
        
        // 添加主键约束
        if (!primaryKeys.isEmpty()) {
            columnDefs.add("  PRIMARY KEY (" + String.join(", ", primaryKeys) + ")");
        }
        
        sql.append(String.join(",\n", columnDefs));
        sql.append("\n)");
        
        // 表注释
        if (entityComment != null && !entityComment.isBlank()) {
            sql.append(" COMMENT='").append(escapeString(entityComment)).append("'");
        }
        
        sql.append(";\n");
        
        log.info("[DDL] 生成建表 SQL: dbType={}, table={}", normalizedDbType, entityName);
        return sql.toString();
    }

    @Override
    public String generateDiffDDL(List<ColumnDiff> diffs, String dbType) {
        String normalizedDbType = normalizeDbType(dbType);
        Map<String, String> typeMap = DB_TYPE_MAPS.getOrDefault(normalizedDbType, DEFAULT_TYPE_MAP);
        
        StringBuilder sql = new StringBuilder();
        
        for (ColumnDiff diff : diffs) {
            switch (diff.operation().toUpperCase()) {
                case "ADD" -> {
                    sql.append("ALTER TABLE ")
                       .append(quoteIdentifier(diff.tableName(), normalizedDbType))
                       .append(" ADD ")
                       .append(buildColumnDef(diff.newField(), typeMap, normalizedDbType))
                       .append(";\n");
                }
                case "MODIFY" -> {
                    sql.append("ALTER TABLE ")
                       .append(quoteIdentifier(diff.tableName(), normalizedDbType))
                       .append(" MODIFY ")
                       .append(buildColumnDef(diff.newField(), typeMap, normalizedDbType))
                       .append(";\n");
                }
                case "DROP" -> {
                    sql.append("ALTER TABLE ")
                       .append(quoteIdentifier(diff.tableName(), normalizedDbType))
                       .append(" DROP COLUMN ")
                       .append(quoteIdentifier(diff.oldField().name(), normalizedDbType))
                       .append(";\n");
                }
            }
        }
        
        return sql.toString();
    }

    @Override
    public boolean supportsDbType(String dbType) {
        return DB_TYPE_MAPS.containsKey(normalizeDbType(dbType));
    }

    @Override
    public List<String> getSupportedDbTypes() {
        return new ArrayList<>(DB_TYPE_MAPS.keySet());
    }

    // ── 私有方法 ─────────────────────────────────────────────────────────

    /**
     * 标准化数据库类型名称
     */
    private String normalizeDbType(String dbType) {
        if (dbType == null) return "MYSQL";
        return dbType.toUpperCase();
    }

    /**
     * 构建列定义
     */
    private String buildColumnDef(FieldMeta field, Map<String, String> typeMap, String dbType) {
        StringBuilder def = new StringBuilder();
        
        // 列名
        def.append(quoteIdentifier(field.name(), dbType)).append(" ");
        
        // 类型
        String mappedType = mapType(field, typeMap);
        def.append(mappedType);
        
        // 长度/精度
        if (field.length() != null && field.length() > 0) {
            def.append("(").append(field.length());
            if (field.scale() != null && field.scale() > 0) {
                def.append(",").append(field.scale());
            }
            def.append(")");
        } else if (field.precision() != null) {
            def.append("(").append(field.precision());
            if (field.scale() != null && field.scale() > 0) {
                def.append(",").append(field.scale());
            }
            def.append(")");
        }
        
        // 空属性
        if (!field.nullable()) {
            def.append(" NOT NULL");
        }
        
        // 默认值
        if (field.defaultValue() != null && !field.defaultValue().isBlank()) {
            def.append(" DEFAULT ").append(field.defaultValue());
        }
        
        // 自增
        if (field.autoIncrement() && "MYSQL".equals(dbType)) {
            def.append(" AUTO_INCREMENT");
        }
        
        // 注释
        if (field.comment() != null && !field.comment().isBlank()) {
            def.append(" COMMENT '").append(escapeString(field.comment())).append("'");
        }
        
        return def.toString();
    }

    /**
     * 类型映射
     */
    private String mapType(FieldMeta field, Map<String, String> typeMap) {
        String baseType = (field.baseType() != null ? field.baseType() : "VARCHAR").toUpperCase();
        return typeMap.getOrDefault(baseType, "VARCHAR(255)");
    }

    /**
     * 转义标识符
     */
    private String quoteIdentifier(String identifier, String dbType) {
        if (identifier == null) return "\"\"";
        
        return switch (dbType) {
            case "MYSQL", "POSTGRESQL", "CLICKHOUSE" -> "`" + identifier + "`";
            case "ORACLE", "DAMENG", "KINGBASE" -> "\"" + identifier.toUpperCase() + "\"";
            case "SQLSERVER" -> "[" + identifier + "]";
            default -> identifier;
        };
    }

    /**
     * 转义字符串（防止 SQL 注入）
     */
    private String escapeString(String s) {
        if (s == null) return "";
        return s.replace("'", "''").replace("\\", "\\\\");
    }
}
