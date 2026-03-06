package com.datadictmanage.modeling.application.service;

import com.datadictmanage.modeling.application.dto.*;
import com.datadictmanage.modeling.domain.standard.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * DataStandardFacade — 数据标准应用服务门面
 * 负责数据项标准、代码值组、分类的 CRUD 操作
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DataStandardFacade {

    private final DataItemRepository dataItemRepository;
    private final CodeValueGroupRepository codeValueGroupRepository;
    private final StandardCategoryRepository standardCategoryRepository;

    // ==================== DataItem 数据项标准 ====================

    /**
     * 创建数据项标准
     */
    @Transactional
    public DataItemBO createDataItem(CreateDataItemDTO dto, String operatorId) {
        // 检查编码唯一性
        if (dataItemRepository.existsByCode(dto.getEnglishAbbr())) {
            throw new RuntimeException("英文缩写已存在: " + dto.getEnglishAbbr());
        }

        DataItemBO bo = DataItemBO.builder()
                .id(UUID.randomUUID().toString())
                .teamId(dto.getTeamId())
                .chineseName(dto.getChineseName())
                .englishAbbr(dto.getEnglishAbbr())
                .baseType(dto.getBaseType())
                .length(dto.getLength())
                .precisionVal(dto.getPrecisionVal())
                .scaleVal(dto.getScaleVal())
                .nullable(dto.getNullable() != null ? dto.getNullable() : true)
                .businessDesc(dto.getBusinessDesc() != null ? dto.getBusinessDesc() : "")
                .codeValueGroup(dto.getCodeValueGroup())
                .status(0) // DRAFT
                .createdBy(operatorId)
                .build();

        dataItemRepository.save(bo);
        log.info("创建数据项标准成功: {}, operator: {}", dto.getEnglishAbbr(), operatorId);
        return bo;
    }

    /**
     * 更新数据项标准
     */
    @Transactional
    public DataItemBO updateDataItem(String id, UpdateDataItemDTO dto, String operatorId) {
        DataItemBO bo = dataItemRepository.findById(id);
        if (bo == null) {
            throw new RuntimeException("数据项不存在: " + id);
        }

        if (dto.getChineseName() != null) bo.setChineseName(dto.getChineseName());
        if (dto.getEnglishAbbr() != null) bo.setEnglishAbbr(dto.getEnglishAbbr());
        if (dto.getBaseType() != null) bo.setBaseType(dto.getBaseType());
        if (dto.getLength() != null) bo.setLength(dto.getLength());
        if (dto.getPrecisionVal() != null) bo.setPrecisionVal(dto.getPrecisionVal());
        if (dto.getScaleVal() != null) bo.setScaleVal(dto.getScaleVal());
        if (dto.getNullable() != null) bo.setNullable(dto.getNullable());
        if (dto.getBusinessDesc() != null) bo.setBusinessDesc(dto.getBusinessDesc());
        if (dto.getCodeValueGroup() != null) bo.setCodeValueGroup(dto.getCodeValueGroup());

        dataItemRepository.save(bo);
        log.info("更新数据项标准成功: {}, operator: {}", id, operatorId);
        return bo;
    }

    /**
     * 发布数据项标准
     */
    @Transactional
    public DataItemBO publishDataItem(String id, String operatorId) {
        DataItemBO bo = dataItemRepository.findById(id);
        if (bo == null) {
            throw new RuntimeException("数据项不存在: " + id);
        }
        if (bo.getStatus() != null && bo.getStatus() != 0) {
            throw new RuntimeException("只有草稿状态的数据项才可以发布");
        }
        bo.setStatus(1); // PUBLISHED
        dataItemRepository.save(bo);
        log.info("发布数据项标准成功: {}, operator: {}", id, operatorId);
        return bo;
    }

    /**
     * 废弃数据项标准
     */
    @Transactional
    public DataItemBO deprecateDataItem(String id, String reason, String operatorId) {
        DataItemBO bo = dataItemRepository.findById(id);
        if (bo == null) {
            throw new RuntimeException("数据项不存在: " + id);
        }
        if (bo.getStatus() == null || bo.getStatus() != 1) {
            throw new RuntimeException("只有已发布的数据项才可以废弃");
        }
        bo.setStatus(2); // DEPRECATED
        bo.setBusinessDesc("[已废弃: " + reason + "] " + bo.getBusinessDesc());
        dataItemRepository.save(bo);
        log.info("废弃数据项标准成功: {}, operator: {}", id, operatorId);
        return bo;
    }

    /**
     * 获取数据项详情
     */
    public DataItemBO getDataItem(String id) {
        return dataItemRepository.findById(id);
    }

    /**
     * 根据编码获取数据项
     */
    public DataItemBO getDataItemByCode(String code) {
        return dataItemRepository.findByCode(code);
    }

    /**
     * 获取团队下的所有数据项
     */
    public List<DataItemBO> listDataItemsByCategory(String categoryId) {
        return dataItemRepository.findByCategoryId(categoryId);
    }

    /**
     * 获取所有已发布的数据项（可搜索）
     */
    public List<DataItemBO> listPublishedDataItems(String keyword) {
        return dataItemRepository.findPublished(keyword);
    }

    /**
     * 获取所有数据项
     */
    public List<DataItemBO> listAllDataItems() {
        return dataItemRepository.findAll();
    }

    /**
     * 删除数据项
     */
    @Transactional
    public void deleteDataItem(String id) {
        dataItemRepository.delete(id);
        log.info("删除数据项标准成功: {}", id);
    }

    // ==================== CodeValueGroup 代码值组 ====================

    /**
     * 创建代码值组
     */
    @Transactional
    public CodeValueGroupBO createCodeValueGroup(CreateCodeValueGroupDTO dto, String operatorId) {
        CodeValueGroupBO bo = CodeValueGroupBO.builder()
                .id(UUID.randomUUID().toString())
                .code(dto.getCode())
                .name(dto.getName())
                .description(dto.getDescription() != null ? dto.getDescription() : "")
                .categoryId(dto.getCategoryId())
                .status("DRAFT")
                .createdBy(operatorId)
                .build();

        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            List<CodeValueItemBO> items = dto.getItems().stream()
                    .map(item -> CodeValueItemBO.builder()
                            .value(item.getValue())
                            .label(item.getLabel())
                            .labelEn(item.getLabelEn() != null ? item.getLabelEn() : "")
                            .sortOrder(item.getSortOrder() != null ? item.getSortOrder() : 0)
                            .enabled(true)
                            .remark(item.getRemark() != null ? item.getRemark() : "")
                            .build())
                    .collect(Collectors.toList());
            bo.setItems(items);
        } else {
            bo.setItems(List.of());
        }

        codeValueGroupRepository.save(bo);
        log.info("创建代码值组成功: {}, operator: {}", dto.getCode(), operatorId);
        return bo;
    }

    /**
     * 发布代码值组
     */
    @Transactional
    public CodeValueGroupBO publishCodeValueGroup(String id, String operatorId) {
        CodeValueGroupBO bo = codeValueGroupRepository.findById(id);
        if (bo == null) {
            throw new RuntimeException("代码值组不存在: " + id);
        }
        if (!"DRAFT".equals(bo.getStatus())) {
            throw new RuntimeException("只有草稿状态的字典可以发布");
        }
        if (bo.getItems() == null || bo.getItems().isEmpty() || bo.getItems().stream().noneMatch(CodeValueItemBO::getEnabled)) {
            throw new RuntimeException("字典至少需要一个启用的条目才能发布");
        }
        bo.setStatus("PUBLISHED");
        codeValueGroupRepository.save(bo);
        log.info("发布代码值组成功: {}, operator: {}", id, operatorId);
        return bo;
    }

    /**
     * 废弃代码值组
     */
    @Transactional
    public CodeValueGroupBO deprecateCodeValueGroup(String id, String operatorId) {
        CodeValueGroupBO bo = codeValueGroupRepository.findById(id);
        if (bo == null) {
            throw new RuntimeException("代码值组不存在: " + id);
        }
        if (!"PUBLISHED".equals(bo.getStatus())) {
            throw new RuntimeException("只有已发布的字典可以废弃");
        }
        bo.setStatus("DEPRECATED");
        codeValueGroupRepository.save(bo);
        log.info("废弃代码值组成功: {}, operator: {}", id, operatorId);
        return bo;
    }

    /**
     * 获取代码值组详情
     */
    public CodeValueGroupBO getCodeValueGroup(String id) {
        return codeValueGroupRepository.findById(id);
    }

    /**
     * 获取所有已发布的代码值组
     */
    public List<CodeValueGroupBO> listPublishedCodeValueGroups() {
        return codeValueGroupRepository.findPublished();
    }

    /**
     * 获取所有代码值组
     */
    public List<CodeValueGroupBO> listAllCodeValueGroups() {
        return codeValueGroupRepository.findAll();
    }

    /**
     * 删除代码值组
     */
    @Transactional
    public void deleteCodeValueGroup(String id) {
        codeValueGroupRepository.delete(id);
        log.info("删除代码值组成功: {}", id);
    }

    // ==================== StandardCategory 分类 ====================

    /**
     * 创建分类
     */
    @Transactional
    public StandardCategoryBO createCategory(CreateStandardCategoryDTO dto, String operatorId) {
        StandardCategoryBO bo = StandardCategoryBO.builder()
                .id(UUID.randomUUID().toString())
                .name(dto.getName())
                .parentId(dto.getParentId())
                .sortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0)
                .description(dto.getDescription() != null ? dto.getDescription() : "")
                .createdBy(operatorId)
                .build();

        standardCategoryRepository.save(bo);
        log.info("创建数据标准分类成功: {}, operator: {}", bo.getName(), operatorId);
        return bo;
    }

    /**
     * 获取分类详情
     */
    public StandardCategoryBO getCategory(String id) {
        return standardCategoryRepository.findById(id);
    }

    /**
     * 获取子分类
     */
    public List<StandardCategoryBO> listChildCategories(String parentId) {
        return standardCategoryRepository.findByParentId(parentId);
    }

    /**
     * 获取所有分类
     */
    public List<StandardCategoryBO> listAllCategories() {
        return standardCategoryRepository.findAll();
    }

    /**
     * 删除分类
     */
    @Transactional
    public void deleteCategory(String id) {
        standardCategoryRepository.delete(id);
        log.info("删除数据标准分类成功: {}", id);
    }
}
