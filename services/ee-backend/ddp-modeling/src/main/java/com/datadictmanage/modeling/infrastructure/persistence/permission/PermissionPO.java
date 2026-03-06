package com.datadictmanage.modeling.infrastructure.persistence.permission;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * PermissionPO — 权限持久化对象
 */
@Data
@TableName("ddm_permission")
public class PermissionPO {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /** 资源类型: TEAM / PROJECT / MODEL */
    private String resourceType;

    /** 资源ID */
    private String resourceId;

    /** 主体类型: USER / ROLE */
    private String principalType;

    /** 用户ID或角色ID */
    private String principalId;

    /** 权限动作 JSON: ["VIEW","EDIT","DELETE"] */
    private String actionsJson;

    /** 创建人 */
    private String createdBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
