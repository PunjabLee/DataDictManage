package com.datadictmanage.modeling.domain.openapi;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ApiParamBO — API 参数 业务对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiParamBO {

    private String name;        // 参数名称
    private String type;        // 参数类型: string / number / integer / boolean / object / array
    private String location;    // 参数位置: path / query / header / body
    private Boolean required;  // 是否必填
    private String description; // 描述
    private String example;    // 示例值
    private String defaultValue; // 默认值
}
