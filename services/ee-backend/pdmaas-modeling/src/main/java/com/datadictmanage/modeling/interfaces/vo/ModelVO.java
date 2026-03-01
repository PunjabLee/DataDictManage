package com.datadictmanage.modeling.interfaces.vo;

import lombok.Data;

import java.util.List;

/**
 * ModelVO — 模型视图对象（返回给前端的数据结构）
 *
 * 职责：
 *   VO（View Object）是接入层与前端之间的数据契约。
 *   VO 只携带展示数据，不含业务逻辑。
 *
 * 区别：
 *   - ModelVO（此类）：接入层，前端可见
 *   - ModelBO（domain层）：领域对象，含业务规则
 *   - ModelPO（infra层）：持久化对象，含数据库字段
 *
 * @layer Interface Layer (接入层) — interfaces/vo
 */
@Data
public class ModelVO {

    private String id;
    private String name;
    private String description;
    private String projectId;
    private String currentBranchId;
    private int entityCount;
    private String createdBy;
    private String createdAt;
    private String updatedAt;

    /** Entity 列表（详情接口才包含，列表接口为 null） */
    private List<EntityVO> entities;

    /**
     * Entity 视图（嵌套 VO）
     */
    @Data
    public static class EntityVO {
        private String id;
        private String name;
        private String comment;
        private String layer;
        private List<FieldVO> fields;
    }

    /**
     * Field 视图（嵌套 VO）
     */
    @Data
    public static class FieldVO {
        private String id;
        private String name;
        private String comment;
        private String baseType;
        private Integer length;
        private Integer precision;
        private Integer scale;
        private boolean nullable;
        private boolean primaryKey;
        private boolean unique;
        private boolean autoIncrement;
        private String defaultValue;
        private Integer sortOrder;
        private String typeLabel;      // 格式化后的类型显示，如 VARCHAR(255)
        private String standardId;
        private String standardName;
        private boolean hasStandardBinding;
    }
}
