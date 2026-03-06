package com.datadictmanage.modeling.domain.standard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * StandardCategoryBO — 数据标准分类 业务对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StandardCategoryBO {

    private String id;
    private String name;        // 分类名称
    private String parentId;    // 父分类 ID（顶级为 null）
    private Integer sortOrder;  // 排序
    private String description; // 描述
    private String createdBy;
    private Date createdAt;
    private Date updatedAt;
}
