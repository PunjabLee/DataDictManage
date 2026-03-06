package com.datadictmanage.modeling.domain.service;

import com.datadictmanage.modeling.domain.model.ModelBO;
import com.datadictmanage.modeling.domain.model.EntityBO;
import com.datadictmanage.modeling.domain.model.FieldBO;
import com.datadictmanage.modeling.domain.repository.ModelRepository;
import com.datadictmanage.modeling.application.dto.AddFieldDTO;
import com.datadictmanage.modeling.application.dto.UpdateFieldDTO;
import com.datadictmanage.modeling.application.dto.RelationDTO;
import com.datadictmanage.common.exception.BizException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ModelDomainService — 模型领域服务
 *
 * 职责：
 *   处理跨聚合的业务规则（单个聚合根无法独立完成的操作）。
 *   不依赖具体基础设施（只依赖领域接口 ModelRepository）。
 *
 * 区别于应用服务（ModelingFacade）：
 *   - 应用服务：协调流程、调用基础设施，不含业务规则
 *   - 领域服务：包含不属于单个聚合根的业务规则
 *
 * @layer Domain Layer — domain/service
 * @pattern GoF: Facade（对外提供简洁领域操作接口）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ModelDomainService {

    private final ModelRepository modelRepository;

    // ── 模型创建规则 ──────────────────────────────────────────────────────

    /**
     * 创建新模型（领域规则：同项目内名称唯一）
     *
     * @param name      模型名称
     * @param projectId 项目 ID
     * @param createdBy 创建人
     * @return 创建好的 ModelBO
     * @throws BizException 如果同名模型已存在
     */
    public ModelBO createModel(String name, String projectId, String createdBy) {
        // 领域规则：同项目内模型名称唯一
        ModelBO.validateName(name);
        modelRepository.findByProjectIdAndName(projectId, name)
                .ifPresent(existing -> {
                    throw BizException.conflict("模型 \"" + name + "\" 在该项目中已存在");
                });

        String mainBranchId = UUID.randomUUID().toString();

        return ModelBO.builder()
                .id(UUID.randomUUID().toString())
                .name(name)
                .projectId(projectId)
                .currentBranchId(mainBranchId)
                .createdBy(createdBy)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    /**
     * 向模型添加数据表（领域规则：表名唯一，不含特殊字符）
     *
     * @param model   模型对象
     * @param name    表名（英文，下划线命名法）
     * @param comment 表注释
     * @param layer   建模层次
     * @return 新建的 EntityBO
     */
    public EntityBO addEntity(ModelBO model, String name, String comment, String layer) {
        // 领域规则：表名格式校验
        validateEntityName(name);

        EntityBO entity = EntityBO.builder()
                .id(UUID.randomUUID().toString())
                .name(name)
                .comment(comment != null ? comment : "")
                .layer(layer != null ? layer : "PHYSICAL")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // 自动添加默认主键字段（领域规则）
        FieldBO idField = FieldBO.builder()
                .id(UUID.randomUUID().toString())
                .name("id")
                .comment("主键")
                .baseType("STRING")
                .length(36)
                .nullable(false)
                .primaryKey(true)
                .unique(true)
                .autoIncrement(false)
                .sortOrder(0)
                .build();
        entity.addField(idField);

        // 委托给聚合根的领域行为
        model.addEntity(entity);

        log.info("[领域服务] 模型 {} 添加数据表 {}", model.getId(), name);
        return entity;
    }

    /**
     * 验证表名格式
     * 规则：只允许字母、数字、下划线，以字母开头，不超过 64 字符
     */
    private void validateEntityName(String name) {
        if (name == null || name.isBlank()) {
            throw BizException.invalidParam("表名不能为空");
        }
        if (name.length() > 64) {
            throw BizException.invalidParam("表名不能超过 64 个字符");
        }
        if (!name.matches("^[a-zA-Z][a-zA-Z0-9_]*$")) {
            throw BizException.invalidParam("表名只能包含字母、数字、下划线，且以字母开头");
        }
    }

    /**
     * 验证模型是否属于指定项目（访问控制）
     *
     * @param model     模型对象
     * @param projectId 期望的项目 ID
     * @throws BizException 如果模型不属于该项目
     */
    public void assertModelBelongsToProject(ModelBO model, String projectId) {
        if (!model.getProjectId().equals(projectId)) {
            throw BizException.forbidden("模型不属于项目 [" + projectId + "]");
        }
    }

    // ── 字段管理 ─────────────────────────────────────────────────────────

    /**
     * 向实体添加字段
     *
     * @param model     模型对象
     * @param entityId  实体 ID
     * @param dto       字段数据
     * @param operatorId 操作人
     * @return 新建的 FieldBO
     */
    public FieldBO addField(ModelBO model, String entityId, AddFieldDTO dto, String operatorId) {
        EntityBO entity = model.getEntities().stream()
                .filter(e -> e.getId().equals(entityId))
                .findFirst()
                .orElseThrow(() -> BizException.notFound("实体", entityId));

        // 领域规则：字段名唯一
        boolean nameExists = entity.getFields().stream()
                .anyMatch(f -> f.getName().equals(dto.getName()));
        if (nameExists) {
            throw BizException.conflict("字段名 \"" + dto.getName() + "\" 已存在");
        }

        FieldBO field = FieldBO.builder()
                .id(UUID.randomUUID().toString())
                .name(dto.getName())
                .comment(dto.getComment() != null ? dto.getComment() : "")
                .baseType(dto.getBaseType())
                .length(dto.getLength())
                .precision(dto.getPrecision())
                .scale(dto.getScale())
                .nullable(dto.getNullable() != null ? dto.getNullable() : true)
                .primaryKey(dto.getPrimaryKey() != null ? dto.getPrimaryKey() : false)
                .unique(dto.getUnique() != null ? dto.getUnique() : false)
                .autoIncrement(dto.getAutoIncrement() != null ? dto.getAutoIncrement() : false)
                .defaultValue(dto.getDefaultValue())
                .sortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : entity.getFields().size())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        entity.addField(field);
        log.info("[领域服务] 实体 {} 添加字段 {}", entityId, dto.getName());
        return field;
    }

    /**
     * 更新字段
     *
     * @param model     模型对象
     * @param entityId  实体 ID
     * @param fieldId   字段 ID
     * @param dto       更新数据
     * @param operatorId 操作人
     */
    public void updateField(ModelBO model, String entityId, String fieldId, UpdateFieldDTO dto, String operatorId) {
        EntityBO entity = model.getEntities().stream()
                .filter(e -> e.getId().equals(entityId))
                .findFirst()
                .orElseThrow(() -> BizException.notFound("实体", entityId));

        FieldBO field = entity.getFields().stream()
                .filter(f -> f.getId().equals(fieldId))
                .findFirst()
                .orElseThrow(() -> BizException.notFound("字段", fieldId));

        // 更新字段属性
        if (dto.getName() != null) field.setName(dto.getName());
        if (dto.getComment() != null) field.setComment(dto.getComment());
        if (dto.getBaseType() != null) field.setBaseType(dto.getBaseType());
        if (dto.getLength() != null) field.setLength(dto.getLength());
        if (dto.getPrecision() != null) field.setPrecision(dto.getPrecision());
        if (dto.getScale() != null) field.setScale(dto.getScale());
        if (dto.getNullable() != null) field.setNullable(dto.getNullable());
        if (dto.getUnique() != null) field.setUnique(dto.getUnique());
        if (dto.getDefaultValue() != null) field.setDefaultValue(dto.getDefaultValue());
        field.setUpdatedAt(LocalDateTime.now());

        log.info("[领域服务] 更新字段: {}", fieldId);
    }

    /**
     * 删除字段
     *
     * @param model     模型对象
     * @param entityId  实体 ID
     * @param fieldId   字段 ID
     * @param operatorId 操作人
     */
    public void deleteField(ModelBO model, String entityId, String fieldId, String operatorId) {
        EntityBO entity = model.getEntities().stream()
                .filter(e -> e.getId().equals(entityId))
                .findFirst()
                .orElseThrow(() -> BizException.notFound("实体", entityId));

        boolean removed = entity.getFields().removeIf(f -> f.getId().equals(fieldId));
        if (!removed) {
            throw BizException.notFound("字段", fieldId);
        }

        log.info("[领域服务] 删除字段: entity={}, field={}", entityId, fieldId);
    }

    // ── 关系管理 ─────────────────────────────────────────────────────────

    /**
     * 添加实体间关系
     *
     * @param model     模型对象
     * @param dto       关系数据
     * @param operatorId 操作人
     * @return 新建的关系
     */
    public ModelBO.Relation addRelation(ModelBO model, RelationDTO dto, String operatorId) {
        // 验证源实体和目标实体存在
        boolean fromExists = model.getEntities().stream()
                .anyMatch(e -> e.getId().equals(dto.getFromEntityId()));
        boolean toExists = model.getEntities().stream()
                .anyMatch(e -> e.getId().equals(dto.getToEntityId()));

        if (!fromExists) throw BizException.notFound("源实体", dto.getFromEntityId());
        if (!toExists) throw BizException.notFound("目标实体", dto.getToEntityId());

        ModelBO.Relation relation = ModelBO.Relation.builder()
                .id(UUID.randomUUID().toString())
                .fromEntityId(dto.getFromEntityId())
                .toEntityId(dto.getToEntityId())
                .type(dto.getType())
                .comment(dto.getComment() != null ? dto.getComment() : "")
                .foreignKeyName(dto.getForeignKeyName())
                .createdAt(LocalDateTime.now())
                .build();

        model.addRelation(relation);
        log.info("[领域服务] 添加关系: from={}, to={}", dto.getFromEntityId(), dto.getToEntityId());
        return relation;
    }

    /**
     * 删除关系
     *
     * @param model     模型对象
     * @param relationId 关系 ID
     * @param operatorId 操作人
     */
    public void deleteRelation(ModelBO model, String relationId, String operatorId) {
        boolean removed = model.getRelations().removeIf(r -> r.getId().equals(relationId));
        if (!removed) {
            throw BizException.notFound("关系", relationId);
        }
        log.info("[领域服务] 删除关系: {}", relationId);
    }
}
