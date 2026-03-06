package com.datadictmanage.modeling.domain.team;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * ProjectBO — 项目 业务对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectBO {

    private String id;
    private String teamId;
    private String name;        // 项目名称
    private String description; // 项目描述
    private String icon;       // 项目图标
    private Integer status;    // 状态: 1-正常 0-禁用
    private String createdBy;
    private Date createdAt;
    private Date updatedAt;
}
