package com.datadictmanage.modeling.domain.permission;

import java.util.List;

/**
 * PermissionRepository — 权限仓储接口
 */
public interface PermissionRepository {

    PermissionBO findById(String id);

    List<PermissionBO> findByResourceId(String resourceId);

    List<PermissionBO> findByPrincipalId(String principalId);

    List<PermissionBO> findByResourceIdAndResourceType(String resourceId, String resourceType);

    List<PermissionBO> findByPrincipalIdAndResourceType(String principalId, String resourceType);

    void save(PermissionBO bo);

    void delete(String id);

    void deleteByResourceId(String resourceId);

    void deleteByPrincipalId(String principalId);

    /**
     * 检查用户是否有指定资源的指定权限
     */
    boolean hasPermission(String userId, String resourceId, String action);

    /**
     * 获取用户对指定资源的所有权限
     */
    List<PermissionBO> getUserPermissions(String userId, String resourceId);
}
