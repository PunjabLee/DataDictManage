package com.datadictmanage.auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

/**
 * JwtService — JWT Token 生成与解析服务
 *
 * 使用 JJWT 库实现 JWT 的签发和校验。
 * 支持 Access Token（短期）和 Refresh Token（长期）。
 *
 * @layer Infrastructure Layer (技术服务)
 */
@Slf4j
@Service
public class JwtService {

    @Value("${jwt.secret:ddm-ee-super-secret-key-change-in-production}")
    private String secret;

    @Value("${jwt.expiration:86400}")
    private long expirationSeconds;

    /** Refresh Token 有效期（7天） */
    private static final long REFRESH_EXPIRATION = 7 * 24 * 3600;

    /**
     * 生成 Access Token
     *
     * @param userId   用户 ID
     * @param username 用户名
     * @return JWT 字符串
     */
    public String generateToken(String userId, String username) {
        return buildToken(userId, Map.of("username", username), expirationSeconds * 1000L);
    }

    /**
     * 生成 Refresh Token
     *
     * @param userId 用户 ID
     * @return JWT 字符串
     */
    public String generateRefreshToken(String userId) {
        return buildToken(userId, Map.of("type", "refresh"), REFRESH_EXPIRATION * 1000L);
    }

    /**
     * 解析 Token 中的用户 ID
     *
     * @param token JWT 字符串
     * @return 用户 ID，解析失败返回 null
     */
    public String parseUserId(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return claims.getSubject();
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("[JWT] Token 解析失败: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 校验 Token 是否有效
     */
    public boolean isValid(String token) {
        return parseUserId(token) != null;
    }

    private String buildToken(String subject, Map<String, Object> claims, long expirationMs) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(subject)
                .claims(claims)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
