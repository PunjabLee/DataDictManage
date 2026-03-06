package com.datadictmanage.auth.dto;

import lombok.Builder;
import lombok.Data;

/**
 * TokenVO — Token 响应体
 * @layer Interface Layer (接入层视图)
 */
@Data
@Builder
public class TokenVO {

    /** JWT Access Token */
    private String accessToken;

    /** Refresh Token（用于刷新 Access Token） */
    private String refreshToken;

    /** Access Token 过期时间（Unix 时间戳，秒） */
    private long expiresAt;

    /** Token 类型（固定为 "Bearer"） */
    @Builder.Default
    private String tokenType = "Bearer";

    /** 用户 ID */
    private String userId;

    /** 用户名 */
    private String username;

    /** 用户显示名称 */
    private String displayName;
}
