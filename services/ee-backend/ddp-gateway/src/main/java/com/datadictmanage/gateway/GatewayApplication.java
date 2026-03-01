package com.datadictmanage.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * GatewayApplication — API 网关启动类
 *
 * 职责：
 *   Spring Cloud Gateway 网关服务，统一处理：
 *   - 路由转发（将请求路由到 ddp-modeling、ddp-auth 等微服务）
 *   - JWT Token 校验（AuthGlobalFilter）
 *   - 请求限流（Redis + RequestRateLimiter）
 *   - 跨域配置（CORS）
 *   - 链路追踪（SkyWalking / Sleuth）
 *
 * @layer Infrastructure Layer (网关是横切关注点，属于基础设施层)
 */
@SpringBootApplication
public class GatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }
}
