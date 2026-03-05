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
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

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
 *   - 快照存储：文件存储（snapshots/{modelId}/{snapshotId}.json）
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

    /** 快照存储根目录 */
    @Value("${ddm.snapshot.path:./snapshots}")
    private String snapshotBasePath;

    private Path snapshotRoot;

    // ── 初始化 ─────────────────────────────────────────────────────────

    @PostConstruct
    public void init() {
        try {
            snapshotRoot = Paths.get(snapshotBasePath).toAbsolutePath();
            if (!Files.exists(snapshotRoot)) {
                Files.createDirectories(snapshotRoot);
                log.info("[仓储] 创建快照存储目录: {}", snapshotRoot);
            }
        } catch (Exception e) {
            log.error("[仓储] 初始化快照目录失败，使用默认路径", e);
            snapshotRoot = Paths.get(System.getProperty("java.io.tmpdir"), "ddm-snapshots");
        }
    }

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

    // ── 快照管理 ─────────────────────────────────────────────────────────

    @Override
    @SneakyThrows
    public String saveSnapshot(String modelId, String branchId, String snapshot, String versionTag) {
        String snapshotId = "snap-" + UUID.randomUUID().toString().substring(0, 8);
        
        // 构建快照目录和文件
        Path modelSnapshotDir = snapshotRoot.resolve(modelId);
        if (!Files.exists(modelSnapshotDir)) {
            Files.createDirectories(modelSnapshotDir);
        }
        
        // 快照元数据
        Map<String, Object> snapshotMeta = new HashMap<>();
        snapshotMeta.put("id", snapshotId);
        snapshotMeta.put("modelId", modelId);
        snapshotMeta.put("branchId", branchId);
        snapshotMeta.put("versionTag", versionTag);
        snapshotMeta.put("createdAt", LocalDateTime.now().toString());
        snapshotMeta.put("snapshot", snapshot);
        
        // 保存到文件
        Path snapshotFile = modelSnapshotDir.resolve(snapshotId + ".json");
        String json = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(snapshotMeta);
        Files.writeString(snapshotFile, json);
        
        // 同时更新索引文件
        updateSnapshotIndex(modelId, snapshotId, versionTag, LocalDateTime.now().toString());
        
        log.info("[仓储] 保存快照: modelId={}, snapshotId={}, tag={}", modelId, snapshotId, versionTag);
        return snapshotId;
    }

    @Override
    public List<Map<String, Object>> findSnapshots(String modelId) {
        List<Map<String, Object>> snapshots = new ArrayList<>();
        
        Path modelSnapshotDir = snapshotRoot.resolve(modelId);
        if (!Files.exists(modelSnapshotDir)) {
            return snapshots;
        }
        
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(modelSnapshotDir, "*.json")) {
            for (Path file : stream) {
                try {
                    String json = Files.readString(file);
                    Map<String, Object> meta = objectMapper.readValue(json, new TypeReference<>() {});
                    
                    // 返回简化版（不含完整快照内容）
                    Map<String, Object> summary = new HashMap<>();
                    summary.put("id", meta.get("id"));
                    summary.put("modelId", meta.get("modelId"));
                    summary.put("versionTag", meta.get("versionTag"));
                    summary.put("createdAt", meta.get("createdAt"));
                    snapshots.add(summary);
                } catch (Exception e) {
                    log.warn("[仓储] 读取快照文件失败: {}", file, e);
                }
            }
        } catch (Exception e) {
            log.error("[仓储] 读取快照列表失败: modelId={}", modelId, e);
        }
        
        // 按创建时间倒序
        snapshots.sort((a, b) -> 
            String.valueOf(b.get("createdAt")).compareTo(String.valueOf(a.get("createdAt")))
        );
        
        return snapshots;
    }

    @Override
    public Optional<String> findSnapshot(String snapshotId) {
        // 遍历所有模型的快照目录查找（简化实现）
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(snapshotRoot, "*")) {
            for (Path modelDir : stream) {
                if (!Files.isDirectory(modelDir)) continue;
                
                Path snapshotFile = modelDir.resolve(snapshotId + ".json");
                if (Files.exists(snapshotFile)) {
                    String json = Files.readString(snapshotFile);
                    Map<String, Object> meta = objectMapper.readValue(json, new TypeReference<>() {});
                    return Optional.ofNullable((String) meta.get("snapshot"));
                }
            }
        } catch (Exception e) {
            log.error("[仓储] 查找快照失败: snapshotId={}", snapshotId, e);
        }
        
        return Optional.empty();
    }

    /**
     * 更新快照索引文件
     */
    @SneakyThrows
    private void updateSnapshotIndex(String modelId, String snapshotId, String versionTag, String createdAt) {
        Path indexFile = snapshotRoot.resolve(modelId + "-index.json");
        
        List<Map<String, Object>> index;
        if (Files.exists(indexFile)) {
            String json = Files.readString(indexFile);
            index = objectMapper.readValue(json, new TypeReference<>() {});
        } else {
            index = new ArrayList<>();
        }
        
        Map<String, Object> entry = new HashMap<>();
        entry.put("id", snapshotId);
        entry.put("versionTag", versionTag);
        entry.put("createdAt", createdAt);
        index.add(entry);
        
        Files.writeString(indexFile, objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(index));
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
