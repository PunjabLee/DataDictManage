package com.datadictmanage.modeling.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 创建项目 DTO
 */
@Data
public class CreateProjectDTO {

    @NotBlank(message = "团队ID不能为空")
    private String teamId;

    @NotBlank(message = "项目名称不能为空")
    private String name;

    private String description;

    private String icon;
}
