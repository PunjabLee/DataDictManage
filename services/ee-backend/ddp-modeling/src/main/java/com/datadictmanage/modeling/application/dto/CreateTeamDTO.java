package com.datadictmanage.modeling.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 创建团队 DTO
 */
@Data
public class CreateTeamDTO {

    @NotBlank(message = "团队名称不能为空")
    private String name;

    private String description;

    private String ownerId;

    private String ownerName;
}
