package com.datadictmanage.modeling.domain.workflow;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * WorkflowDefinitionBO — 工作流定义 业务对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowDefinitionBO {

    private String id;
    private String key;           // 流程定义Key
    private String name;          // 流程名称
    private String description;   // 流程描述
    private String category;      // 流程分类
    private String bpmnXml;       // BPMN 2.0 XML
    private Integer version;      // 版本号
    private String status;        // DRAFT / PUBLISHED / DEPRECATED
    private String createdBy;
    private Date createdAt;
    private Date updatedAt;

    // 流程分类常量
    public static final String CATEGORY_MODEL_APPROVAL = "MODEL_APPROVAL";
    public static final String CATEGORY_STANDARD_APPROVAL = "STANDARD_APPROVAL";
    public static final String CATEGORY_RELEASE = "RELEASE";
}
