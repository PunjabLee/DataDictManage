package com.datadictmanage.modeling.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * CreateModelDTO — 创建模型的入参 DTO
 *
 * 职责：
 *   接收前端（或其他服务）发送的创建模型请求数据。
 *   包含 @Validated 注解支持的参数校验。
 *   不含任何业务逻辑（业务规则在领域层）。
 *
 * DTO 设计原则：
 *   - 只有 primitive 类型字段（String/int/boolean）
 *   - 包含参数校验注解
 *   - 不依赖领域对象
 *
 * @layer Application Layer — application/dto
 */
@Data
public class CreateModelDTO {

    /** 模型名称（必填，最长 128 字符） */
    @NotBlank(message = "模型名称不能为空")
    @Size(max = 128, message = "模型名称不能超过 128 个字符")
    private String name;

    /** 所属项目 ID（必填） */
    @NotBlank(message = "项目 ID 不能为空")
    private String projectId;

    /** 模型描述（可选） */
    @Size(max = 1000, message = "描述不能超过 1000 个字符")
    private String description;
}
