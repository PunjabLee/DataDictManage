package com.datadictmanage.modeling.domain.workflow;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * WorkflowInstanceBO — 工作流实例 业务对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowInstanceBO {

    private String id;
    private String processInstanceId;  // Flowable 流程实例ID
    private String definitionId;       // 流程定义ID
    private String definitionName;     // 流程名称
    private String businessType;       // 业务类型: MODEL / STANDARD / RELEASE
    private String businessId;         // 业务数据ID
    private String businessTitle;      // 业务标题
    private String applicantId;        // 申请人
    private String applicantName;      // 申请人名称
    private String status;             // RUNNING / COMPLETED / CANCELLED / REJECTED
    private String currentNode;        // 当前节点
    private Date startTime;            // 开始时间
    private Date endTime;              // 结束时间
    private String result;             // 审批结果: APPROVED / REJECTED
    private String createdBy;
    private Date createdAt;
    private Date updatedAt;

    // 状态常量
    public static final String STATUS_RUNNING = "RUNNING";
    public static final String STATUS_COMPLETED = "COMPLETED";
    public static final String STATUS_CANCELLED = "CANCELLED";
    public static final String STATUS_REJECTED = "REJECTED";

    // 结果常量
    public static final String RESULT_APPROVED = "APPROVED";
    public static final String RESULT_REJECTED = "REJECTED";
}
