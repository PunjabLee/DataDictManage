package com.datadictmanage.modeling.infrastructure.persistence.team;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * ProjectPO — 项目持久化对象
 */
@Data
@TableName("t_project")
public class ProjectPO {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String teamId;
    private String name;
    private String description;
    private String icon;
    private Integer status;
    private String createdBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
