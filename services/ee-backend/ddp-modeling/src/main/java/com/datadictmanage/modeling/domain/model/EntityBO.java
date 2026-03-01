package com.datadictmanage.modeling.domain.model;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * EntityBO — 数据表领域对象
 *
 * 对应数据库中的一张物理表（或概念/逻辑层的实体）。
 * 包含业务行为：字段添加、修改、删除、排序等。
 *
 * @layer Domain Layer — domain/model
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EntityBO {

    private String id;
    private String name;
    private String comment;
    /** 建模层次：CONCEPTUAL/LOGICAL/PHYSICAL */
    private String layer;

    @Builder.Default
    private List<FieldBO> fields = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ── 领域行为 ──────────────────────────────────────────────────────────

    /**
     * 添加字段
     * 不变量：字段名在同一 Entity 内唯一
     */
    public void addField(FieldBO field) {
        boolean nameExists = this.fields.stream()
                .anyMatch(f -> f.getName().equals(field.getName()));
        if (nameExists) {
            throw new IllegalArgumentException("字段 \"" + field.getName() + "\" 已存在");
        }
        if (field.getSortOrder() == null) {
            field.setSortOrder(this.fields.size());
        }
        this.fields.add(field);
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 删除字段
     * 不变量：至少保留 1 个字段
     */
    public void removeField(String fieldId) {
        if (this.fields.size() <= 1) {
            throw new IllegalStateException("至少需要保留一个字段");
        }
        boolean removed = this.fields.removeIf(f -> f.getId().equals(fieldId));
        if (!removed) {
            throw new IllegalArgumentException("字段 [" + fieldId + "] 不存在");
        }
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 查找字段
     */
    public FieldBO findField(String fieldId) {
        return this.fields.stream()
                .filter(f -> f.getId().equals(fieldId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("字段 [" + fieldId + "] 不存在"));
    }

    /**
     * 获取主键字段列表
     */
    public List<FieldBO> getPrimaryKeyFields() {
        return this.fields.stream()
                .filter(FieldBO::isPrimaryKey)
                .toList();
    }
}
