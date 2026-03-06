package com.datadictmanage.modeling.application.dto;

import lombok.Data;

/**
 * 更新数据项标准 DTO
 */
@Data
public class UpdateDataItemDTO {

    private String chineseName;
    private String englishAbbr;
    private String baseType;
    private Integer length;
    private Integer precisionVal;
    private Integer scaleVal;
    private Boolean nullable;
    private String businessDesc;
    private String codeValueGroup;
}
