package com.datadictmanage.modeling.interfaces.vo;

import lombok.Data;

/**
 * DataItemVO — 数据项视图对象
 */
@Data
public class DataItemVO {

    private String id;
    private String name;
    private String code;
    private String baseType;
    private Integer length;
    private String description;
    private Integer status;
    private String createdAt;
    private String updatedAt;
}
