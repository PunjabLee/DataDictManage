package com.datadictmanage.modeling.infrastructure.persistence.team;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * TeamMemberPO — 团队成员持久化对象
 */
@Data
@TableName("t_team_member")
public class TeamMemberPO {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String teamId;
    private String userId;
    private String role;
    private String status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime joinedAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
