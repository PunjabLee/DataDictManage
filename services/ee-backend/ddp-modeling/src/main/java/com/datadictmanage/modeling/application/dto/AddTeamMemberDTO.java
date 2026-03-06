package com.datadictmanage.modeling.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 添加团队成员 DTO
 */
@Data
public class AddTeamMemberDTO {

    @NotBlank(message = "团队ID不能为空")
    private String teamId;

    @NotBlank(message = "用户ID不能为空")
    private String userId;

    private String userName;

    private String userEmail;

    @NotBlank(message = "角色不能为空")
    private String role; // OWNER / ADMIN / MEMBER / VIEWER
}
