package com.datadictmanage.modeling.interfaces.rest;

import com.datadictmanage.common.result.R;
import com.datadictmanage.modeling.application.dto.CreateCodeValueGroupDTO;
import com.datadictmanage.modeling.application.service.DataStandardFacade;
import com.datadictmanage.modeling.domain.standard.CodeValueGroupBO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * CodeValueGroupController — 代码值组 REST 接口
 */
@Slf4j
@Tag(name = "代码值组", description = "代码值组（枚举字典）CRUD、发布、废弃")
@RestController
@RequestMapping("/modeling/code-value-groups")
@RequiredArgsConstructor
public class CodeValueGroupController {

    private final DataStandardFacade dataStandardFacade;

    @Operation(summary = "创建代码值组")
    @PostMapping
    public R<CodeValueGroupBO> create(
            @Valid @RequestBody CreateCodeValueGroupDTO dto,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(dataStandardFacade.createCodeValueGroup(dto, operatorId));
    }

    @Operation(summary = "发布代码值组")
    @PostMapping("/{id}/publish")
    public R<CodeValueGroupBO> publish(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(dataStandardFacade.publishCodeValueGroup(id, operatorId));
    }

    @Operation(summary = "废弃代码值组")
    @PostMapping("/{id}/deprecate")
    public R<CodeValueGroupBO> deprecate(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(dataStandardFacade.deprecateCodeValueGroup(id, operatorId));
    }

    @Operation(summary = "获取代码值组详情")
    @GetMapping("/{id}")
    public R<CodeValueGroupBO> get(@PathVariable String id) {
        return R.ok(dataStandardFacade.getCodeValueGroup(id));
    }

    @Operation(summary = "获取所有已发布的代码值组")
    @GetMapping("/published")
    public R<List<CodeValueGroupBO>> listPublished() {
        return R.ok(dataStandardFacade.listPublishedCodeValueGroups());
    }

    @Operation(summary = "获取所有代码值组")
    @GetMapping
    public R<List<CodeValueGroupBO>> listAll() {
        return R.ok(dataStandardFacade.listAllCodeValueGroups());
    }

    @Operation(summary = "删除代码值组")
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable String id) {
        dataStandardFacade.deleteCodeValueGroup(id);
        return R.ok();
    }
}
