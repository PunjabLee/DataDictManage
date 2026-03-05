package com.datadictmanage.modeling.application.service;

import com.datadictmanage.modeling.application.assembler.ModelAssembler;
import com.datadictmanage.modeling.application.dto.CreateModelDTO;
import com.datadictmanage.modeling.application.dto.AddFieldDTO;
import com.datadictmanage.modeling.application.dto.UpdateFieldDTO;
import com.datadictmanage.modeling.application.dto.RelationDTO;
import com.datadictmanage.modeling.domain.event.ModelCreatedEvent;
import com.datadictmanage.modeling.domain.model.ModelBO;
import com.datadictmanage.modeling.domain.model.EntityBO;
import com.datadictmanage.modeling.domain.model.FieldBO;
import com.datadictmanage.modeling.domain.repository.ModelRepository;
import com.datadictmanage.modeling.domain.service.ModelDomainService;
import com.datadictmanage.modeling.infrastructure.acl.SqlDialectPort;
import com.datadictmanage.modeling.infrastructure.acl.SqlDialectPort.FieldMeta;
import com.datadictmanage.modeling.interfaces.vo.ModelVO;
import com.datadictmanage.common.exception.BizException;
import com.datadictmanage.common.util.PageUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * ModelingFacade — 建模应用服务（门面）
 *
 * 职责：
 *   应用服务是接入层（REST Controller）与领域层之间的协调者。
 *
 *   职责清单：
 *   1. 接收 DTO 入参，转换为领域命令
 *   2. 调用仓储获取领域对象（ModelBO）
 *   3. 调用领域服务（ModelDomainService）执行业务逻辑
 *   4. 持久化聚合根
 *   5. 发布领域事件（ApplicationEventPublisher）
 *   6. 将领域对象转换为 VO 返回
 *
 * 禁止事项（DDD 分层约束）：
 *   ❌ 不包含任何业务规则（规则在领域层）
 *   ❌ 不直接使用 PO/Mapper（通过仓储接口）
 *
 * @layer Application Layer — application/service
 * @pattern GoF: Facade（统一建模操作入口）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ModelingFacade {

    private final ModelRepository modelRepository;
    private final ModelDomainService modelDomainService;
    private final ModelAssembler modelAssembler;
    private final ApplicationEventPublisher eventPublisher;
    private final SqlDialectPort sqlDialectPort;
    private final ObjectMapper objectMapper;

    // ── 模型 CRUD ─────────────────────────────────────────────────────────

    /**
     * 创建新数据模型
     *
     * @param dto        创建参数
     * @param operatorId 操作人（从 SecurityContext 获取）
     * @return 创建成功的模型视图
     */
    @Transactional(rollbackFor = Exception.class)
    public ModelVO createModel(CreateModelDTO dto, String operatorId) {
        log.info("[应用层] 创建模型: name={}, project={}, operator={}", dto.getName(), dto.getProjectId(), operatorId);

        // 1. 委托领域服务执行业务规则
        ModelBO model = modelDomainService.createModel(dto.getName(), dto.getProjectId(), operatorId);
        model.setDescription(dto.getDescription() != null ? dto.getDescription() : "");

        // 2. 持久化
        modelRepository.save(model);

        // 3. 发布领域事件（GoF: Observer，触发搜索索引更新、审计日志等）
        eventPublisher.publishEvent(new ModelCreatedEvent(
            this, model.getId(), model.getProjectId(), model.getName(), operatorId
        ));

        log.info("[应用层] 模型创建成功: id={}", model.getId());
        return modelAssembler.toVO(model);
    }

    /**
     * 查询项目下的所有模型
     *
     * @param projectId 项目 ID
     * @return 模型列表视图（不含字段详情）
     */
    @Transactional(readOnly = true)
    public List<ModelVO> listModelsByProject(String projectId) {
        return modelRepository.findByProjectId(projectId)
                .stream()
                .map(modelAssembler::toListVO)
                .collect(Collectors.toList());
    }

    /**
     * 查询模型详情（含完整 Entity/Field 数据）
     *
     * @param modelId 模型 ID
     * @return 模型详情视图
     */
    @Transactional(readOnly = true)
    public ModelVO getModelDetail(String modelId) {
        ModelBO model = modelRepository.findById(modelId)
                .orElseThrow(() -> BizException.notFound("模型", modelId));
        return modelAssembler.toVO(model);
    }

    /**
     * 删除模型
     *
     * @param modelId    模型 ID
     * @param operatorId 操作人
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteModel(String modelId, String operatorId) {
        if (!modelRepository.existsById(modelId)) {
            throw BizException.notFound("模型", modelId);
        }
        modelRepository.deleteById(modelId);
        log.info("[应用层] 模型 {} 已删除，操作人: {}", modelId, operatorId);
    }

    /**
     * 向模型添加数据表
     *
     * @param modelId    模型 ID
     * @param entityName 表名
     * @param comment    表注释
     * @param operatorId 操作人
     * @return 更新后的模型详情
     */
    @Transactional(rollbackFor = Exception.class)
    public ModelVO addEntity(String modelId, String entityName, String comment, String operatorId) {
        ModelBO model = modelRepository.findById(modelId)
                .orElseThrow(() -> BizException.notFound("模型", modelId));

        // 委托领域服务执行（含业务规则校验）
        modelDomainService.addEntity(model, entityName, comment, "PHYSICAL");

        modelRepository.save(model);
        return modelAssembler.toVO(model);
    }

    /**
     * 生成建表 DDL
     * 委托给 SqlDialectPort（防腐层）实现
     *
     * @param modelId 模型 ID
     * @param dbType  数据库类型（MYSQL/POSTGRESQL/ORACLE/DAMENG/KINGBASE）
     * @return DDL SQL 字符串
     */
    @Transactional(readOnly = true)
    public String generateDDL(String modelId, String dbType) {
        ModelBO model = modelRepository.findById(modelId)
                .orElseThrow(() -> BizException.notFound("模型", modelId));

        if (model.getEntities() == null || model.getEntities().isEmpty()) {
            return "-- 模型为空，无表结构";
        }

        // 检查是否支持该数据库类型
        if (!sqlDialectPort.supportsDbType(dbType)) {
            throw new BizException("不支持的数据库类型: " + dbType + 
                "，支持的类型: " + String.join(", ", sqlDialectPort.getSupportedDbTypes()));
        }

        // 为每个实体生成 DDL
        StringBuilder ddl = new StringBuilder();
        ddl.append("-- =====================================================\n");
        ddl.append("-- DDL Generated by DataDictManage\n");
        ddl.append("-- Model: ").append(model.getName()).append("\n");
        ddl.append("-- DB Type: ").append(dbType).append("\n");
        ddl.append("-- Generated at: ").append(java.time.LocalDateTime.now()).append("\n");
        ddl.append("-- =====================================================\n\n");

        for (EntityBO entity : model.getEntities()) {
            // 转换 FieldBO 为 FieldMeta
            List<FieldMeta> fieldMetas = entity.getFields().stream()
                .map(this::toFieldMeta)
                .toList();

            String entityDDL = sqlDialectPort.generateCreateTable(
                entity.getName(),
                entity.getComment(),
                fieldMetas,
                dbType
            );
            ddl.append(entityDDL).append("\n");
        }

        log.info("[应用层] 生成 DDL: model={}, dbType={}, entities={}", modelId, dbType, model.getEntities().size());
        return ddl.toString();
    }

    /**
     * FieldBO → FieldMeta 转换
     */
    private FieldMeta toFieldMeta(FieldBO field) {
        return new FieldMeta(
            field.getName(),
            field.getComment() != null ? field.getComment() : "",
            field.getBaseType() != null ? field.getBaseType() : "VARCHAR",
            field.getLength(),
            field.getPrecision(),
            field.getScale(),
            field.isNullable(),
            field.isPrimaryKey(),
            field.isUnique(),
            field.isAutoIncrement(),
            field.getDefaultValue()
        );
    }

    // ── 字段管理 ─────────────────────────────────────────────────────────

    /**
     * 向实体添加字段
     *
     * @param modelId    模型 ID
     * @param entityId   实体 ID
     * @param dto        字段数据
     * @param operatorId 操作人
     * @return 更新后的模型详情
     */
    @Transactional(rollbackFor = Exception.class)
    public ModelVO addField(String modelId, String entityId, AddFieldDTO dto, String operatorId) {
        ModelBO model = modelRepository.findById(modelId)
                .orElseThrow(() -> BizException.notFound("模型", modelId));

        modelDomainService.addField(model, entityId, dto, operatorId);
        modelRepository.save(model);

        log.info("[应用层] 添加字段: model={}, entity={}, field={}", modelId, entityId, dto.getName());
        return modelAssembler.toVO(model);
    }

    /**
     * 更新字段
     *
     * @param modelId    模型 ID
     * @param entityId   实体 ID
     * @param fieldId    字段 ID
     * @param dto        更新数据
     * @param operatorId 操作人
     * @return 更新后的模型详情
     */
    @Transactional(rollbackFor = Exception.class)
    public ModelVO updateField(String modelId, String entityId, String fieldId, UpdateFieldDTO dto, String operatorId) {
        ModelBO model = modelRepository.findById(modelId)
                .orElseThrow(() -> BizException.notFound("模型", modelId));

        modelDomainService.updateField(model, entityId, fieldId, dto, operatorId);
        modelRepository.save(model);

        log.info("[应用层] 更新字段: model={}, entity={}, field={}", modelId, entityId, fieldId);
        return modelAssembler.toVO(model);
    }

    /**
     * 删除字段
     *
     * @param modelId    模型 ID
     * @param entityId   实体 ID
     * @param fieldId    字段 ID
     * @param operatorId 操作人
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteField(String modelId, String entityId, String fieldId, String operatorId) {
        ModelBO model = modelRepository.findById(modelId)
                .orElseThrow(() -> BizException.notFound("模型", modelId));

        modelDomainService.deleteField(model, entityId, fieldId, operatorId);
        modelRepository.save(model);

        log.info("[应用层] 删除字段: model={}, entity={}, field={}", modelId, entityId, fieldId);
    }

    // ── 关系管理 ─────────────────────────────────────────────────────────

    /**
     * 添加实体间关系
     *
     * @param modelId    模型 ID
     * @param dto        关系数据
     * @param operatorId 操作人
     * @return 更新后的模型详情
     */
    @Transactional(rollbackFor = Exception.class)
    public ModelVO addRelation(String modelId, RelationDTO dto, String operatorId) {
        ModelBO model = modelRepository.findById(modelId)
                .orElseThrow(() -> BizException.notFound("模型", modelId));

        modelDomainService.addRelation(model, dto, operatorId);
        modelRepository.save(model);

        log.info("[应用层] 添加关系: model={}, from={}, to={}", modelId, dto.getFromEntityId(), dto.getToEntityId());
        return modelAssembler.toVO(model);
    }

    /**
     * 删除关系
     *
     * @param modelId    模型 ID
     * @param relationId 关系 ID
     * @param operatorId 操作人
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteRelation(String modelId, String relationId, String operatorId) {
        ModelBO model = modelRepository.findById(modelId)
                .orElseThrow(() -> BizException.notFound("模型", modelId));

        modelDomainService.deleteRelation(model, relationId, operatorId);
        modelRepository.save(model);

        log.info("[应用层] 删除关系: model={}, relation={}", modelId, relationId);
    }

    // ── 版本管理 ─────────────────────────────────────────────────────────

    /**
     * 创建快照
     *
     * @param modelId     模型 ID
     * @param versionTag  版本标签
     * @param description 版本描述
     * @param operatorId  操作人
     * @return 快照 ID
     */
    @Transactional(rollbackFor = Exception.class)
    public String createSnapshot(String modelId, String versionTag, String description, String operatorId) {
        ModelBO model = modelRepository.findById(modelId)
                .orElseThrow(() -> BizException.notFound("模型", modelId));

        // 构建快照数据（序列化为 JSON 字符串存储）
        java.util.Map<String, Object> snapshotData = new java.util.HashMap<>();
        snapshotData.put("modelId", model.getId());
        snapshotData.put("name", model.getName());
        snapshotData.put("description", model.getDescription());
        snapshotData.put("entities", model.getEntities());
        snapshotData.put("relations", model.getRelations());
        snapshotData.put("versionTag", versionTag);
        snapshotData.put("description", description);
        snapshotData.put("createdBy", operatorId);
        snapshotData.put("createdAt", java.time.LocalDateTime.now());

        // 序列化为 JSON 字符串
        String snapshotJson;
        try {
            snapshotJson = objectMapper.writeValueAsString(snapshotData);
        } catch (Exception e) {
            throw new BizException("快照序列化失败: " + e.getMessage());
        }

        String snapshotId = modelRepository.saveSnapshot(modelId, model.getCurrentBranchId(), snapshotJson, versionTag);
        log.info("[应用层] 创建快照: model={}, snapshot={}, tag={}", modelId, snapshotId, versionTag);
        return snapshotId;
    }

    /**
     * 获取快照列表
     *
     * @param modelId 模型 ID
     * @return 快照列表
     */
    @Transactional(readOnly = true)
    public java.util.List<java.util.Map<String, Object>> listSnapshots(String modelId) {
        return modelRepository.findSnapshots(modelId);
    }

    /**
     * 回滚到指定快照
     *
     * @param modelId     模型 ID
     * @param snapshotId  快照 ID
     * @param operatorId  操作人
     * @return 回滚后的模型详情
     */
    @Transactional(rollbackFor = Exception.class)
    public ModelVO restoreSnapshot(String modelId, String snapshotId, String operatorId) {
        ModelBO model = modelRepository.findById(modelId)
                .orElseThrow(() -> BizException.notFound("模型", modelId));

        // 从快照存储中获取完整快照数据
        String snapshotJson = modelRepository.findSnapshot(snapshotId)
                .orElseThrow(() -> BizException.notFound("快照", snapshotId));

        // 反序列化为 ModelBO
        try {
            java.util.Map<String, Object> snapshotData = objectMapper.readValue(
                snapshotJson, 
                new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {}
            );

            // 从快照恢复数据
            model.setDescription((String) snapshotData.getOrDefault("description", ""));
            
            // 恢复 entities（需要反序列化）
            Object entitiesObj = snapshotData.get("entities");
            if (entitiesObj != null) {
                String entitiesJson = objectMapper.writeValueAsString(entitiesObj);
                List<EntityBO> entities = objectMapper.readValue(
                    entitiesJson,
                    new com.fasterxml.jackson.core.type.TypeReference<List<EntityBO>>() {}
                );
                model.setEntities(entities);
            }

            // 保存恢复后的模型
            modelRepository.save(model);
            
            log.info("[应用层] 回滚快照成功: model={}, snapshot={}, operator={}", modelId, snapshotId, operatorId);
        } catch (Exception e) {
            throw new BizException("恢复快照失败: " + e.getMessage());
        }

        return modelAssembler.toVO(model);
    }
}
