package com.datadictmanage.modeling.application.service;

import com.datadictmanage.modeling.application.assembler.ModelAssembler;
import com.datadictmanage.modeling.application.dto.CreateModelDTO;
import com.datadictmanage.modeling.domain.event.ModelCreatedEvent;
import com.datadictmanage.modeling.domain.model.ModelBO;
import com.datadictmanage.modeling.domain.repository.ModelRepository;
import com.datadictmanage.modeling.domain.service.ModelDomainService;
import com.datadictmanage.modeling.interfaces.vo.ModelVO;
import com.datadictmanage.common.exception.BizException;
import com.datadictmanage.common.util.PageUtils;
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

        // TODO: 通过 SqlDialectPort（防腐层）调用 DDL 生成逻辑
        // 此处为骨架实现，实际对接 @ddm/db-dialect 或通过 ACL 适配
        log.info("[应用层] 生成 DDL: model={}, dbType={}", modelId, dbType);
        return "-- DDL 生成功能由 SqlDialectPort（防腐层）实现\n-- 模型: " + model.getName();
    }
}
