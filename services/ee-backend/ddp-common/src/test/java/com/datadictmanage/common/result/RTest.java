package com.datadictmanage.common.result;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * R 统一响应单元测试
 */
class RTest {

    @Test
    void testOkWithData() {
        R<String> result = R.ok("Hello World");
        
        assertEquals(0, result.getCode());
        assertEquals("success", result.getMessage());
        assertEquals("Hello World", result.getData());
        assertTrue(result.isSuccess());
    }

    @Test
    void testOkWithoutData() {
        R<Void> result = R.ok();
        
        assertEquals(0, result.getCode());
        assertEquals("success", result.getMessage());
        assertNull(result.getData());
        assertTrue(result.isSuccess());
    }

    @Test
    void testFailWithCodeAndMessage() {
        R<String> result = R.fail(40001, "参数校验失败");
        
        assertEquals(40001, result.getCode());
        assertEquals("参数校验失败", result.getMessage());
        assertFalse(result.isSuccess());
    }

    @Test
    void testFailWithMessage() {
        R<String> result = R.fail("操作失败");
        
        assertEquals(-1, result.getCode());
        assertEquals("操作失败", result.getMessage());
        assertFalse(result.isSuccess());
    }

    @Test
    void testTimestamp() {
        long before = System.currentTimeMillis();
        R<Void> result = R.ok();
        long after = System.currentTimeMillis();
        
        assertTrue(result.getTimestamp() >= before);
        assertTrue(result.getTimestamp() <= after);
    }

    @Test
    void testGenericTypes() {
        R<Integer> intResult = R.ok(42);
        assertEquals(42, intResult.getData());

        R<Long> longResult = R.ok(100L);
        assertEquals(100L, longResult.getData());

        R<Object> objResult = R.ok(new Object());
        assertNotNull(objResult.getData());
    }
}
