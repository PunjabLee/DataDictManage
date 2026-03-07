package com.datadictmanage.modeling.interfaces.vo;

import lombok.Data;

import java.util.List;

/**
 * WorkflowDefinitionVO — 工作流定义视图对象
 */
@Data
public class WorkflowDefinitionVO {

    private String id;
    private String name;
    private String category;
    private String description;
    private String processKey;
    private Integer version;
    private Integer status;  // 0: 草稿, 1: 已发布, 2: 已暂停
    private String createdBy;
    private String createdAt;
    private String updatedAt;

    /**
     * 流程节点配置
     */
    private List<NodeConfigVO> nodes;

    @Data
    public static class NodeConfigVO {
        private String id;
        private String name;
        private String type;  // start, end, userTask, gateway
        private String assigneeType;  // user, group, expression
        private String assigneeValue;
        private List<String> candidateUsers;
        private List<String> candidateGroups;
    }
}
