package com.datadictmanage.auth.controller;

import com.datadictmanage.auth.dto.LoginDTO;
import com.datadictmanage.auth.dto.TokenVO;
import com.datadictmanage.auth.service.AuthService;
import com.datadictmanage.common.result.R;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * AuthController — 认证接口（接入层）
 * @layer Interface Layer
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 用户登录
     * POST /auth/login
     */
    @PostMapping("/login")
    public R<TokenVO> login(@Valid @RequestBody LoginDTO dto) {
        return R.ok(authService.login(dto));
    }

    /**
     * 刷新 Token
     * POST /auth/refresh
     */
    @PostMapping("/refresh")
    public R<TokenVO> refresh(@RequestHeader("X-Refresh-Token") String refreshToken) {
        return R.ok(authService.refreshToken(refreshToken));
    }

    /**
     * 登出（让 Token 失效，需配合 Redis 黑名单实现）
     * POST /auth/logout
     */
    @PostMapping("/logout")
    public R<Void> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        // Phase 1 骨架：生产版本将 Token 加入 Redis 黑名单
        return R.ok();
    }
}
