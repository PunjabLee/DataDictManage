package com.datadictmanage.modeling.infrastructure.persistence.standard;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.datadictmanage.modeling.domain.standard.DataItemBO;
import com.datadictmanage.modeling.domain.standard.DataItemRepository;
import com.datadictmanage.modeling.infrastructure.persistence.mapper.DataItemMapper;
import com.datadictmanage.modeling.infrastructure.persistence.po.DataItemPO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.stream.Collectors;

/**
 * DataItemRepositoryImpl — 数据项仓储实现
 * 适配现有数据库表 t_data_item_standard
 */
@Repository
@RequiredArgsConstructor
public class DataItemRepositoryImpl implements DataItemRepository {

    private final DataItemMapper dataItemMapper;

    @Override
    public DataItemBO findById(String id) {
        DataItemPO po = dataItemMapper.selectById(id);
        return po != null ? toBO(po) : null;
    }

    @Override
    public DataItemBO findByCode(String code) {
        LambdaQueryWrapper<DataItemPO> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DataItemPO::getEnglishAbbr, code);
        DataItemPO po = dataItemMapper.selectOne(wrapper);
        return po != null ? toBO(po) : null;
    }

    @Override
    public List<DataItemBO> findByCategoryId(String categoryId) {
        // categoryId 对应 teamId
        LambdaQueryWrapper<DataItemPO> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DataItemPO::getTeamId, categoryId);
        return dataItemMapper.selectList(wrapper).stream()
                .map(this::toBO)
                .collect(Collectors.toList());
    }

    @Override
    public List<DataItemBO> findPublished(String keyword) {
        LambdaQueryWrapper<DataItemPO> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DataItemPO::getStatus, 1); // 1 = PUBLISHED
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.and(w -> w
                    .like(DataItemPO::getEnglishAbbr, keyword)
                    .or()
                    .like(DataItemPO::getChineseName, keyword));
        }
        return dataItemMapper.selectList(wrapper).stream()
                .map(this::toBO)
                .collect(Collectors.toList());
    }

    @Override
    public List<DataItemBO> findAll() {
        return dataItemMapper.selectList(null).stream()
                .map(this::toBO)
                .collect(Collectors.toList());
    }

    @Override
    public void save(DataItemBO bo) {
        DataItemPO po = toPO(bo);
        if (dataItemMapper.selectById(bo.getId()) != null) {
            dataItemMapper.updateById(po);
        } else {
            dataItemMapper.insert(po);
        }
    }

    @Override
    public void delete(String id) {
        dataItemMapper.deleteById(id);
    }

    @Override
    public boolean existsByCode(String code) {
        LambdaQueryWrapper<DataItemPO> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DataItemPO::getEnglishAbbr, code);
        return dataItemMapper.selectCount(wrapper) > 0;
    }

    private DataItemBO toBO(DataItemPO po) {
        return DataItemBO.builder()
                .id(po.getId())
                .teamId(po.getTeamId())
                .chineseName(po.getChineseName())
                .englishAbbr(po.getEnglishAbbr())
                .baseType(po.getBaseType())
                .length(po.getLength())
                .precisionVal(po.getPrecisionVal())
                .scaleVal(po.getScaleVal())
                .nullable(po.getNullable())
                .businessDesc(po.getBusinessDesc())
                .codeValueGroup(po.getCodeValueGroup())
                .status(po.getStatus())
                .createdBy(po.getCreatedBy())
                .createdAt(po.getCreatedAt())
                .updatedAt(po.getUpdatedAt())
                .build();
    }

    private DataItemPO toPO(DataItemBO bo) {
        DataItemPO po = new DataItemPO();
        po.setId(bo.getId());
        po.setTeamId(bo.getTeamId());
        po.setChineseName(bo.getChineseName());
        po.setEnglishAbbr(bo.getEnglishAbbr());
        po.setBaseType(bo.getBaseType());
        po.setLength(bo.getLength());
        po.setPrecisionVal(bo.getPrecisionVal());
        po.setScaleVal(bo.getScaleVal());
        po.setNullable(bo.getNullable());
        po.setBusinessDesc(bo.getBusinessDesc());
        po.setCodeValueGroup(bo.getCodeValueGroup());
        po.setStatus(bo.getStatus());
        po.setCreatedBy(bo.getCreatedBy());
        return po;
    }
}
