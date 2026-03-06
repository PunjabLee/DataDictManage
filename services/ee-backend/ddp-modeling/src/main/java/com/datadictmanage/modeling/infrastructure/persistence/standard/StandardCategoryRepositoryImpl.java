package com.datadictmanage.modeling.infrastructure.persistence.standard;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.datadictmanage.modeling.domain.standard.StandardCategoryBO;
import com.datadictmanage.modeling.domain.standard.StandardCategoryRepository;
import com.datadictmanage.modeling.infrastructure.persistence.mapper.StandardCategoryMapper;
import com.datadictmanage.modeling.infrastructure.persistence.po.StandardCategoryPO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.stream.Collectors;

/**
 * StandardCategoryRepositoryImpl — 数据标准分类仓储实现
 */
@Repository
@RequiredArgsConstructor
public class StandardCategoryRepositoryImpl implements StandardCategoryRepository {

    private final StandardCategoryMapper standardCategoryMapper;

    @Override
    public StandardCategoryBO findById(String id) {
        StandardCategoryPO po = standardCategoryMapper.selectById(id);
        return po != null ? toBO(po) : null;
    }

    @Override
    public List<StandardCategoryBO> findByParentId(String parentId) {
        LambdaQueryWrapper<StandardCategoryPO> wrapper = new LambdaQueryWrapper<>();
        if (parentId == null) {
            wrapper.isNull(StandardCategoryPO::getParentId);
        } else {
            wrapper.eq(StandardCategoryPO::getParentId, parentId);
        }
        wrapper.orderByAsc(StandardCategoryPO::getSortOrder);
        return standardCategoryMapper.selectList(wrapper).stream()
                .map(this::toBO)
                .collect(Collectors.toList());
    }

    @Override
    public List<StandardCategoryBO> findAll() {
        return standardCategoryMapper.selectList(null).stream()
                .map(this::toBO)
                .collect(Collectors.toList());
    }

    @Override
    public void save(StandardCategoryBO bo) {
        StandardCategoryPO po = toPO(bo);
        if (standardCategoryMapper.selectById(bo.getId()) != null) {
            standardCategoryMapper.updateById(po);
        } else {
            standardCategoryMapper.insert(po);
        }
    }

    @Override
    public void delete(String id) {
        standardCategoryMapper.deleteById(id);
    }

    private StandardCategoryBO toBO(StandardCategoryPO po) {
        return StandardCategoryBO.builder()
                .id(po.getId())
                .name(po.getName())
                .parentId(po.getParentId())
                .sortOrder(po.getSortOrder())
                .description(po.getDescription())
                .createdBy(po.getCreatedBy())
                .createdAt(po.getCreatedAt())
                .updatedAt(po.getUpdatedAt())
                .build();
    }

    private StandardCategoryPO toPO(StandardCategoryBO bo) {
        StandardCategoryPO po = new StandardCategoryPO();
        po.setId(bo.getId());
        po.setName(bo.getName());
        po.setParentId(bo.getParentId());
        po.setSortOrder(bo.getSortOrder());
        po.setDescription(bo.getDescription());
        po.setCreatedBy(bo.getCreatedBy());
        return po;
    }
}
