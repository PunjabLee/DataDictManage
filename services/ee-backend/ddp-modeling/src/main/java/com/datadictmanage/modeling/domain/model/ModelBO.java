package com.datadictmanage.modeling.domain.model;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * ModelBO — 数据模型领域对象（Business Object）
 *
 * 职责：
 *   领域层的核心业务对象，包含业务逻辑方法。
 *   区别：
 *   - ModelBO（此类）：领域层，含业务规则
 *   - ModelPO（infra层）：持久化对象，只含数据库字段
 *   - ModelVO（接入层）：视图对象，只含前端展示字段
 *   - CreateModelDTO（应用层）：入参 DTO
 *
 * @layer Domain Layer — domain/model
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ModelBO {

    /** 模型 ID（UUID） */
    private String id;

    /** 模型名称 */
    private String name;

    /** 模型描述 */
    private String description;

    /** 所属项目 ID */
    private String projectId;

    /** 当前分支 ID */
    private String currentBranchId;

    /** 数据表（Entity）列表 */
    @Builder.Default
    private List<EntityBO> entities = new ArrayList<>();

    /** 创建人 */
    private String createdBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ── 领域行为 ──────────────────────────────────────────────────────────

    /**
     * 添加数据表
     * 不变量：表名在同一模型内唯一
     *
     * @param entity 待添加的 Entity
     * @throws IllegalArgumentException 如果表名已存在
     */
    public void addEntity(EntityBO entity) {
        boolean nameExists = this.entities.stream()
                .anyMatch(e -> e.getName().equals(entity.getName()));
        if (nameExists) {
            throw new IllegalArgumentException("表名 \"" + entity.getName() + "\" 已存在");
        }
        this.entities.add(entity);
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 删除数据表（同时清理相关关系）
     */
    public void removeEntity(String entityId) {
        boolean removed = this.entities.removeIf(e -> e.getId().equals(entityId));
        if (!removed) {
            throw new IllegalArgumentException("表 [" + entityId + "] 不存在");
        }
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 查找 Entity
     */
    public EntityBO findEntity(String entityId) {
        return this.entities.stream()
                .filter(e -> e.getId().equals(entityId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("表 [" + entityId + "] 不存在"));
    }

    /**
     * 校验模型名称
     */
    public static void validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("模型名称不能为空");
        }
        if (name.length() > 128) {
            throw new IllegalArgumentException("模型名称不能超过 128 个字符");
        }
    }
}
