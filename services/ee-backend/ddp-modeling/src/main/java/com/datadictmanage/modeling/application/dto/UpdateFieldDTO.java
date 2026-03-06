package com.datadictmanage.modeling.application.dto;

import lombok.Data;

/**
 * UpdateFieldDTO — 更新字段命令
 *
 * @layer Application Layer — DTO
 */
@Data
public class UpdateFieldDTO {

    /** 字段名称 */
    private String name;

    /** 字段注释 */
    private String comment;

    /** 字段类型 */
    private String baseType;

    /** 字符串长度 */
    private Integer length;

    /** 数字精度 */
    private Integer precision;

    /** 数字小数位 */
    private Integer scale;

    /** 是否可为空 */
    private Boolean nullable;

    /** 是否唯一 */
    private Boolean unique;

    /** 默认值 */
    private String defaultValue;
}
