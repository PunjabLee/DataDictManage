package com.datadictmanage.modeling.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.datadictmanage.modeling.infrastructure.persistence.po.DataItemPO;
import org.apache.ibatis.annotations.Mapper;

/**
 * DataItemMapper — 数据项 MyBatis-Plus Mapper
 */
@Mapper
public interface DataItemMapper extends BaseMapper<DataItemPO> {
}
