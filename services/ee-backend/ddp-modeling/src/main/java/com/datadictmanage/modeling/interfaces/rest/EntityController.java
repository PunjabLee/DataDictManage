package com.datadictmanage.modeling.interfaces.rest;

import com.datadictmanage.common.result.R;
import com.datadictmanage.modeling.application.service.ModelingFacade;
import com.datadictmanage.modeling.interfaces.vo.ModelVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * EntityController — 实体 REST 接口
 */
@Slf4j
@Tag(name = "实体管理", description = "数据表 CRUD")
@RestController
@RequestMapping("/modeling")
@RequiredArgsConstructor
public class EntityController {

    private final ModelingFacade modelingFacade;

    @Operation(summary = "添加数据表")
    @PostMapping("/models/{modelId}/entities")
    public R<ModelVO> addEntity(
            @PathVariable String modelId,
            @RequestParam String name,
            @RequestParam(required = false) String comment,
            @RequestParam(required = false, defaultValue = "PHYSICAL") String layer,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(modelingFacade.addEntity(modelId, name, comment, operatorId));
    }

    @Operation(summary = "更新数据表")
    @PutMapping("/models/{modelId}/entities/{entityId}")
    public R<ModelVO> updateEntity(
            @PathVariable String modelId,
            @PathVariable String entityId,
            @RequestParam String name,
            @RequestParam(required = false) String comment,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(modelingFacade.updateEntity(modelId, entityId, name, comment, operatorId));
    }

    @Operation(summary = "删除数据表")
    @DeleteMapping("/models/{modelId}/entities/{entityId}")
    public R<Void> deleteEntity(
            @PathVariable String modelId,
            @PathVariable String entityId,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        modelingFacade.deleteEntity(modelId, entityId, operatorId);
        return R.ok();
    }

    @Operation(summary = "调整实体顺序")
    @PutMapping("/models/{modelId}/entities/{entityId}/reorder")
    public R<ModelVO> reorderEntity(
            @PathVariable String modelId,
            @PathVariable String entityId,
            @RequestParam Integer newOrder,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(modelingFacade.reorderEntity(modelId, entityId, newOrder, operatorId));
    }
}
