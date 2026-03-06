package com.datadictmanage.common.exception;

import lombok.Getter;

/**
 * BizException — 业务异常基类
 *
 * 职责：
 *   封装业务层抛出的可预期异常（与系统异常区分）。
 *   包含业务错误码和描述信息，由 GlobalExceptionHandler 统一捕获。
 *
 * @layer Common Layer
 */
@Getter
public class BizException extends RuntimeException {

    /** 业务错误码 */
    private final int code;

    public BizException(int code, String message) {
        super(message);
        this.code = code;
    }

    public BizException(String message) {
        this(40000, message);
    }

    // ── 预定义错误码常量 ──────────────────────────────────────────────

    /** 参数校验失败（400） */
    public static BizException invalidParam(String message) {
        return new BizException(40001, message);
    }

    /** 资源不存在（404） */
    public static BizException notFound(String resourceName, String id) {
        return new BizException(40004, resourceName + " [" + id + "] 不存在");
    }

    /** 权限不足（403） */
    public static BizException forbidden(String message) {
        return new BizException(40003, message);
    }

    /** 业务规则冲突（409） */
    public static BizException conflict(String message) {
        return new BizException(40009, message);
    }
}
