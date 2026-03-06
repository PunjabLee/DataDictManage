package com.datadictmanage.modeling.domain.openapi;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * ApiKeyBO — API 密钥 业务对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiKeyBO {

    private String id;
    private String appId;         // 应用ID
    private String appKey;       // API Key
    private String appSecret;    // API Secret
    private String status;       // ACTIVE / DISABLED / EXPIRED
    private Date expireTime;     // 过期时间
    private Date createdAt;
    private Date updatedAt;

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_DISABLED = "DISABLED";
    public static final String STATUS_EXPIRED = "EXPIRED";
}
