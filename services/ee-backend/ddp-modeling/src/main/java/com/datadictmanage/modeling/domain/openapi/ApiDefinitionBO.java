package com.datadictmanage.modeling.domain.openapi;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

/**
 * ApiDefinitionBO — API 定义 业务对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiDefinitionBO {

    private String id;
    private String name;           // API 名称
    private String path;           // 请求路径
    private String method;         // 请求方法: GET/POST/PUT/DELETE
    private String description;    // API 描述
    private String category;        // 分类
    private String version;        // 版本
    private String status;         // DRAFT / PUBLISHED / DEPRECATED
    private String authType;       // 认证方式: NONE / APP_KEY / HMAC
    private List<ApiParamBO> requestParams;   // 请求参数
    private List<ApiParamBO> responseParams;  // 响应参数
    private String createdBy;
    private Date createdAt;
    private Date updatedAt;

    // 认证类型
    public static final String AUTH_NONE = "NONE";
    public static final String AUTH_APP_KEY = "APP_KEY";
    public static final String AUTH_HMAC = "HMAC";

    // 方法
    public static final String METHOD_GET = "GET";
    public static final String METHOD_POST = "POST";
    public static final String METHOD_PUT = "PUT";
    public static final String METHOD_DELETE = "DELETE";
}
