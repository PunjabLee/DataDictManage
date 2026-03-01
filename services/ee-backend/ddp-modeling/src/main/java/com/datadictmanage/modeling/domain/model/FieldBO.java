package com.datadictmanage.modeling.domain.model;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

/**
 * FieldBO — 字段领域对象
 *
 * 对应数据表中的一列（Column）。
 * 包含字段的完整元数据：类型、约束、标准引用等。
 *
 * @layer Domain Layer — domain/model
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FieldBO {

    private String id;
    private String name;
    private String comment;

    /** 基础类型（STRING/INTEGER/DECIMAL/BOOLEAN/DATE/DATETIME/TEXT/BLOB/JSON） */
    private String baseType;

    /** 字符串长度（STRING 类型使用） */
    private Integer length;

    /** 数值精度（DECIMAL 类型使用） */
    private Integer precision;

    /** 小数位数（DECIMAL 类型使用） */
    private Integer scale;

    private boolean nullable;
    private boolean primaryKey;
    private boolean unique;
    private boolean autoIncrement;
    private String defaultValue;
    private Integer sortOrder;

    // ── 数据标准引用（跨上下文引用，只用 ID + 名称） ──────────────────────

    /** 绑定的数据项标准 ID */
    private String standardId;

    /** 绑定的数据项标准名称（冗余存储，避免跨服务查询） */
    private String standardName;

    /** 绑定的代码值组 ID */
    private String codeValueGroupId;

    /** 绑定的代码值组名称 */
    private String codeValueGroupName;

    // ── 业务方法 ──────────────────────────────────────────────────────────

    /**
     * 是否已绑定数据标准
     */
    public boolean hasStandardBinding() {
        return standardId != null && !standardId.isBlank();
    }

    /**
     * 格式化类型显示字符串，如 VARCHAR(255)、DECIMAL(18,4)
     */
    public String formatTypeLabel() {
        return switch (baseType.toUpperCase()) {
            case "STRING" -> "VARCHAR(" + (length != null ? length : 255) + ")";
            case "DECIMAL" -> "DECIMAL(" + (precision != null ? precision : 18) + "," + (scale != null ? scale : 4) + ")";
            default -> baseType;
        };
    }
}
