package com.datadictmanage.modeling.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * RelationDTO — 关系命令
 *
 * @layer Application Layer — DTO
 */
@Data
public class RelationDTO {

    /** 源实体 ID */
    @NotBlank(message = "源实体 ID 不能为空")
    private String fromEntityId;

    /** 目标实体 ID */
    @NotBlank(message = "目标实体 ID 不能为空")
    private String toEntityId;

    /** 关系类型（ONE_TO_ONE/ONE_TO_MANY/MANY_TO_MANY） */
    @NotBlank(message = "关系类型不能为空")
    private String type;

    /** 关系说明 */
    private String comment;

    /** 外键字段名（可选） */
    private String foreignKeyName;
}
