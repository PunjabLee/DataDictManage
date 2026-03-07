package com.datadictmanage.auth.controller;

import com.datadictmanage.auth.dto.LoginDTO;
import com.datadictmanage.auth.dto.TokenVO;
import com.datadictmanage.auth.service.AuthService;
import com.datadictmanage.common.result.R;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * AuthController — 认证接口控制器
 *
 * 职责：
 *   提供用户认证相关的 REST API，包括登录、Token 刷新、登出等。
 *   负责请求参数校验、响应格式封装。
 *
 * API 列表：
 *   - POST /auth/login     用户登录
 *   - POST /auth/refresh   刷新 Access Token
 *   - POST /auth/logout    登出（使 Token 失效）
 *
 * @layer Interface Layer — controller
 * @author DDM Team
 * @since 1.0.0
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 用户登录
     * 
     * 验证用户凭据，签发 JWT Token
     *
     * @param dto 登录请求参数（username, password）
     * @return Token 信息（accessToken, refreshToken, expiresAt）
     * @see LoginDTO
     * @see TokenVO
     */
    @PostMapping("/login")
    public R<TokenVO> login(@Valid @RequestBody LoginDTO dto) {
        return R.ok(authService.login(dto));
    }

    /**
     * 刷新 Access Token
     * 
     * 使用 Refresh Token 签发新的 Access Token
     *
     * @param refreshToken 刷新 Token（Header: X-Refresh-Token）
     * @return 新的 Token 信息
     */
    @PostMapping("/refresh")
    public R<TokenVO> refresh(@RequestHeader("X-Refresh-Token") String refreshToken) {
        return R.ok(authService.refreshToken(refreshToken));
    }

    /**
     * 用户登出
     * 
     * 使当前 Access Token 失效（生产环境需配合 Redis 黑名单）
     *
     * @param authHeader 授权头（Bearer Token）
     * @return 操作结果
     */
    @PostMapping("/logout")
    public R<Void> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        // Phase 1 骨架：生产版本将 Token 加入 Redis 黑名单
        return R.ok();
    }
}
