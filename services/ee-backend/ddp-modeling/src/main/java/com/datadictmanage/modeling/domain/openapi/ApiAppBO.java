package com.datadictmanage.modeling.domain.openapi;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * ApiAppBO — 开发者应用 业务对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiAppBO {

    private String id;
    private String name;          // 应用名称
    private String description;   // 应用描述
    private String ownerId;       // 所有者ID
    private String ownerName;     // 所有者名称
    private String status;        // ACTIVE / DISABLED
    private String appKey;       // App Key
    private String appSecret;    // App Secret
    private Integer dailyLimit;   // 日调用限额
    private Integer monthlyLimit; // 月调用限额
    private Date createdAt;
    private Date updatedAt;

    // 状态
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_DISABLED = "DISABLED";
}
