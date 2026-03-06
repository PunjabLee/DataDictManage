package com.datadictmanage.modeling.domain.standard;

import java.util.List;

/**
 * CodeValueGroupRepository — 代码值组仓储接口
 */
public interface CodeValueGroupRepository {

    CodeValueGroupBO findById(String id);

    CodeValueGroupBO findByCode(String code);

    List<CodeValueGroupBO> findByCategoryId(String categoryId);

    List<CodeValueGroupBO> findPublished();

    List<CodeValueGroupBO> findAll();

    void save(CodeValueGroupBO bo);

    void delete(String id);
}
