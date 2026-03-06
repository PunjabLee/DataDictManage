package com.datadictmanage.modeling.domain.standard;

import java.util.List;

/**
 * DataItemRepository — 数据项仓储接口
 */
public interface DataItemRepository {

    DataItemBO findById(String id);

    DataItemBO findByCode(String code);

    List<DataItemBO> findByCategoryId(String categoryId);

    List<DataItemBO> findPublished(String keyword);

    List<DataItemBO> findAll();

    void save(DataItemBO bo);

    void delete(String id);

    boolean existsByCode(String code);
}
