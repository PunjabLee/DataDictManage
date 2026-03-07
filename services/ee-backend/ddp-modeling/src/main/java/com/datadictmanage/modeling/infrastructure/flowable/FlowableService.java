package com.datadictmanage.modeling.infrastructure.flowable;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.RepositoryService;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;
import org.flowable.engine.repository.Deployment;
import org.flowable.engine.repository.ProcessDefinition;
import org.flowable.engine.runtime.ProcessInstance;
import org.flowable.task.api.Task;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Flowable 流程引擎服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FlowableService {

    private final RepositoryService repositoryService;
    private final RuntimeService runtimeService;
    private final TaskService taskService;

    /**
     * 部署流程定义
     */
    public String deployProcess(String processKey, String processName, String bpmnXml) {
        Deployment deployment = repositoryService.createDeployment()
                .name(processName)
                .key(processKey)
                .addString(processKey + ".bpmn20.xml", bpmnXml)
                .deploy();
        
        log.info("[Flowable] 部署流程: key={}, name={}, deploymentId={}", processKey, processName, deployment.getId());
        return deployment.getId();
    }

    /**
     * 获取流程定义
     */
    public ProcessDefinition getProcessDefinition(String processDefinitionId) {
        return repositoryService.createProcessDefinitionQuery()
                .processDefinitionId(processDefinitionId)
                .singleResult();
    }

    /**
     * 发起流程实例
     */
    public String startProcess(String processDefinitionKey, String businessKey, Map<String, Object> variables) {
        ProcessInstance instance = runtimeService.startProcessInstanceByKey(
                processDefinitionKey,
                businessKey,
                variables
        );
        
        log.info("[Flowable] 发起流程: key={}, businessKey={}, processInstanceId={}", 
                processDefinitionKey, businessKey, instance.getId());
        return instance.getId();
    }

    /**
     * 获取用户待办任务
     */
    public List<Map<String, Object>> getTodoTasks(String assignee) {
        List<Task> tasks = taskService.createTaskQuery()
                .taskAssignee(assignee)
                .orderByTaskCreateTime().desc()
                .list();

        return tasks.stream().map(this::taskToMap).toList();
    }

    /**
     * 完成任务
     */
    public void completeTask(String taskId, Map<String, Object> variables) {
        taskService.complete(taskId, variables);
        log.info("[Flowable] 完成任务: taskId={}", taskId);
    }

    /**
     * 审批通过
     */
    public void approve(String taskId, String comment) {
        if (comment != null) {
            taskService.addComment(taskId, null, comment);
        }
        taskService.complete(taskId, Map.of("approved", true));
        log.info("[Flowable] 审批通过: taskId={}", taskId);
    }

    /**
     * 审批拒绝
     */
    public void reject(String taskId, String comment) {
        if (comment != null) {
            taskService.addComment(taskId, null, comment);
        }
        taskService.complete(taskId, Map.of("approved", false));
        
        // 终止流程
        Task task = taskService.createTaskQuery().taskId(taskId).singleResult();
        if (task != null) {
            runtimeService.deleteProcessInstance(task.getProcessInstanceId(), "审批拒绝");
        }
        log.info("[Flowable] 审批拒绝: taskId={}", taskId);
    }

    /**
     * 获取流程状态
     */
    public String getProcessStatus(String processInstanceId) {
        ProcessInstance instance = runtimeService.createProcessInstanceQuery()
                .processInstanceId(processInstanceId)
                .singleResult();
        return instance != null ? "ACTIVE" : "COMPLETED";
    }

    private Map<String, Object> taskToMap(Task task) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", task.getId());
        map.put("name", task.getName());
        map.put("description", task.getDescription());
        map.put("assignee", task.getAssignee());
        map.put("createTime", task.getCreateTime());
        map.put("dueDate", task.getDueDate());
        map.put("priority", task.getPriority());
        map.put("processInstanceId", task.getProcessInstanceId());
        map.put("taskDefinitionKey", task.getTaskDefinitionKey());
        return map;
    }
}
