package com.datadictmanage.modeling.domain.service;

import com.datadictmanage.modeling.domain.model.ModelBO;
import com.datadictmanage.modeling.domain.model.EntityBO;
import com.datadictmanage.modeling.application.dto.AddFieldDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * ModelDomainService 单元测试
 *
 * 测试覆盖：
 * - 模型创建领域规则
 * - 实体添加领域规则
 * - 字段添加领域规则
 * - 关系管理领域规则
 */
class ModelDomainServiceTest {

    private ModelDomainService domainService;
    private ModelRepositoryStub modelRepository;

    @BeforeEach
    void setUp() {
        modelRepository = new ModelRepositoryStub();
        domainService = new ModelDomainService(modelRepository);
    }

    // ── 模型创建测试 ───────────────────────────────────────────────────

    @Test
    void createModel_success() {
        ModelBO model = domainService.createModel("用户中心", "proj-001", "user-001");
        
        assertNotNull(model.getId());
        assertEquals("用户中心", model.getName());
        assertEquals("proj-001", model.getProjectId());
        assertEquals("user-001", model.getCreatedBy());
        assertNotNull(model.getCurrentBranchId());
    }

    @Test
    void createModel_emptyName_shouldFail() {
        assertThrows(Exception.class, () -> 
            domainService.createModel("", "proj-001", "user-001")
        );
    }

    @Test
    void createModel_duplicateName_shouldFail() {
        // 先创建一个模型
        domainService.createModel("用户中心", "proj-001", "user-001");
        
        // 再次创建同名模型应该失败
        assertThrows(Exception.class, () -> 
            domainService.createModel("用户中心", "proj-001", "user-001")
        );
    }

    // ── 实体添加测试 ───────────────────────────────────────────────────

    @Test
    void addEntity_success() {
        ModelBO model = domainService.createModel("测试模型", "proj-001", "user-001");
        
        EntityBO entity = domainService.addEntity(model, "sys_user", "用户表", "PHYSICAL");
        
        assertNotNull(entity.getId());
        assertEquals("sys_user", entity.getName());
        assertEquals("用户表", entity.getComment());
        assertEquals(1, model.getEntities().size());
    }

    @Test
    void addEntity_invalidName_shouldFail() {
        ModelBO model = domainService.createModel("测试模型", "proj-001", "user-001");
        
        // 无效的表名（包含特殊字符）
        assertThrows(Exception.class, () -> 
            domainService.addEntity(model, "user-table", "用户表", "PHYSICAL")
        );
    }

    @Test
    void addEntity_autoAddIdField() {
        ModelBO model = domainService.createModel("测试模型", "proj-001", "user-001");
        
        EntityBO entity = domainService.addEntity(model, "sys_user", "用户表", "PHYSICAL");
        
        // 应该自动添加 id 主键字段
        assertEquals(1, entity.getFields().size());
        assertEquals("id", entity.getFields().get(0).getName());
        assertTrue(entity.getFields().get(0).getPrimaryKey());
    }

    // ── 字段添加测试 ───────────────────────────────────────────────────

    @Test
    void addField_success() {
        ModelBO model = domainService.createModel("测试模型", "proj-001", "user-001");
        EntityBO entity = domainService.addEntity(model, "sys_user", "用户表", "PHYSICAL");
        
        AddFieldDTO dto = new AddFieldDTO();
        dto.setName("username");
        dto.setComment("用户名");
        dto.setBaseType("STRING");
        dto.setLength(100);
        dto.setNullable(false);
        
        domainService.addField(model, entity.getId(), dto, "user-001");
        
        assertEquals(2, entity.getFields().size()); // id + username
        assertEquals("username", entity.getFields().get(1).getName());
    }

    @Test
    void addField_duplicateName_shouldFail() {
        ModelBO model = domainService.createModel("测试模型", "proj-001", "user-001");
        EntityBO entity = domainService.addEntity(model, "sys_user", "用户表", "PHYSICAL");
        
        AddFieldDTO dto = new AddFieldDTO();
        dto.setName("id"); // 与自动创建的 id 字段重复
        dto.setBaseType("STRING");
        
        assertThrows(Exception.class, () -> 
            domainService.addField(model, entity.getId(), dto, "user-001")
        );
    }

