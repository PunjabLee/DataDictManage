package com.datadictmanage.modeling.domain.standard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

/**
 * CodeValueItemBO — 代码值条目 业务对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeValueItemBO {
    private String value;      // 存储值
    private String label;      // 显示标签
    private String labelEn;   // 英文标签
    private Integer sortOrder;
    private Boolean enabled;
    private String remark;
}

/**
 * CodeValueGroupBO — 代码值组（枚举字典） 业务对象
 * 对应 core-engine/src/domain/standard/code-value.ts 的领域模型
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeValueGroupBO {

    private String id;
    private String code;           // 字典编码（如 GENDER）
    private String name;            // 字典名称
    private String description;    // 描述
    private List<CodeValueItemBO> items;  // 枚举条目
    private String status;         // DRAFT / PUBLISHED / DEPRECATED
    private String categoryId;     // 所属分类 ID
    private String createdBy;
    private Date createdAt;
    private Date updatedAt;
}
