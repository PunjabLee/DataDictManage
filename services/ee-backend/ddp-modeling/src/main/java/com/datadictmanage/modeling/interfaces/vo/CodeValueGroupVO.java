package com.datadictmanage.modeling.interfaces.vo;

import lombok.Data;

import java.util.List;

/**
 * CodeValueGroupVO — 代码值组视图对象
 */
@Data
public class CodeValueGroupVO {

    private String id;
    private String code;
    private String name;
    private String description;
    private List<CodeValueVO> values;
    private String createdAt;
    private String updatedAt;

    /**
     * CodeValueVO — 代码值视图对象
     */
    @Data
    public static class CodeValueVO {
        private String id;
        private String code;
        private String name;
        private Integer sortOrder;
        private Integer status;
    }
}
