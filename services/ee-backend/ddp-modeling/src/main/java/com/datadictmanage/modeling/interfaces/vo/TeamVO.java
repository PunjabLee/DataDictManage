package com.datadictmanage.modeling.interfaces.vo;

import lombok.Data;

/**
 * TeamVO — 团队视图对象
 */
@Data
public class TeamVO {

    private String id;
    private String name;
    private String code;
    private String description;
    private String ownerId;
    private String ownerName;
    private Integer memberCount;
    private Integer projectCount;
    private Integer status;
    private String createdAt;
    private String updatedAt;
}
