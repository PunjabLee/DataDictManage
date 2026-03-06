package com.datadictmanage.modeling.domain.standard;

import java.util.List;

/**
 * StandardCategoryRepository — 数据标准分类仓储接口
 */
public interface StandardCategoryRepository {

    StandardCategoryBO findById(String id);

    List<StandardCategoryBO> findByParentId(String parentId);

    List<StandardCategoryBO> findAll();

    void save(StandardCategoryBO bo);

    void delete(String id);
}
