package com.datadictmanage.modeling.interfaces.vo;

import lombok.Data;

import java.util.List;

/**
 * ApiDefinitionVO — API 定义视图对象
 */
@Data
public class ApiDefinitionVO {

    private String id;
    private String name;
    private String path;
    private String method;  // GET, POST, PUT, DELETE
    private String category;
    private String description;
    private List<ApiParamVO> requestParams;
    private List<ApiParamVO> responseParams;
    private Integer status;  // 0: 草稿, 1: 已发布, 2: 已废弃
    private Long callCount;
    private String createdBy;
    private String createdAt;
    private String updatedAt;

    @Data
    public static class ApiParamVO {
        private String name;
        private String type;  // string, number, boolean, object, array
        private Boolean required;
        private String description;
        private String example;
    }
}
