package com.datadictmanage.modeling.infrastructure.persistence.standard;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.datadictmanage.modeling.application.dto.CodeValueItemDTO;
import com.datadictmanage.modeling.domain.standard.CodeValueGroupBO;
import com.datadictmanage.modeling.domain.standard.CodeValueGroupRepository;
import com.datadictmanage.modeling.infrastructure.persistence.mapper.CodeValueGroupMapper;
import com.datadictmanage.modeling.infrastructure.persistence.po.CodeValueGroupPO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.stream.Collectors;

/**
 * CodeValueGroupRepositoryImpl — 代码值组仓储实现
 */
@Repository
@RequiredArgsConstructor
public class CodeValueGroupRepositoryImpl implements CodeValueGroupRepository {

    private final CodeValueGroupMapper codeValueGroupMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public CodeValueGroupBO findById(String id) {
        CodeValueGroupPO po = codeValueGroupMapper.selectById(id);
        return po != null ? toBO(po) : null;
    }

    @Override
    public CodeValueGroupBO findByCode(String code) {
        LambdaQueryWrapper<CodeValueGroupPO> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CodeValueGroupPO::getCode, code);
        CodeValueGroupPO po = codeValueGroupMapper.selectOne(wrapper);
        return po != null ? toBO(po) : null;
    }

    @Override
    public List<CodeValueGroupBO> findByCategoryId(String categoryId) {
        LambdaQueryWrapper<CodeValueGroupPO> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CodeValueGroupPO::getCategoryId, categoryId);
        return codeValueGroupMapper.selectList(wrapper).stream()
                .map(this::toBO)
                .collect(Collectors.toList());
    }

    @Override
    public List<CodeValueGroupBO> findPublished() {
        LambdaQueryWrapper<CodeValueGroupPO> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CodeValueGroupPO::getStatus, "PUBLISHED");
        return codeValueGroupMapper.selectList(wrapper).stream()
                .map(this::toBO)
                .collect(Collectors.toList());
    }

    @Override
    public List<CodeValueGroupBO> findAll() {
        return codeValueGroupMapper.selectList(null).stream()
                .map(this::toBO)
                .collect(Collectors.toList());
    }

    @Override
    public void save(CodeValueGroupBO bo) {
        CodeValueGroupPO po = toPO(bo);
        if (codeValueGroupMapper.selectById(bo.getId()) != null) {
            codeValueGroupMapper.updateById(po);
        } else {
            codeValueGroupMapper.insert(po);
        }
    }

    @Override
    public void delete(String id) {
        codeValueGroupMapper.deleteById(id);
    }

    private CodeValueGroupBO toBO(CodeValueGroupPO po) {
        List<CodeValueItemDTO> items = null;
        if (po.getItemsJson() != null && !po.getItemsJson().isEmpty()) {
            try {
                items = objectMapper.readValue(po.getItemsJson(), new TypeReference<List<CodeValueItemDTO>>() {});
            } catch (JsonProcessingException e) {
                items = List.of();
            }
        }

        List<com.datadictmanage.modeling.domain.standard.CodeValueItemBO> itemBOs = items != null ? items.stream()
                .map(item -> com.datadictmanage.modeling.domain.standard.CodeValueItemBO.builder()
                        .value(item.getValue())
                        .label(item.getLabel())
                        .labelEn(item.getLabelEn())
                        .sortOrder(item.getSortOrder())
                        .enabled(true)
                        .remark(item.getRemark())
                        .build())
                .collect(Collectors.toList()) : List.of();

        return CodeValueGroupBO.builder()
                .id(po.getId())
                .code(po.getCode())
                .name(po.getName())
                .description(po.getDescription())
                .items(itemBOs)
                .status(po.getStatus())
                .categoryId(po.getCategoryId())
                .createdBy(po.getCreatedBy())
                .createdAt(po.getCreatedAt())
                .updatedAt(po.getUpdatedAt())
                .build();
    }

    private CodeValueGroupPO toPO(CodeValueGroupBO bo) {
        CodeValueGroupPO po = new CodeValueGroupPO();
        po.setId(bo.getId());
        po.setCode(bo.getCode());
        po.setName(bo.getName());
        po.setDescription(bo.getDescription());
        po.setStatus(bo.getStatus());
        po.setCategoryId(bo.getCategoryId());
        po.setCreatedBy(bo.getCreatedBy());

        if (bo.getItems() != null && !bo.getItems().isEmpty()) {
            try {
                List<CodeValueItemDTO> items = bo.getItems().stream()
                        .map(item -> {
                            CodeValueItemDTO dto = new CodeValueItemDTO();
                            dto.setValue(item.getValue());
                            dto.setLabel(item.getLabel());
                            dto.setLabelEn(item.getLabelEn());
                            dto.setSortOrder(item.getSortOrder());
                            dto.setRemark(item.getRemark());
                            return dto;
                        })
                        .collect(Collectors.toList());
                po.setItemsJson(objectMapper.writeValueAsString(items));
            } catch (JsonProcessingException e) {
                po.setItemsJson("[]");
            }
        } else {
            po.setItemsJson("[]");
        }

        return po;
    }
}
