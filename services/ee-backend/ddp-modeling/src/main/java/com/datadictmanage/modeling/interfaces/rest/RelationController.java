package com.datadictmanage.modeling.interfaces.rest;

import com.datadictmanage.common.result.R;
import com.datadictmanage.modeling.application.dto.RelationDTO;
import com.datadictmanage.modeling.application.service.ModelingFacade;
import com.datadictmanage.modeling.interfaces.vo.ModelVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * RelationController — 关系 REST 接口
 */
@Slf4j
@Tag(name = "关系管理", description = "表关系 CRUD")
@RestController
@RequestMapping("/modeling")
@RequiredArgsConstructor
public class RelationController {

    private final ModelingFacade modelingFacade;

    @Operation(summary = "添加关系")
    @PostMapping("/models/{modelId}/relations")
    public R<ModelVO> addRelation(
            @PathVariable String modelId,
            @Valid @RequestBody RelationDTO dto,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(modelingFacade.addRelation(modelId, dto, operatorId));
    }

    @Operation(summary = "更新关系")
    @PutMapping("/models/{modelId}/relations/{relationId}")
    public R<ModelVO> updateRelation(
            @PathVariable String modelId,
            @PathVariable String relationId,
            @Valid @RequestBody RelationDTO dto,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(modelingFacade.updateRelation(modelId, relationId, dto, operatorId));
    }

    @Operation(summary = "删除关系")
    @DeleteMapping("/models/{modelId}/relations/{relationId}")
    public R<Void> deleteRelation(
            @PathVariable String modelId,
            @PathVariable String relationId,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        modelingFacade.deleteRelation(modelId, relationId, operatorId);
        return R.ok();
    }

    @Operation(summary = "自动检测关系")
    @PostMapping("/models/{modelId}/relations/detect")
    public R<ModelVO> detectRelations(
            @PathVariable String modelId,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(modelingFacade.detectRelations(modelId, operatorId));
    }
}
