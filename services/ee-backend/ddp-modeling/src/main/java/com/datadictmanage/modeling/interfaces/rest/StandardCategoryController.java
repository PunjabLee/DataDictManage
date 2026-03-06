package com.datadictmanage.modeling.interfaces.rest;

import com.datadictmanage.common.result.R;
import com.datadictmanage.modeling.application.dto.CreateStandardCategoryDTO;
import com.datadictmanage.modeling.application.service.DataStandardFacade;
import com.datadictmanage.modeling.domain.standard.StandardCategoryBO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * StandardCategoryController — 数据标准分类 REST 接口
 */
@Slf4j
@Tag(name = "数据标准分类", description = "数据标准分类 CRUD")
@RestController
@RequestMapping("/modeling/standard-categories")
@RequiredArgsConstructor
public class StandardCategoryController {

    private final DataStandardFacade dataStandardFacade;

    @Operation(summary = "创建分类")
    @PostMapping
    public R<StandardCategoryBO> create(
            @Valid @RequestBody CreateStandardCategoryDTO dto,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(dataStandardFacade.createCategory(dto, operatorId));
    }

    @Operation(summary = "获取分类详情")
    @GetMapping("/{id}")
    public R<StandardCategoryBO> get(@PathVariable String id) {
        return R.ok(dataStandardFacade.getCategory(id));
    }

    @Operation(summary = "获取子分类列表")
    @GetMapping("/children")
    public R<List<StandardCategoryBO>> listChildren(
            @RequestParam(required = false) String parentId
    ) {
        return R.ok(dataStandardFacade.listChildCategories(parentId));
    }

    @Operation(summary = "获取所有分类")
    @GetMapping
    public R<List<StandardCategoryBO>> listAll() {
        return R.ok(dataStandardFacade.listAllCategories());
    }

    @Operation(summary = "删除分类")
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable String id) {
        dataStandardFacade.deleteCategory(id);
        return R.ok();
    }
}
