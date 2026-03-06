package com.datadictmanage.modeling.infrastructure.persistence.po;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * StandardCategoryPO — 数据标准分类持久化对象
 */
@Data
@TableName("ddm_standard_category")
public class StandardCategoryPO {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /** 分类名称 */
    private String name;

    /** 父分类 ID（顶级为 null） */
    private String parentId;

    /** 排序 */
    private Integer sortOrder;

    /** 描述 */
    private String description;

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
