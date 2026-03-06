package com.datadictmanage.modeling.domain.team;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

/**
 * TeamBO — 团队 业务对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamBO {

    private String id;
    private String name;          // 团队名称
    private String description;   // 团队描述
    private String ownerId;       // 所有者ID
    private String ownerName;     // 所有者名称
    private Integer status;      // 状态: 1-正常 0-禁用
    private String createdBy;
    private Date createdAt;
    private Date updatedAt;

    // 成员列表（非持久化）
    private List<TeamMemberBO> members;
}
