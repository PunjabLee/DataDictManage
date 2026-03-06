package com.datadictmanage.modeling.interfaces.rest;

import com.datadictmanage.common.result.R;
import com.datadictmanage.modeling.application.service.WorkflowFacade;
import com.datadictmanage.modeling.domain.workflow.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * WorkflowController — 工作流审批 REST 接口
 * 集成 Flowable 流程引擎
 */
@Slf4j
@Tag(name = "工作流审批", description = "流程定义、审批任务")
@RestController
@RequestMapping("/modeling/workflow")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowFacade workflowFacade;

    // ==================== 流程定义 ====================

    @Operation(summary = "创建流程定义")
    @PostMapping("/definitions")
    public R<WorkflowDefinitionBO> createDefinition(
            @RequestBody WorkflowDefinitionBO definition,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        definition.setCreatedBy(operatorId);
        return R.ok(workflowFacade.createDefinition(definition));
    }

    @Operation(summary = "发布流程定义")
    @PostMapping("/definitions/{id}/publish")
    public R<WorkflowDefinitionBO> publishDefinition(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(workflowFacade.publishDefinition(id));
    }

    @Operation(summary = "获取流程定义列表")
    @GetMapping("/definitions")
    public R<List<WorkflowDefinitionBO>> listDefinitions(
            @RequestParam(required = false) String category
    ) {
        return R.ok(workflowFacade.listDefinitions(category));
    }

    // ==================== 流程实例 ====================

    @Operation(summary = "发起审批流程")
    @PostMapping("/instances")
    public R<WorkflowInstanceBO> startProcess(
            @RequestBody WorkflowInstanceBO instance,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        instance.setApplicantId(operatorId);
        return R.ok(workflowFacade.startProcess(instance));
    }

    @Operation(summary = "获取我的申请列表")
    @GetMapping("/instances/my")
    public R<List<WorkflowInstanceBO>> getMyApplications(
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId
    ) {
        return R.ok(workflowFacade.getMyApplications(userId));
    }

    @Operation(summary = "获取流程实例详情")
    @GetMapping("/instances/{id}")
    public R<WorkflowInstanceBO> getInstance(@PathVariable String id) {
        return R.ok(workflowFacade.getInstance(id));
    }

    @Operation(summary = "撤回申请")
    @PostMapping("/instances/{id}/withdraw")
    public R<Void> withdrawProcess(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId
    ) {
        workflowFacade.withdrawProcess(id, userId);
        return R.ok();
    }

    // ==================== 审批任务 ====================

    @Operation(summary = "获取待办任务列表")
    @GetMapping("/tasks/todo")
    public R<List<WorkflowTaskBO>> getTodoTasks(
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId
    ) {
        return R.ok(workflowFacade.getTodoTasks(userId));
    }

    @Operation(summary = "获取已办任务列表")
    @GetMapping("/tasks/done")
    public R<List<WorkflowTaskBO>> getDoneTasks(
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId
    ) {
        return R.ok(workflowFacade.getDoneTasks(userId));
    }

    @Operation(summary = "签收任务")
    @PostMapping("/tasks/{taskId}/claim")
    public R<WorkflowTaskBO> claimTask(
            @PathVariable String taskId,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId
    ) {
        return R.ok(workflowFacade.claimTask(taskId, userId));
    }

    @Operation(summary = "审批通过")
    @PostMapping("/tasks/{taskId}/approve")
    public R<WorkflowTaskBO> approveTask(
            @PathVariable String taskId,
            @RequestParam String comment,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId
    ) {
        return R.ok(workflowFacade.approveTask(taskId, userId, comment));
    }

    @Operation(summary = "审批拒绝")
    @PostMapping("/tasks/{taskId}/reject")
    public R<WorkflowTaskBO> rejectTask(
            @PathVariable String taskId,
            @RequestParam String comment,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId
    ) {
        return R.ok(workflowFacade.rejectTask(taskId, userId, comment));
    }

    @Operation(summary = "转交任务")
    @PostMapping("/tasks/{taskId}/transfer")
    public R<Void> transferTask(
            @PathVariable String taskId,
            @RequestParam String toUserId,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String fromUserId
    ) {
        workflowFacade.transferTask(taskId, fromUserId, toUserId);
        return R.ok();
    }

    @Operation(summary = "获取任务详情")
    @GetMapping("/tasks/{taskId}")
    public R<WorkflowTaskBO> getTask(@PathVariable String taskId) {
        return R.ok(workflowFacade.getTask(taskId));
    }

    @Operation(summary = "获取流程实例的任务列表")
    @GetMapping("/instances/{instanceId}/tasks")
    public R<List<WorkflowTaskBO>> getInstanceTasks(@PathVariable String instanceId) {
        return R.ok(workflowFacade.getInstanceTasks(instanceId));
    }
}
