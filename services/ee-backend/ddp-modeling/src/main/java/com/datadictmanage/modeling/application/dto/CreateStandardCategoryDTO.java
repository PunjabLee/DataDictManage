package com.datadictmanage.modeling.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 创建数据标准分类 DTO
 */
@Data
public class CreateStandardCategoryDTO {

    @NotBlank(message = "分类名称不能为空")
    private String name;

    private String parentId;

    private Integer sortOrder;

    private String description;
}
