package com.datadictmanage.modeling.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.datadictmanage.modeling.infrastructure.persistence.po.StandardCategoryPO;
import org.apache.ibatis.annotations.Mapper;

/**
 * StandardCategoryMapper — 数据标准分类 MyBatis-Plus Mapper
 */
@Mapper
public interface StandardCategoryMapper extends BaseMapper<StandardCategoryPO> {
}
