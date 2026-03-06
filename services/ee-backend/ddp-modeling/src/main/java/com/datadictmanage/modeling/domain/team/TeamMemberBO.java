package com.datadictmanage.modeling.domain.team;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * TeamMemberBO — 团队成员 业务对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberBO {

    private String id;
    private String teamId;
    private String userId;
    private String userName;
    private String userEmail;
    private String role;      // OWNER / ADMIN / MEMBER / VIEWER
    private String status;    // ACTIVE / INVITED / DISABLED
    private Date joinedAt;
    private Date createdAt;

    // 角色常量
    public static final String ROLE_OWNER = "OWNER";
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_MEMBER = "MEMBER";
    public static final String ROLE_VIEWER = "VIEWER";
}
