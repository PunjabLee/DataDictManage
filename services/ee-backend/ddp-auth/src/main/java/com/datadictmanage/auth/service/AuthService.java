package com.datadictmanage.auth.service;

import com.datadictmanage.auth.dto.LoginDTO;
import com.datadictmanage.auth.dto.TokenVO;
import com.datadictmanage.common.exception.BizException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * AuthService — 认证服务
 *
 * 职责：
 *   处理用户登录、Token 刷新、登出等认证流程。
 *   Phase 1 骨架实现（密码校验部分需对接用户数据库）。
 *
 * @layer Application Layer
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtService jwtService;

    /**
     * 用户登录
     *
     * @param dto 登录参数
     * @return JWT Token 对
     */
    public TokenVO login(LoginDTO dto) {
        // Phase 1 骨架：简单账号密码校验（生产版本接入数据库 + BCrypt）
        if (!"admin".equals(dto.getUsername()) || !"admin123".equals(dto.getPassword())) {
            throw BizException.invalidParam("用户名或密码错误");
        }

        String userId = "user-admin-001";
        String accessToken = jwtService.generateToken(userId, dto.getUsername());
        String refreshToken = jwtService.generateRefreshToken(userId);
        long expiresAt = Instant.now().getEpochSecond() + 86400;

        log.info("[认证] 用户 {} 登录成功", dto.getUsername());

        return TokenVO.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresAt(expiresAt)
                .userId(userId)
                .username(dto.getUsername())
                .displayName("系统管理员")
                .build();
    }

    /**
     * 刷新 Token
     */
    public TokenVO refreshToken(String refreshToken) {
        String userId = jwtService.parseUserId(refreshToken);
        if (userId == null) {
            throw BizException.invalidParam("Refresh Token 无效或已过期");
        }
        String newAccessToken = jwtService.generateToken(userId, "admin");
        return TokenVO.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .expiresAt(Instant.now().getEpochSecond() + 86400)
                .userId(userId)
                .build();
    }
}
