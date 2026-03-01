package com.datadictmanage.modeling.application.assembler;

import com.datadictmanage.modeling.domain.model.ModelBO;
import com.datadictmanage.modeling.domain.model.EntityBO;
import com.datadictmanage.modeling.domain.model.FieldBO;
import com.datadictmanage.modeling.interfaces.vo.ModelVO;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * ModelAssembler — 模型装配器（BO <-> VO 双向转换）
 *
 * 职责：
 *   将领域层的 BO 转换为接入层的 VO（返回给前端），
 *   或将接入层的 DTO 转换为领域层的 BO（用于领域操作）。
 *
 *   装配器确保领域对象不直接暴露给前端（防止领域知识外泄），
 *   同时也确保前端的 DTO 不渗透到领域层（防止贫血模型）。
 *
 * @layer Application Layer — application/assembler
 * @pattern GoF: Adapter（适配 BO 和 VO 接口）
 */
@Component
public class ModelAssembler {

    /**
     * ModelBO → ModelVO（详情视图）
     * 包含完整的 Entity 和 Field 数据
     *
     * @param bo 领域对象
     * @return 视图对象
     */
    public ModelVO toVO(ModelBO bo) {
        if (bo == null) return null;

        ModelVO vo = new ModelVO();
        vo.setId(bo.getId());
        vo.setName(bo.getName());
        vo.setDescription(bo.getDescription());
        vo.setProjectId(bo.getProjectId());
        vo.setCurrentBranchId(bo.getCurrentBranchId());
        vo.setCreatedBy(bo.getCreatedBy());
        vo.setCreatedAt(bo.getCreatedAt() != null ? bo.getCreatedAt().toString() : null);
        vo.setUpdatedAt(bo.getUpdatedAt() != null ? bo.getUpdatedAt().toString() : null);
        vo.setEntityCount(bo.getEntities() != null ? bo.getEntities().size() : 0);

        if (bo.getEntities() != null) {
            vo.setEntities(bo.getEntities().stream()
                    .map(this::entityToVO)
                    .collect(Collectors.toList()));
        }

        return vo;
    }

    /**
     * ModelBO → ModelVO（列表视图）
     * 不包含 Entity 详细信息（减少数据传输量）
     */
    public ModelVO toListVO(ModelBO bo) {
        if (bo == null) return null;

        ModelVO vo = new ModelVO();
        vo.setId(bo.getId());
        vo.setName(bo.getName());
        vo.setDescription(bo.getDescription());
        vo.setProjectId(bo.getProjectId());
        vo.setEntityCount(bo.getEntities() != null ? bo.getEntities().size() : 0);
        vo.setCreatedBy(bo.getCreatedBy());
        vo.setCreatedAt(bo.getCreatedAt() != null ? bo.getCreatedAt().toString() : null);
        vo.setUpdatedAt(bo.getUpdatedAt() != null ? bo.getUpdatedAt().toString() : null);

        return vo;
    }

    private ModelVO.EntityVO entityToVO(EntityBO bo) {
        ModelVO.EntityVO vo = new ModelVO.EntityVO();
        vo.setId(bo.getId());
        vo.setName(bo.getName());
        vo.setComment(bo.getComment());
        vo.setLayer(bo.getLayer());
        if (bo.getFields() != null) {
            vo.setFields(bo.getFields().stream()
                    .map(this::fieldToVO)
                    .collect(Collectors.toList()));
        }
        return vo;
    }

    private ModelVO.FieldVO fieldToVO(FieldBO bo) {
        ModelVO.FieldVO vo = new ModelVO.FieldVO();
        vo.setId(bo.getId());
        vo.setName(bo.getName());
        vo.setComment(bo.getComment());
        vo.setBaseType(bo.getBaseType());
        vo.setLength(bo.getLength());
        vo.setPrecision(bo.getPrecision());
        vo.setScale(bo.getScale());
        vo.setNullable(bo.isNullable());
        vo.setPrimaryKey(bo.isPrimaryKey());
        vo.setUnique(bo.isUnique());
        vo.setAutoIncrement(bo.isAutoIncrement());
        vo.setDefaultValue(bo.getDefaultValue());
        vo.setSortOrder(bo.getSortOrder());
        vo.setStandardId(bo.getStandardId());
        vo.setStandardName(bo.getStandardName());
        vo.setTypeLabel(bo.formatTypeLabel());
        vo.setHasStandardBinding(bo.hasStandardBinding());
        return vo;
    }
}
