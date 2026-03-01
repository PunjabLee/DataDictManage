package com.datadictmanage.modeling.interfaces.rest;

import com.datadictmanage.common.result.R;
import com.datadictmanage.modeling.application.dto.CreateModelDTO;
import com.datadictmanage.modeling.application.service.ModelingFacade;
import com.datadictmanage.modeling.interfaces.vo.ModelVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ModelController — 模型 REST 接口（接入层）
 *
 * 职责：
 *   仅负责：
 *   1. 接收 HTTP 请求，解析参数
 *   2. 提取认证信息（operatorId）
 *   3. 调用应用层门面（ModelingFacade）
 *   4. 将结果包装为统一响应 R<T>
 *
 * 禁止事项（DDD 分层约束）：
 *   ❌ Controller 中不包含任何业务逻辑
 *   ❌ Controller 不直接操作 ModelBO/Entity
 *   ❌ Controller 不直接调用 Repository
 *
 * @layer Interface Layer (接入层) — interfaces/rest
 */
@Slf4j
@Tag(name = "模型管理", description = "数据模型 CRUD、DDL 生成、Diff 对比")
@RestController
@RequestMapping("/modeling/models")
@RequiredArgsConstructor
public class ModelController {

    private final ModelingFacade modelingFacade;

    /**
     * 创建数据模型
     *
     * POST /modeling/models
     * Body: { "name": "用户中心", "projectId": "xxx", "description": "..." }
     */
    @Operation(summary = "创建数据模型")
    @PostMapping
    public R<ModelVO> createModel(
            @Valid @RequestBody CreateModelDTO dto,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        ModelVO result = modelingFacade.createModel(dto, operatorId);
        return R.ok(result);
    }

    /**
     * 查询项目下所有模型（列表，不含字段详情）
     *
     * GET /modeling/models?projectId=xxx
     */
    @Operation(summary = "查询项目下的模型列表")
    @GetMapping
    public R<List<ModelVO>> listModels(
            @RequestParam String projectId
    ) {
        return R.ok(modelingFacade.listModelsByProject(projectId));
    }

    /**
     * 查询模型详情（含完整 Entity/Field 数据）
     *
     * GET /modeling/models/{modelId}
     */
    @Operation(summary = "查询模型详情")
    @GetMapping("/{modelId}")
    public R<ModelVO> getModel(@PathVariable String modelId) {
        return R.ok(modelingFacade.getModelDetail(modelId));
    }

    /**
     * 删除模型
     *
     * DELETE /modeling/models/{modelId}
     */
    @Operation(summary = "删除模型")
    @DeleteMapping("/{modelId}")
    public R<Void> deleteModel(
            @PathVariable String modelId,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        modelingFacade.deleteModel(modelId, operatorId);
        return R.ok();
    }

    /**
     * 向模型添加数据表
     *
     * POST /modeling/models/{modelId}/entities
     */
    @Operation(summary = "添加数据表")
    @PostMapping("/{modelId}/entities")
    public R<ModelVO> addEntity(
            @PathVariable String modelId,
            @RequestParam String name,
            @RequestParam(required = false, defaultValue = "") String comment,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(modelingFacade.addEntity(modelId, name, comment, operatorId));
    }

    /**
     * 生成建表 DDL SQL
     *
     * GET /modeling/models/{modelId}/ddl?dbType=MYSQL
     */
    @Operation(summary = "生成 DDL SQL")
    @GetMapping("/{modelId}/ddl")
    public R<String> generateDDL(
            @PathVariable String modelId,
            @RequestParam(defaultValue = "MYSQL") String dbType
    ) {
        return R.ok(modelingFacade.generateDDL(modelId, dbType));
    }
}
