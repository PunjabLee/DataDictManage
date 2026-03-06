package com.datadictmanage.modeling.infrastructure.persistence.permission;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.datadictmanage.modeling.domain.permission.PermissionBO;
import com.datadictmanage.modeling.domain.permission.PermissionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * PermissionRepositoryImpl — 权限仓储实现
 */
@Repository
@RequiredArgsConstructor
public class PermissionRepositoryImpl implements PermissionRepository {

    private final PermissionMapper permissionMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public PermissionBO findById(String id) {
        PermissionPO po = permissionMapper.selectById(id);
        return po != null ? toBO(po) : null;
    }

    @Override
    public List<PermissionBO> findByResourceId(String resourceId) {
        LambdaQueryWrapper<PermissionPO> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PermissionPO::getResourceId, resourceId);
        return permissionMapper.selectList(wrapper).stream()
                .map(this::toBO)
                .collect(Collectors.toList());
    }

    @Override
    public List<PermissionBO> findByPrincipalId(String principalId) {
        LambdaQueryWrapper<PermissionPO> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PermissionPO::getPrincipalId, principalId);
        return permissionMapper.selectList(wrapper).stream()
                .map(this::toBO)
                .collect(Collectors.toList());
    }

    @Override
    public List<PermissionBO> findByResourceIdAndResourceType(String resourceId, String resourceType) {
        LambdaQueryWrapper<PermissionPO> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PermissionPO::getResourceId, resourceId)
                .eq(PermissionPO::getResourceType, resourceType);
        return permissionMapper.selectList(wrapper).stream()
                .map(this::toBO)
                .collect(Collectors.toList());
    }

    @Override
    public List<PermissionBO> findByPrincipalIdAndResourceType(String principalId, String resourceType) {
        LambdaQueryWrapper<PermissionPO> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PermissionPO::getPrincipalId, principalId)
                .eq(PermissionPO::getResourceType, resourceType);
        return permissionMapper.selectList(wrapper).stream()
                .map(this::toBO)
                .collect(Collectors.toList());
    }

    @Override
    public void save(PermissionBO bo) {
        PermissionPO po = toPO(bo);
        if (permissionMapper.selectById(bo.getId()) != null) {
            permissionMapper.updateById(po);
        } else {
            permissionMapper.insert(po);
        }
    }

    @Override
    public void delete(String id) {
        permissionMapper.deleteById(id);
    }

    @Override
    public void deleteByResourceId(String resourceId) {
        LambdaQueryWrapper<PermissionPO> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PermissionPO::getResourceId, resourceId);
        permissionMapper.delete(wrapper);
    }

    @Override
    public void deleteByPrincipalId(String principalId) {
        LambdaQueryWrapper<PermissionPO> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PermissionPO::getPrincipalId, principalId);
        permissionMapper.delete(wrapper);
    }

    @Override
    public boolean hasPermission(String userId, String resourceId, String action) {
        // 先查直接用户权限
        LambdaQueryWrapper<PermissionPO> userWrapper = new LambdaQueryWrapper<>();
        userWrapper.eq(PermissionPO::getResourceId, resourceId)
                .eq(PermissionPO::getPrincipalType, PermissionBO.PRINCIPAL_TYPE_USER)
                .eq(PermissionPO::getPrincipalId, userId);
        
        List<PermissionPO> userPerms = permissionMapper.selectList(userWrapper);
        for (PermissionPO po : userPerms) {
            List<String> actions = parseActions(po.getActionsJson());
            if (actions.contains(action)) {
                return true;
            }
        }

        // TODO: 再查角色权限
        return false;
    }

    @Override
    public List<PermissionBO> getUserPermissions(String userId, String resourceId) {
        LambdaQueryWrapper<PermissionPO> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PermissionPO::getResourceId, resourceId)
                .eq(PermissionPO::getPrincipalId, userId);
        return permissionMapper.selectList(wrapper).stream()
                .map(this::toBO)
                .collect(Collectors.toList());
    }

    private PermissionBO toBO(PermissionPO po) {
        return PermissionBO.builder()
                .id(po.getId())
                .resourceType(po.getResourceType())
                .resourceId(po.getResourceId())
                .principalType(po.getPrincipalType())
                .principalId(po.getPrincipalId())
                .actions(parseActions(po.getActionsJson()))
                .createdBy(po.getCreatedBy())
                .createdAt(po.getCreatedAt())
                .updatedAt(po.getUpdatedAt())
                .build();
    }

    private PermissionPO toPO(PermissionBO bo) {
        PermissionPO po = new PermissionPO();
        po.setId(bo.getId());
        po.setResourceType(bo.getResourceType());
        po.setResourceId(bo.getResourceId());
        po.setPrincipalType(bo.getPrincipalType());
        po.setPrincipalId(bo.getPrincipalId());
        po.setActionsJson(toActionsJson(bo.getActions()));
        po.setCreatedBy(bo.getCreatedBy());
        return po;
    }

    private List<String> parseActions(String json) {
        if (json == null || json.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            return new ArrayList<>();
        }
    }

    private String toActionsJson(List<String> actions) {
        if (actions == null || actions.isEmpty()) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(actions);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }
}
