package com.datadictmanage.modeling.domain.permission;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * PermissionDomainService — 权限领域服务
 * 负责权限检查和继承逻辑
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PermissionDomainService {

    private final PermissionRepository permissionRepository;

    /**
     * 检查用户是否有权限执行指定动作
     * 
     * 权限继承规则：
     * 1. 先检查模型级权限
     * 2. 再检查项目级权限
     * 3. 最后检查团队级权限
     * 4. 团队成员自动拥有团队下所有资源的 VIEW 权限
     */
    public boolean checkPermission(String userId, String resourceType, String resourceId, String action) {
        // 1. 检查直接权限
        if (hasDirectPermission(userId, resourceId, action)) {
            return true;
        }

        // 2. 检查角色权限
        if (hasRolePermission(userId, resourceId, action)) {
            return true;
        }

        // 3. 检查继承权限
        return hasInheritedPermission(userId, resourceType, resourceId, action);
    }

    /**
     * 获取用户对资源的所有权限
     */
    public List<PermissionBO> getPermissions(String userId, String resourceId) {
        return permissionRepository.getUserPermissions(userId, resourceId);
    }

    /**
     * 创建权限
     */
    public PermissionBO createPermission(PermissionBO permission) {
        permissionRepository.save(permission);
        log.info("创建权限成功: {} -> {} {}", permission.getPrincipalId(), permission.getResourceType(), permission.getActions());
        return permission;
    }

    /**
     * 删除权限
     */
    public void deletePermission(String permissionId) {
        permissionRepository.delete(permissionId);
        log.info("删除权限成功: {}", permissionId);
    }

    /**
     * 删除资源的所有权限（如删除项目时调用）
     */
    public void deleteResourcePermissions(String resourceId) {
        permissionRepository.deleteByResourceId(resourceId);
        log.info("删除资源所有权限: {}", resourceId);
    }

    // ── 私有方法 ─────────────────────────────────────────────────────────────

    private boolean hasDirectPermission(String userId, String resourceId, String action) {
        List<PermissionBO> permissions = permissionRepository.getUserPermissions(userId, resourceId);
        return permissions.stream()
                .anyMatch(p -> p.getPrincipalType().equals(PermissionBO.PRINCIPAL_TYPE_USER)
                        && p.getActions().contains(action));
    }

    private boolean hasRolePermission(String userId, String resourceId, String action) {
        // 查询用户的角色权限
        List<PermissionBO> permissions = permissionRepository.findByPrincipalIdAndResourceType(userId, PermissionBO.PRINCIPAL_TYPE_ROLE);
        return permissions.stream()
                .anyMatch(p -> p.getResourceId().equals(resourceId) && p.getActions().contains(action));
    }

    private boolean hasInheritedPermission(String userId, String resourceType, String resourceId, String action) {
        // 团队级权限继承：如果是项目或模型，自动继承团队权限
        if (PermissionBO.RESOURCE_TYPE_MODEL.equals(resourceType)) {
            // TODO: 需要通过项目查到团队ID，再查团队权限
            // 简化处理：项目管理员自动拥有模型权限
            return checkProjectInheritedPermission(userId, resourceId, action);
        }
        return false;
    }

    private boolean checkProjectInheritedPermission(String userId, String modelId, String action) {
        // TODO: 实现项目到团队的继承检查
        return false;
    }
}
