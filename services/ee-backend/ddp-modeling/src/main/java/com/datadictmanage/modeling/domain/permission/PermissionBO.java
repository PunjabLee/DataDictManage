package com.datadictmanage.modeling.domain.permission;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

/**
 * PermissionBO — 权限 业务对象
 * 支持三级权限：团队/项目/模型
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionBO {

    private String id;
    private String resourceType;    // RESOURCE_TYPE: TEAM / PROJECT / MODEL
    private String resourceId;       // 资源ID
    private String principalType;   // PRINCIPAL_TYPE: USER / ROLE
    private String principalId;     // 用户ID或角色ID
    private List<String> actions;   // 权限动作: VIEW / EDIT / DELETE / MANAGE
    private String createdBy;
    private Date createdAt;
    private Date updatedAt;

    // 资源类型枚举
    public static final String RESOURCE_TYPE_TEAM = "TEAM";
    public static final String RESOURCE_TYPE_PROJECT = "PROJECT";
    public static final String RESOURCE_TYPE_MODEL = "MODEL";

    // 主体类型枚举
    public static final String PRINCIPAL_TYPE_USER = "USER";
    public static final String PRINCIPAL_TYPE_ROLE = "ROLE";

    // 动作枚举
    public static final String ACTION_VIEW = "VIEW";
    public static final String ACTION_EDIT = "EDIT";
    public static final String ACTION_DELETE = "DELETE";
    public static final String ACTION_MANAGE = "MANAGE";
}
