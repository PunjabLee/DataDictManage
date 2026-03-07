package com.datadictmanage.modeling.interfaces.vo;

import lombok.Data;

/**
 * ProjectVO — 项目视图对象
 */
@Data
public class ProjectVO {

    private String id;
    private String teamId;
    private String teamName;
    private String name;
    private String code;
    private String description;
    private Integer modelCount;
    private Integer memberCount;
    private Integer status;
    private String createdBy;
    private String createdAt;
    private String updatedAt;
}
