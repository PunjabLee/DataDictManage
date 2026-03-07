package com.datadictmanage.modeling.interfaces.vo;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * VO 视图对象单元测试
 */
class VOTest {

    @Test
    void testModelVO() {
        ModelVO modelVO = new ModelVO();
        modelVO.setId("model-001");
        modelVO.setName("用户中心模型");
        modelVO.setDescription("用户相关表结构");
        modelVO.setProjectId("proj-001");
        modelVO.setEntityCount(3);

        assertEquals("model-001", modelVO.getId());
        assertEquals("用户中心模型", modelVO.getName());
        assertEquals(3, modelVO.getEntityCount());
    }

    @Test
    void testEntityVO() {
        ModelVO.EntityVO entityVO = new ModelVO.EntityVO();
        entityVO.setId("entity-001");
        entityVO.setName("sys_user");
        entityVO.setComment("用户表");
        entityVO.setLayer("PHYSICAL");

        List<ModelVO.FieldVO> fields = new ArrayList<>();
        ModelVO.FieldVO fieldVO = new ModelVO.FieldVO();
        fieldVO.setId("field-001");
        fieldVO.setName("id");
        fieldVO.setBaseType("VARCHAR");
        fieldVO.setLength(36);
        fieldVO.setPrimaryKey(true);
        fieldVO.setTypeLabel("VARCHAR(36)");
        fields.add(fieldVO);

        entityVO.setFields(fields);

        assertEquals(1, entityVO.getFields().size());
        assertTrue(entityVO.getFields().get(0).isPrimaryKey());
    }

    @Test
    void testFieldVO() {
        ModelVO.FieldVO fieldVO = new ModelVO.FieldVO();
        fieldVO.setId("field-001");
        fieldVO.setName("username");
        fieldVO.setComment("用户名");
        fieldVO.setBaseType("VARCHAR");
        fieldVO.setLength(64);
        fieldVO.setNullable(false);
        fieldVO.setPrimaryKey(false);
        fieldVO.setTypeLabel("VARCHAR(64)");
        fieldVO.setHasStandardBinding(false);

        assertEquals("username", fieldVO.getName());
        assertFalse(fieldVO.isNullable());
        assertFalse(fieldVO.isHasStandardBinding());
    }

    @Test
    void testTeamVO() {
        TeamVO teamVO = new TeamVO();
        teamVO.setId("team-001");
        teamVO.setName("核心团队");
        teamVO.setCode("core-team");
        teamVO.setDescription("核心开发团队");
        teamVO.setOwnerId("user-001");
        teamVO.setOwnerName("张三");
        teamVO.setMemberCount(10);
        teamVO.setProjectCount(5);
        teamVO.setStatus(1);

        assertEquals("core-team", teamVO.getCode());
        assertEquals(10, teamVO.getMemberCount());
        assertEquals(1, teamVO.getStatus());
    }

    @Test
    void testProjectVO() {
        ProjectVO projectVO = new ProjectVO();
        projectVO.setId("proj-001");
        projectVO.setTeamId("team-001");
        projectVO.setTeamName("核心团队");
        projectVO.setName("电商系统");
        projectVO.setCode("ecommerce");
        projectVO.setModelCount(20);
        projectVO.setStatus(1);

        assertEquals("电商系统", projectVO.getName());
        assertEquals(20, projectVO.getModelCount());
    }

    @Test
    void testDataItemVO() {
        DataItemVO dataItemVO = new DataItemVO();
        dataItemVO.setId("di-001");
        dataItemVO.setName("用户ID");
        dataItemVO.setCode("user_id");
        dataItemVO.setBaseType("VARCHAR");
        dataItemVO.setLength(36);
        dataItemVO.setDescription("用户唯一标识");
        dataItemVO.setStatus(1);

        assertEquals("user_id", dataItemVO.getCode());
        assertEquals("VARCHAR", dataItemVO.getBaseType());
    }

    @Test
    void testCodeValueGroupVO() {
        CodeValueGroupVO groupVO = new CodeValueGroupVO();
        groupVO.setId("group-001");
        groupVO.setCode("gender");
        groupVO.setName("性别");
        
        List<CodeValueGroupVO.CodeValueVO> values = new ArrayList<>();
        
        CodeValueGroupVO.CodeValueVO value1 = new CodeValueGroupVO.CodeValueVO();
        value1.setId("cv-001");
        value1.setCode("M");
        value1.setName("男");
        value1.setSortOrder(1);
        value1.setStatus(1);
        
        CodeValueGroupVO.CodeValueVO value2 = new CodeValueGroupVO.CodeValueVO();
        value2.setId("cv-002");
        value2.setCode("F");
        value2.setName("女");
        value2.setSortOrder(2);
        value2.setStatus(1);
        
        values.add(value1);
        values.add(value2);
        groupVO.setValues(values);

        assertEquals(2, groupVO.getValues().size());
        assertEquals("M", groupVO.getValues().get(0).getCode());
    }

    @Test
    void testWorkflowDefinitionVO() {
        WorkflowDefinitionVO defVO = new WorkflowDefinitionVO();
        defVO.setId("def-001");
        defVO.setName("模型发布审批");
        defVO.setCategory("modeling");
        defVO.setProcessKey("model_publish");
        defVO.setVersion(1);
        defVO.setStatus(1);
        defVO.setCreatedBy("admin");

        assertEquals("model_publish", defVO.getProcessKey());
        assertEquals(1, defVO.getVersion());
    }

    @Test
    void testWorkflowTaskVO() {
        WorkflowTaskVO taskVO = new WorkflowTaskVO();
        taskVO.setId("task-001");
        taskVO.setProcessInstanceId("proc-001");
        taskVO.setTaskId("task-def-001");
        taskVO.setTaskName("审批任务");
        taskVO.setAssignee("user-001");
        taskVO.setPriority(2);
        taskVO.setStatus(0);

        assertEquals("审批任务", taskVO.getTaskName());
        assertEquals(0, taskVO.getStatus()); // 待处理
    }

    @Test
    void testApiDefinitionVO() {
        ApiDefinitionVO apiVO = new ApiDefinitionVO();
        apiVO.setId("api-001");
        apiVO.setName("获取模型列表");
        apiVO.setPath("/api/v1/models");
        apiVO.setMethod("GET");
        apiVO.setCategory("modeling");
        apiVO.setDescription("获取所有模型列表");
        apiVO.setStatus(1);
        apiVO.setCallCount(1000L);

        assertEquals("GET", apiVO.getMethod());
        assertEquals(1, apiVO.getStatus());
        assertEquals(1000L, apiVO.getCallCount());
    }
}
