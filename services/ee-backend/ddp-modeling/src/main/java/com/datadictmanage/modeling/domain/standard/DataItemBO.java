package com.datadictmanage.modeling.domain.standard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * DataItemBO — 数据项标准 业务对象
 * 适配现有数据库表 t_data_item_standard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DataItemBO {

    private String id;
    private String teamId;           // 所属团队ID
    private String chineseName;      // 中文名称
    private String englishAbbr;      // 英文缩写
    private String baseType;         // 基本数据类型
    private Integer length;          // 长度
    private Integer precisionVal;    // 精度
    private Integer scaleVal;        // 小数位数
    private Boolean nullable;        // 是否可空
    private String businessDesc;     // 业务描述
    private String codeValueGroup;   // 关联代码值组ID
    private Integer status;          // 状态
    private String createdBy;
    private Date createdAt;
    private Date updatedAt;

    // 兼容字段映射
    public String getCode() { return englishAbbr; }
    public String getName() { return chineseName; }
    public String getDataType() { 
        if (baseType == null) return null;
        if (length != null && length > 0) {
            if ("DECIMAL".equalsIgnoreCase(baseType) && scaleVal != null) {
                return baseType + "(" + length + "," + scaleVal + ")";
            }
            return baseType + "(" + length + ")";
        }
        return baseType;
    }
}
