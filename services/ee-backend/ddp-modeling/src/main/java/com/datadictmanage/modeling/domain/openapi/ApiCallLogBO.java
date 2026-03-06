package com.datadictmanage.modeling.domain.openapi;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * ApiCallLogBO — API 调用日志 业务对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiCallLogBO {

    private String id;
    private String appId;           // 应用ID
    private String appName;         // 应用名称
    private String apiId;           // API ID
    private String apiName;         // API 名称
    private String path;            // 请求路径
    private String method;           // 请求方法
    private String requestHeaders;  // 请求头
    private String requestBody;     // 请求体
    private Integer responseStatus;  // 响应状态码
    private String responseBody;    // 响应体
    private Long costTime;          // 耗时(毫秒)
    private String ip;              // 调用IP
    private String userAgent;       // 用户代理
    private String errorMsg;        // 错误信息
    private Date createdAt;
}
