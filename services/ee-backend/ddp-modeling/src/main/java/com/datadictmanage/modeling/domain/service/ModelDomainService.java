package com.datadictmanage.modeling.domain.service;

import com.datadictmanage.modeling.domain.model.ModelBO;
import com.datadictmanage.modeling.domain.model.EntityBO;
import com.datadictmanage.modeling.domain.model.FieldBO;
import com.datadictmanage.modeling.domain.repository.ModelRepository;
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
}
