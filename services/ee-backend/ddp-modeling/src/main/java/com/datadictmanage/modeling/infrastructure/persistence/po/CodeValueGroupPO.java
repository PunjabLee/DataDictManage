package com.datadictmanage.modeling.infrastructure.persistence.po;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * CodeValueGroupPO — 代码值组持久化对象
 * 枚举条目存储在 itemsJson 字段中（JSON 格式）
 */
@Data
@TableName("ddm_code_value_group")
public class CodeValueGroupPO {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /** 字典编码（全局唯一） */
    private String code;

    /** 字典名称 */
    private String name;

    /** 描述 */
    private String description;

    /** 枚举条目（JSON 格式存储） */
    private String itemsJson;

    /** 状态：DRAFT / PUBLISHED / DEPRECATED */
    private String status;

    /** 所属分类 ID */
    private String categoryId;

    /** 创建人 */
    private String createdBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    @TableField(value = "deleted")
    private Integer deleted;
}
