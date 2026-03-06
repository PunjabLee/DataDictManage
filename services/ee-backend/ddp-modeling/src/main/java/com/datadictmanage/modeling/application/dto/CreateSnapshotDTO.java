package com.datadictmanage.modeling.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * CreateSnapshotDTO — 创建快照命令
 *
 * @layer Application Layer — DTO
 */
@Data
public class CreateSnapshotDTO {

    /** 版本标签 */
    @NotBlank(message = "版本标签不能为空")
    private String versionTag;

    /** 版本描述 */
    private String description;
}
