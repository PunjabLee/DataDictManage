package com.datadictmanage.modeling.domain.service;

import com.datadictmanage.modeling.domain.model.ModelBO;
import com.datadictmanage.modeling.domain.model.EntityBO;
import com.datadictmanage.modeling.domain.model.FieldBO;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * ModelBO 领域对象单元测试
 */
class ModelBOTest {

    @Test
    void testCreateModel() {
        String modelId = UUID.randomUUID().toString();
        ModelBO model = ModelBO.builder()
                .id(modelId)
                .name("测试模型")
                .description("这是一个测试模型")
                .projectId("proj-001")
                .currentBranchId("branch-main")
                .build();

        assertNotNull(model);
        assertEquals("测试模型", model.getName());
        assertEquals("proj-001", model.getProjectId());
    }

    @Test
    void testAddEntity() {
        ModelBO model = ModelBO.builder()
                .id(UUID.randomUUID().toString())
                .name("测试模型")
                .projectId("proj-001")
                .build();

        EntityBO entity = EntityBO.builder()
                .id(UUID.randomUUID().toString())
                .name("sys_user")
                .comment("用户表")
                .layer("PHYSICAL")
                .build();

        model.addEntity(entity);

        assertEquals(1, model.getEntities().size());
        assertEquals("sys_user", model.getEntities().get(0).getName());
    }

    @Test
    void testAddField() {
        EntityBO entity = EntityBO.builder()
                .id(UUID.randomUUID().toString())
                .name("sys_user")
                .build();

        FieldBO field = FieldBO.builder()
                .id(UUID.randomUUID().toString())
                .name("id")
                .comment("主键")
                .baseType("VARCHAR")
                .length(36)
                .primaryKey(true)
                .nullable(false)
                .build();

        entity.addField(field);

        assertEquals(1, entity.getFields().size());
        assertTrue(entity.getFields().get(0).isPrimaryKey());
    }

    @Test
    void testFieldTypeLabel() {
        FieldBO field1 = FieldBO.builder()
                .baseType("VARCHAR")
                .length(255)
                .build();
        
        FieldBO field2 = FieldBO.builder()
                .baseType("DECIMAL")
                .precision(10)
                .scale(2)
                .build();

        FieldBO field3 = FieldBO.builder()
                .baseType("DATE")
                .build();

        assertEquals("VARCHAR(255)", field1.formatTypeLabel());
        assertEquals("DECIMAL(10,2)", field2.formatTypeLabel());
        assertEquals("DATE", field3.formatTypeLabel());
    }

    @Test
    void testModelSnapshot() {
        ModelBO model = ModelBO.builder()
                .id(UUID.randomUUID().toString())
                .name("测试模型")
                .projectId("proj-001")
                .build();

        model.addEntity(EntityBO.builder()
                .id(UUID.randomUUID().toString())
                .name("sys_user")
                .build());

        // 创建快照
        ModelBO.Snapshot snapshot = model.createSnapshot("v1.0", "测试版本");

        assertNotNull(snapshot);
        assertEquals("v1.0", snapshot.getVersionTag());
        assertEquals(1, snapshot.getEntities().size());
    }

    @Test
    void testRelation() {
        String entity1Id = UUID.randomUUID().toString();
        String entity2Id = UUID.randomUUID().toString();

        ModelBO.Relation relation = ModelBO.Relation.builder()
                .id(UUID.randomUUID().toString())
                .fromEntityId(entity1Id)
                .toEntityId(entity2Id)
                .type("ONE_TO_MANY")
                .comment("用户与订单")
                .build();

        assertNotNull(relation);
        assertEquals("ONE_TO_MANY", relation.getType());
    }
}
