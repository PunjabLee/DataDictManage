package com.datadictmanage.modeling.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.util.List;

/**
 * 代码值条目 DTO
 */
@Data
public class CodeValueItemDTO {
    private String value;
    private String label;
    private String labelEn;
    private Integer sortOrder;
    private String remark;
}

/**
 * 创建代码值组 DTO
 */
@Data
public class CreateCodeValueGroupDTO {

    @NotBlank(message = "字典编码不能为空")
    @Pattern(regexp = "^[A-Z][A-Z0-9_]*$", message = "编码必须为大写字母、数字、下划线，且以字母开头")
    private String code;

    @NotBlank(message = "字典名称不能为空")
    private String name;

    private String description;

    @NotBlank(message = "分类ID不能为空")
    private String categoryId;

    private List<CodeValueItemDTO> items;
}
