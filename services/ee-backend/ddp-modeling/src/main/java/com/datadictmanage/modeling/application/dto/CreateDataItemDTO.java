package com.datadictmanage.modeling.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 创建数据项标准 DTO
 */
@Data
public class CreateDataItemDTO {

    @NotBlank(message = "团队ID不能为空")
    private String teamId;

    @NotBlank(message = "中文名称不能为空")
    private String chineseName;

    @NotBlank(message = "英文缩写不能为空")
    private String englishAbbr;

    @NotBlank(message = "基本数据类型不能为空")
    private String baseType;

    private Integer length;
    private Integer precisionVal;
    private Integer scaleVal;
    private Boolean nullable = true;
    private String businessDesc;
    private String codeValueGroup;
}