    // ── 字段删除测试 ───────────────────────────────────────────────────

    @Test
    void deleteField_success() {
        ModelBO model = domainService.createModel("测试模型", "proj-001", "user-001");
        EntityBO entity = domainService.addEntity(model, "sys_user", "用户表", "PHYSICAL");
        
        AddFieldDTO dto = new AddFieldDTO();
        dto.setName("username");
        dto.setBaseType("STRING");
        domainService.addField(model, entity.getId(), dto, "user-001");
        
        String fieldId = entity.getFields().get(1).getId();
        domainService.deleteField(model, entity.getId(), fieldId, "user-001");
        
        assertEquals(1, entity.getFields().size()); // 只剩 id
    }

    // ── 关系管理测试 ───────────────────────────────────────────────────

    @Test
    void addRelation_success() {
        ModelBO model = domainService.createModel("测试模型", "proj-001", "user-001");
        EntityBO user = domainService.addEntity(model, "sys_user", "用户表", "PHYSICAL");
        EntityBO order = domainService.addEntity(model, "ord_order", "订单表", "PHYSICAL");
        
        var relationDTO = new com.datadictmanage.modeling.application.dto.RelationDTO();
        relationDTO.setFromEntityId(user.getId());
        relationDTO.setToEntityId(order.getId());
        relationDTO.setType("ONE_TO_MANY");
        
        domainService.addRelation(model, relationDTO, "user-001");
        
        assertEquals(1, model.getRelations().size());
        assertEquals(user.getId(), model.getRelations().get(0).getFromEntityId());
        assertEquals(order.getId(), model.getRelations().get(0).getToEntityId());
    }

    @Test
    void deleteRelation_success() {
        ModelBO model = domainService.createModel("测试模型", "proj-001", "user-001");
        EntityBO user = domainService.addEntity(model, "sys_user", "用户表", "PHYSICAL");
        EntityBO order = domainService.addEntity(model, "ord_order", "订单表", "PHYSICAL");
        
        var relationDTO = new com.datadictmanage.modeling.application.dto.RelationDTO();
        relationDTO.setFromEntityId(user.getId());
        relationDTO.setToEntityId(order.getId());
        relationDTO.setType("ONE_TO_MANY");
        
        domainService.addRelation(model, relationDTO, "user-001");
        String relationId = model.getRelations().get(0).getId();
        
        domainService.deleteRelation(model, relationId, "user-001");
        
        assertEquals(0, model.getRelations().size());
    }
}

/**
 * 模拟仓储（用于测试）
 */
class ModelRepositoryStub implements ModelRepository {
    private final java.util.Map<String, ModelBO> store = new java.util.HashMap<>();

    @Override
    public void save(ModelBO model) {
        store.put(model.getId(), model);
    }

    @Override
    public java.util.Optional<ModelBO> findById(String id) {
        return java.util.Optional.ofNullable(store.get(id));
    }

    @Override
    public java.util.List<ModelBO> findByProjectId(String projectId) {
        return store.values().stream()
            .filter(m -> m.getProjectId().equals(projectId))
            .collect(java.util.stream.Collectors.toList());
    }

    @Override
    public void deleteById(String id) {
        store.remove(id);
    }

    @Override
    public boolean existsById(String id) {
        return store.containsKey(id);
    }

    @Override
    public java.util.Optional<ModelBO> findByProjectIdAndName(String projectId, String name) {
        return store.values().stream()
            .filter(m -> m.getProjectId().equals(projectId) && m.getName().equals(name))
            .findFirst();
    }

    @Override
    public void saveSnapshot(String modelId, String branchId, java.util.Map<String, Object> snapshot) {
        // 模拟实现
    }

    @Override
    public java.util.List<java.util.Map<String, Object>> findSnapshots(String modelId) {
        return java.util.Collections.emptyList();
    }
}
