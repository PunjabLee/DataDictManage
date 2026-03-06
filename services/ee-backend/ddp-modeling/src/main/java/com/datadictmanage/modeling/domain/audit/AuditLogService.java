package com.datadictmanage.modeling.domain.audit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.UUID;

/**
 * AuditLogService — 审计日志领域服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    /**
     * 记录审计日志
     */
    public void log(AuditLogBO auditLog) {
        if (auditLog.getId() == null) {
            auditLog.setId(UUID.randomUUID().toString());
        }
        if (auditLog.getCreatedAt() == null) {
            auditLog.setCreatedAt(new Date());
        }

        // TODO: 保存到数据库
        log.info("[Audit] {} {} {} {} - {}",
                auditLog.getUserId(),
                auditLog.getModule(),
                auditLog.getOperation(),
                auditLog.getResourceType(),
                auditLog.getResourceName());
    }

    /**
     * 记录创建操作
     */
    public void logCreate(String userId, String userName, String module, String resourceType, String resourceId, String resourceName, String detail) {
        log(AuditLogBO.builder()
                .userId(userId)
                .userName(userName)
                .module(module)
                .operation(AuditLogBO.OP_CREATE)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .resourceName(resourceName)
                .detail(detail)
                .build());
    }

    /**
     * 记录更新操作
     */
    public void logUpdate(String userId, String userName, String module, String resourceType, String resourceId, String resourceName, String detail) {
        log(AuditLogBO.builder()
                .userId(userId)
                .userName(userName)
                .module(module)
                .operation(AuditLogBO.OP_UPDATE)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .resourceName(resourceName)
                .detail(detail)
                .build());
    }

    /**
     * 记录删除操作
     */
    public void logDelete(String userId, String userName, String module, String resourceType, String resourceId, String resourceName) {
        log(AuditLogBO.builder()
                .userId(userId)
                .userName(userName)
                .module(module)
                .operation(AuditLogBO.OP_DELETE)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .resourceName(resourceName)
                .build());
    }

    /**
     * 记录发布操作
     */
    public void logPublish(String userId, String userName, String module, String resourceType, String resourceId, String resourceName) {
        log(AuditLogBO.builder()
                .userId(userId)
                .userName(userName)
                .module(module)
                .operation(AuditLogBO.OP_PUBLISH)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .resourceName(resourceName)
                .build());
    }
}
