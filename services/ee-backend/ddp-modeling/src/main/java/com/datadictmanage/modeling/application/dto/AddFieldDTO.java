package com.datadictmanage.modeling.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * AddFieldDTO — 添加字段命令
 *
 * @layer Application Layer — DTO
 */
@Data
public class AddFieldDTO {

    /** 字段名称 */
    @NotBlank(message = "字段名称不能为空")
    private String name;

    /** 字段注释 */
    private String comment;

    /** 字段类型（STRING/INT/BIGINT/DECIMAL/DATETIME/TEXT 等） */
    @NotBlank(message = "字段类型不能为空")
    private String baseType;

    /** 字符串长度 */
    private Integer length;

    /** 数字精度 */
    private Integer precision;

    /** 数字小数位 */
    private Integer scale;

    /** 是否可为空 */
    private Boolean nullable = true;

    /** 是否主键 */
    private Boolean primaryKey = false;

    /** 是否唯一 */
    private Boolean unique = false;

    /** 是否自增 */
    private Boolean autoIncrement = false;

    /** 默认值 */
    private String defaultValue;

    /** 排序 */
    private Integer sortOrder;
}
