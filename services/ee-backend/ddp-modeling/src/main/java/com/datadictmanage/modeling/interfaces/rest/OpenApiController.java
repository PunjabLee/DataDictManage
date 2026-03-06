package com.datadictmanage.modeling.interfaces.rest;

import com.datadictmanage.common.result.R;
import com.datadictmanage.modeling.application.service.OpenApiFacade;
import com.datadictmanage.modeling.domain.openapi.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

/**
 * OpenApiController — API 开放平台 REST 接口
 */
@Slf4j
@Tag(name = "API 开放平台", description = "API 定义、开发者应用、调用管理")
@RestController
@RequestMapping("/modeling/openapi")
@RequiredArgsConstructor
public class OpenApiController {

    private final OpenApiFacade openApiFacade;

    // ==================== API 定义 ====================

    @Operation(summary = "创建 API 定义")
    @PostMapping("/apis")
    public R<ApiDefinitionBO> createApi(
            @RequestBody ApiDefinitionBO api,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        api.setCreatedBy(operatorId);
        return R.ok(openApiFacade.createApi(api));
    }

    @Operation(summary = "发布 API")
    @PostMapping("/apis/{id}/publish")
    public R<ApiDefinitionBO> publishApi(@PathVariable String id) {
        return R.ok(openApiFacade.publishApi(id));
    }

    @Operation(summary = "获取 API 列表")
    @GetMapping("/apis")
    public R<List<ApiDefinitionBO>> listApis(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status
    ) {
        return R.ok(openApiFacade.listApis(category, status));
    }

    @Operation(summary = "获取 API 详情")
    @GetMapping("/apis/{id}")
    public R<ApiDefinitionBO> getApi(@PathVariable String id) {
        return R.ok(openApiFacade.getApi(id));
    }

    // ==================== 开发者应用 ====================

    @Operation(summary = "创建开发者应用")
    @PostMapping("/apps")
    public R<ApiAppBO> createApp(
            @RequestBody ApiAppBO app,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId
    ) {
        return R.ok(openApiFacade.createApp(app, userId, userId));
    }

    @Operation(summary = "获取应用列表")
    @GetMapping("/apps")
    public R<List<ApiAppBO>> listApps(
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId
    ) {
        return R.ok(openApiFacade.listApps(userId));
    }

    @Operation(summary = "获取应用详情")
    @GetMapping("/apps/{id}")
    public R<ApiAppBO> getApp(@PathVariable String id) {
        return R.ok(openApiFacade.getApp(id));
    }

    @Operation(summary = "禁用应用")
    @PostMapping("/apps/{id}/disable")
    public R<Void> disableApp(@PathVariable String id) {
        openApiFacade.disableApp(id);
        return R.ok();
    }

    // ==================== 调用统计 ====================

    @Operation(summary = "获取调用统计")
    @GetMapping("/statistics")
    public R<ApiCallLogBO> getStatistics(
            @RequestParam String appId,
            @RequestParam(required = false) String apiId,
            @RequestParam(required = false) Date date
    ) {
        return R.ok(openApiFacade.getStatistics(appId, apiId, date));
    }
}
