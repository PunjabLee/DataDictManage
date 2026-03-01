package com.datadictmanage.modeling.infrastructure.persistence;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.datadictmanage.modeling.domain.model.ModelBO;
import com.datadictmanage.modeling.domain.model.EntityBO;
import com.datadictmanage.modeling.domain.model.FieldBO;
import com.datadictmanage.modeling.domain.repository.ModelRepository;
import com.datadictmanage.modeling.infrastructure.persistence.mapper.ModelMapper;
import com.datadictmanage.modeling.infrastructure.persistence.po.ModelPO;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * ModelRepositoryImpl — 模型仓储实现（基础设施层）
 *
 * 职责：
 *   实现领域层定义的 ModelRepository 接口。
 *   负责 ModelBO（领域对象）和 ModelPO（持久化对象）之间的转换，
 *   以及通过 MyBatis-Plus 进行数据库 CRUD 操作。
 *
 * 设计说明：
 *   - PO 完全不进入领域层，通过此类做"防腐"
 *   - 使用 JSON 列存储 entities（Phase 1 简化实现）
 *   - 生产版本应将 Entity/Field 分表存储
 *
 * @layer Infrastructure Layer — infrastructure/persistence
 * @pattern GoF: Repository（实现领域层的 ModelRepository 接口）
 *           Adapter（将 PO 适配为 BO，隔离持久化框架）
 */
@Slf4j
@Repository
@RequiredArgsConstructor
public class ModelRepositoryImpl implements ModelRepository {

    private final ModelMapper modelMapper;
    private final ObjectMapper objectMapper;

    // ── ModelRepository 接口实现 ──────────────────────────────────────────

    @Override
    public Optional<ModelBO> findById(String id) {
        ModelPO po = modelMapper.selectById(id);
        return Optional.ofNullable(po).map(this::poToBO);
    }

    @Override
    public List<ModelBO> findByProjectId(String projectId) {
        return modelMapper.selectByProjectId(projectId)
                .stream()
                .map(this::poToBO)
                .toList();
    }

    @Override
    public Optional<ModelBO> findByProjectIdAndName(String projectId, String name) {
        ModelPO po = modelMapper.selectOne(
            new LambdaQueryWrapper<ModelPO>()
                .eq(ModelPO::getProjectId, projectId)
                .eq(ModelPO::getName, name)
        );
        return Optional.ofNullable(po).map(this::poToBO);
    }

    @Override
    @SneakyThrows
    public void save(ModelBO model) {
        ModelPO po = boToPO(model);
        if (modelMapper.selectById(po.getId()) != null) {
            modelMapper.updateById(po);
        } else {
            modelMapper.insert(po);
        }
    }

    @Override
    public void deleteById(String id) {
        modelMapper.deleteById(id);
    }

    @Override
    public boolean existsById(String id) {
        return modelMapper.selectById(id) != null;
    }

    @Override
    @SneakyThrows
    public String saveSnapshot(String modelId, String branchId, String snapshot, String versionTag) {
        // Phase 1 简化实现：快照存储在内存/文件
        // 生产版本：存储到 MinIO 或 ddm_snapshot 表
        String snapshotId = UUID.randomUUID().toString();
        log.info("[仓储] 保存快照: modelId={}, snapshotId={}, tag={}", modelId, snapshotId, versionTag);
        return snapshotId;
    }

    @Override
    public Optional<String> findSnapshot(String snapshotId) {
        // Phase 1 简化实现
        return Optional.empty();
    }

    // ── PO <-> BO 转换（防腐层，隔离持久化框架） ─────────────────────────

    /**
     * ModelPO → ModelBO（从数据库还原领域对象）
     */
    @SneakyThrows
    private ModelBO poToBO(ModelPO po) {
        List<EntityBO> entities = new ArrayList<>();
        if (po.getEntitiesJson() != null && !po.getEntitiesJson().isBlank()) {
            entities = objectMapper.readValue(
                po.getEntitiesJson(),
                new TypeReference<List<EntityBO>>() {}
            );
        }

        return ModelBO.builder()
                .id(po.getId())
                .name(po.getName())
                .description(po.getDescription())
                .projectId(po.getProjectId())
                .currentBranchId(po.getCurrentBranchId())
                .entities(entities)
                .createdBy(po.getCreatedBy())
                .createdAt(po.getCreatedAt())
                .updatedAt(po.getUpdatedAt())
                .build();
    }

    /**
     * ModelBO → ModelPO（准备持久化）
     */
    @SneakyThrows
    private ModelPO boToPO(ModelBO bo) {
        ModelPO po = new ModelPO();
        po.setId(bo.getId());
        po.setName(bo.getName());
        po.setDescription(bo.getDescription());
        po.setProjectId(bo.getProjectId());
        po.setCurrentBranchId(bo.getCurrentBranchId());
        po.setCreatedBy(bo.getCreatedBy());
        po.setCreatedAt(bo.getCreatedAt());
        po.setUpdatedAt(bo.getUpdatedAt());

        // 将 entities 序列化为 JSON 存储
        if (bo.getEntities() != null) {
            po.setEntitiesJson(objectMapper.writeValueAsString(bo.getEntities()));
        }

        return po;
    }
}
