package com.datadictmanage.modeling.infrastructure.persistence.po;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * ModelPO — 模型持久化对象（数据库映射）
 *
 * 职责：
 *   PO（Persistent Object）与数据库表字段一一对应，
 *   由 MyBatis-Plus 负责 SQL 操作。
 *   PO 只是数据容器，不含任何业务逻辑。
 *
 * 区别：
 *   - ModelPO（此类）：基础设施层，对应 DB 表 ddm_model
 *   - ModelBO（domain层）：领域层，含业务规则
 *   - ModelVO（接入层）：前端可见
 *
 * @layer Infrastructure Layer — infrastructure/persistence/po
 * @see infra/sql/schema.sql — ddm_model 表定义
 */
@Data
@TableName("ddm_model")
public class ModelPO {

    /** 主键（UUID） */
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /** 模型名称 */
    private String name;

    /** 模型描述 */
    private String description;

    /** 所属项目 ID */
    private String projectId;

    /** 当前分支 ID */
    private String currentBranchId;

    /**
     * 实体列表（JSON 格式存储）
     * 为简化 Phase 1 实现，entities 以 JSON 列存储。
     * 生产环境应分表存储（ddm_entity、ddm_field）。
     */
    private String entitiesJson;

    /** 创建人 */
    private String createdBy;

    /** 创建时间（MyBatis-Plus 自动填充） */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** 更新时间（MyBatis-Plus 自动填充） */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    /** 逻辑删除标记（0=正常，1=已删除） */
    @TableLogic
    @TableField(value = "deleted")
    private Integer deleted;
}
