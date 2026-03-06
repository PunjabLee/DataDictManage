package com.datadictmanage.modeling.interfaces.rest;

import com.datadictmanage.common.result.R;
import com.datadictmanage.modeling.application.dto.*;
import com.datadictmanage.modeling.application.service.DataStandardFacade;
import com.datadictmanage.modeling.domain.standard.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * DataItemController — 数据项标准 REST 接口
 */
@Slf4j
@Tag(name = "数据项标准", description = "数据项标准 CRUD、发布、废弃")
@RestController
@RequestMapping("/modeling/data-items")
@RequiredArgsConstructor
public class DataItemController {

    private final DataStandardFacade dataStandardFacade;

    @Operation(summary = "创建数据项标准")
    @PostMapping
    public R<DataItemBO> create(
            @Valid @RequestBody CreateDataItemDTO dto,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(dataStandardFacade.createDataItem(dto, operatorId));
    }

    @Operation(summary = "更新数据项标准")
    @PutMapping("/{id}")
    public R<DataItemBO> update(
            @PathVariable String id,
            @Valid @RequestBody UpdateDataItemDTO dto,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(dataStandardFacade.updateDataItem(id, dto, operatorId));
    }

    @Operation(summary = "发布数据项标准")
    @PostMapping("/{id}/publish")
    public R<DataItemBO> publish(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(dataStandardFacade.publishDataItem(id, operatorId));
    }

    @Operation(summary = "废弃数据项标准")
    @PostMapping("/{id}/deprecate")
    public R<DataItemBO> deprecate(
            @PathVariable String id,
            @RequestParam String reason,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(dataStandardFacade.deprecateDataItem(id, reason, operatorId));
    }

    @Operation(summary = "获取数据项详情")
    @GetMapping("/{id}")
    public R<DataItemBO> get(@PathVariable String id) {
        return R.ok(dataStandardFacade.getDataItem(id));
    }

    @Operation(summary = "根据编码获取数据项")
    @GetMapping("/code/{code}")
    public R<DataItemBO> getByCode(@PathVariable String code) {
        return R.ok(dataStandardFacade.getDataItemByCode(code));
    }

    @Operation(summary = "获取分类下的所有数据项")
    @GetMapping("/category/{categoryId}")
    public R<List<DataItemBO>> listByCategory(@PathVariable String categoryId) {
        return R.ok(dataStandardFacade.listDataItemsByCategory(categoryId));
    }

    @Operation(summary = "获取所有已发布的数据项")
    @GetMapping("/published")
    public R<List<DataItemBO>> listPublished(
            @RequestParam(required = false) String keyword
    ) {
        return R.ok(dataStandardFacade.listPublishedDataItems(keyword));
    }

    @Operation(summary = "获取所有数据项")
    @GetMapping
    public R<List<DataItemBO>> listAll() {
        return R.ok(dataStandardFacade.listAllDataItems());
    }

    @Operation(summary = "删除数据项")
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable String id) {
        dataStandardFacade.deleteDataItem(id);
        return R.ok();
    }
}
