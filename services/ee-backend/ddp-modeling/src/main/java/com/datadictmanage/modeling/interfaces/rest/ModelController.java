package com.datadictmanage.modeling.interfaces.rest;

import com.datadictmanage.common.result.R;
import com.datadictmanage.modeling.application.dto.CreateModelDTO;
import com.datadictmanage.modeling.application.dto.AddFieldDTO;
import com.datadictmanage.modeling.application.dto.UpdateFieldDTO;
import com.datadictmanage.modeling.application.dto.RelationDTO;
import com.datadictmanage.modeling.application.dto.CreateSnapshotDTO;
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

    // ── 字段管理 ─────────────────────────────────────────────────────────

    /**
     * 向实体添加字段
     *
     * POST /modeling/models/{modelId}/entities/{entityId}/fields
     */
    @Operation(summary = "添加字段")
    @PostMapping("/{modelId}/entities/{entityId}/fields")
    public R<ModelVO> addField(
            @PathVariable String modelId,
            @PathVariable String entityId,
            @Valid @RequestBody AddFieldDTO dto,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(modelingFacade.addField(modelId, entityId, dto, operatorId));
    }

    /**
     * 更新字段
     *
     * PUT /modeling/models/{modelId}/entities/{entityId}/fields/{fieldId}
     */
    @Operation(summary = "更新字段")
    @PutMapping("/{modelId}/entities/{entityId}/fields/{fieldId}")
    public R<ModelVO> updateField(
            @PathVariable String modelId,
            @PathVariable String entityId,
            @PathVariable String fieldId,
            @Valid @RequestBody UpdateFieldDTO dto,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(modelingFacade.updateField(modelId, entityId, fieldId, dto, operatorId));
    }

    /**
     * 删除字段
     *
     * DELETE /modeling/models/{modelId}/entities/{entityId}/fields/{fieldId}
     */
    @Operation(summary = "删除字段")
    @DeleteMapping("/{modelId}/entities/{entityId}/fields/{fieldId}")
    public R<Void> deleteField(
            @PathVariable String modelId,
            @PathVariable String entityId,
            @PathVariable String fieldId,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        modelingFacade.deleteField(modelId, entityId, fieldId, operatorId);
        return R.ok();
    }

    // ── 关系管理 ─────────────────────────────────────────────────────────

    /**
     * 添加实体间关系
     *
     * POST /modeling/models/{modelId}/relations
     */
    @Operation(summary = "添加关系")
    @PostMapping("/{modelId}/relations")
    public R<ModelVO> addRelation(
            @PathVariable String modelId,
            @Valid @RequestBody RelationDTO dto,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(modelingFacade.addRelation(modelId, dto, operatorId));
    }

    /**
     * 删除关系
     *
     * DELETE /modeling/models/{modelId}/relations/{relationId}
     */
    @Operation(summary = "删除关系")
    @DeleteMapping("/{modelId}/relations/{relationId}")
    public R<Void> deleteRelation(
            @PathVariable String modelId,
            @PathVariable String relationId,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        modelingFacade.deleteRelation(modelId, relationId, operatorId);
        return R.ok();
    }

    // ── 版本管理 ─────────────────────────────────────────────────────────

    /**
     * 创建快照
     *
     * POST /modeling/models/{modelId}/snapshots
     */
    @Operation(summary = "创建快照")
    @PostMapping("/{modelId}/snapshots")
    public R<String> createSnapshot(
            @PathVariable String modelId,
            @Valid @RequestBody CreateSnapshotDTO dto,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(modelingFacade.createSnapshot(modelId, dto.getVersionTag(), dto.getDescription(), operatorId));
    }

    /**
     * 获取快照列表
     *
     * GET /modeling/models/{modelId}/snapshots
     */
    @Operation(summary = "获取快照列表")
    @GetMapping("/{modelId}/snapshots")
    public R<List<java.util.Map<String, Object>>> listSnapshots(
            @PathVariable String modelId
    ) {
        return R.ok(modelingFacade.listSnapshots(modelId));
    }

    /**
     * 回滚到指定快照
     *
     * POST /modeling/models/{modelId}/snapshots/{snapshotId}/restore
     */
    @Operation(summary = "回滚快照")
    @PostMapping("/{modelId}/snapshots/{snapshotId}/restore")
    public R<ModelVO> restoreSnapshot(
            @PathVariable String modelId,
            @PathVariable String snapshotId,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(modelingFacade.restoreSnapshot(modelId, snapshotId, operatorId));
    }

    // ── 文档导出 ─────────────────────────────────────────────────────────

    /**
     * 导出为 Word 文档
     *
     * GET /modeling/models/{modelId}/export/word
     */
    @Operation(summary = "导出 Word 文档")
    @GetMapping("/{modelId}/export/word")
    public R<byte[]> exportWord(@PathVariable String modelId) {
        return R.ok(modelingFacade.exportToWord(modelId));
    }

    /**
     * 导出为 Excel 文档
     *
     * GET /modeling/models/{modelId}/export/excel
     */
    @Operation(summary = "导出 Excel 文档")
    @GetMapping("/{modelId}/export/excel")
    public R<byte[]> exportExcel(@PathVariable String modelId) {
        return R.ok(modelingFacade.exportToExcel(modelId));
    }

    /**
     * 导出为 HTML 文档
     *
     * GET /modeling/models/{modelId}/export/html
     */
    @Operation(summary = "导出 HTML 文档")
    @GetMapping("/{modelId}/export/html")
    public R<byte[]> exportHtml(@PathVariable String modelId) {
        return R.ok(modelingFacade.exportToHtml(modelId));
    }

    /**
     * 导出为 Markdown 文档
     *
     * GET /modeling/models/{modelId}/export/markdown
     */
    @Operation(summary = "导出 Markdown 文档")
    @GetMapping("/{modelId}/export/markdown")
    public R<byte[]> exportMarkdown(@PathVariable String modelId) {
        return R.ok(modelingFacade.exportToMarkdown(modelId));
    }
}
