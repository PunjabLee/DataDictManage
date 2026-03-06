package com.datadictmanage.modeling.domain.audit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.Map;

/**
 * AuditLogBO — 审计日志 业务对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogBO {

    private String id;
    private String userId;        // 操作人ID
    private String userName;       // 操作人名称
    private String module;         // 模块: MODEL / TEAM / PROJECT / STANDARD
    private String operation;      // 操作类型: CREATE / UPDATE / DELETE / PUBLISH / IMPORT / EXPORT
    private String resourceType;  // 资源类型
    private String resourceId;    // 资源ID
    private String resourceName;   // 资源名称
    private String detail;         // 详细JSON
    private String ip;             // IP地址
    private String userAgent;      // 用户代理
    private Date createdAt;

    // 操作类型常量
    public static final String OP_CREATE = "CREATE";
    public static final String OP_UPDATE = "UPDATE";
    public static final String OP_DELETE = "DELETE";
    public static final String OP_PUBLISH = "PUBLISH";
    public static final String OP_IMPORT = "IMPORT";
    public static final String OP_EXPORT = "EXPORT";
    public static final String OP_VIEW = "VIEW";

    // 模块常量
    public static final String MODULE_MODEL = "MODEL";
    public static final String MODULE_TEAM = "TEAM";
    public static final String MODULE_PROJECT = "PROJECT";
    public static final String MODULE_STANDARD = "STANDARD";
}
