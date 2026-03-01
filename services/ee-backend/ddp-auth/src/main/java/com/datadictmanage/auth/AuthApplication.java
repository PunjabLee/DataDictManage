package com.datadictmanage.auth;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * AuthApplication — 认证服务启动类
 *
 * 职责：
 *   - 用户登录（用户名/密码 → JWT Token）
 *   - Token 刷新（Refresh Token 机制）
 *   - Token 校验（网关调用）
 *   - 用户注册（EE 版本）
 *   - SSO 集成（企业 LDAP/OAuth2，EE 版本）
 */
@SpringBootApplication
@MapperScan("com.datadictmanage.auth.mapper")
public class AuthApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthApplication.class, args);
    }
}
