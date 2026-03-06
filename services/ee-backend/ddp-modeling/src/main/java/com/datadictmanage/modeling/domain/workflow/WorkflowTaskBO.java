package com.datadictmanage.modeling.domain.workflow;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * WorkflowTaskBO — 审批任务 业务对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowTaskBO {

    private String id;
    private String taskId;            // Flowable 任务ID
    private String instanceId;         // 工作流实例ID
    private String processInstanceId;  // Flowable 流程实例ID
    private String taskName;          // 任务名称
    private String taskDefinitionKey; // 任务定义Key
    private String assigneeId;        // 处理人ID
    private String assigneeName;       // 处理人名称
    private String candidateUsers;     // 候选用户 (逗号分隔)
    private String status;             // PENDING / COMPLETED / DELEGATED / TRANSFERRED
    private Date claimTime;           // 签收时间
    private Date completeTime;        // 完成时间
    private String comment;            // 审批意见
    private Date createdAt;

    // 状态常量
    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_COMPLETED = "COMPLETED";
    public static final String STATUS_DELEGATED = "DELEGATED";
    public static final String STATUS_TRANSFERRED = "TRANSFERRED";
}
