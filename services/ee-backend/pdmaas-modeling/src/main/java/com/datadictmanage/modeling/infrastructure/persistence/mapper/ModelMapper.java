package com.datadictmanage.modeling.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.datadictmanage.modeling.infrastructure.persistence.po.ModelPO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * ModelMapper — 数据模型 MyBatis-Plus Mapper
 *
 * 职责：
 *   继承 BaseMapper<ModelPO>，自动获得 CRUD 操作。
 *   自定义复杂查询使用 @Param + XML 映射（见 ModelMapper.xml）。
 *
 * @layer Infrastructure Layer — infrastructure/persistence/mapper
 */
@Mapper
public interface ModelMapper extends BaseMapper<ModelPO> {

    /**
     * 根据项目 ID 查询模型列表（按更新时间倒序）
     * 注：简单查询可以用 MyBatis-Plus 的 LambdaQueryWrapper，
     *     复杂查询使用 XML 映射文件
     *
     * @param projectId 项目 ID
     * @return 模型 PO 列表
     */
    List<ModelPO> selectByProjectId(@Param("projectId") String projectId);
}
