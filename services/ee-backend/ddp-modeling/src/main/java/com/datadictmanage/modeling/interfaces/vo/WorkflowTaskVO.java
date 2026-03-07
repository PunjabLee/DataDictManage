package com.datadictmanage.modeling.interfaces.vo;

import lombok.Data;

/**
 * WorkflowTaskVO — 工作流任务视图对象
 */
@Data
public class WorkflowTaskVO {

    private String id;
    private String processInstanceId;
    private String taskId;
    private String taskName;
    private String taskDefinitionKey;
    private String assignee;
    private String candidateUsers;
    private Integer priority;  // 1: 低, 2: 普通, 3: 高
    private String dueDate;
    private String createTime;
    private String completeTime;
    private Integer status;  // 0: 待处理, 1: 已完成, 2: 已拒绝
    private String businessKey;
    private String businessType;
    private String businessTitle;
}
