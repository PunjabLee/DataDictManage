package com.datadictmanage.modeling.infrastructure.persistence.po;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DataItemPO — 数据项标准持久化对象
 * 对应数据库表 t_data_item_standard
 */
@Data
@TableName("t_data_item_standard")
public class DataItemPO {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /** 所属团队ID */
    private String teamId;

    /** 中文名称 */
    private String chineseName;

    /** 英文缩写 */
    private String englishAbbr;

    /** 基本数据类型 */
    private String baseType;

    /** 长度 */
    private Integer length;

    /** 精度 */
    private Integer precisionVal;

    /** 小数位数 */
    private Integer scaleVal;

    /** 是否可空 */
    private Boolean nullable;

    /** 业务描述 */
    private String businessDesc;

    /** 关联代码值组ID */
    private String codeValueGroup;

    /** 状态 */
    private Integer status;

    /** 创建人 */
    private String createdBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
