package com.datadictmanage.common.result;

import lombok.Data;

/**
 * R — 统一 API 响应体
 *
 * 职责：
 *   所有 REST 接口的统一响应包装，避免各接口返回格式不一致。
 *   前端按 code === 0 判断成功，code !== 0 时展示 message。
 *
 * @param <T> 响应数据类型
 *
 * @pattern GoF: Factory Method（ok/fail 静态工厂方法）
 * @layer Common Layer
 */
@Data
public class R<T> {

    /** 状态码：0 成功，非 0 失败 */
    private int code;

    /** 提示消息 */
    private String message;

    /** 响应数据 */
    private T data;

    /** 时间戳（毫秒） */
    private long timestamp;

    private R() {
        this.timestamp = System.currentTimeMillis();
    }

    /**
     * 成功响应（有数据）
     *
     * @param data 响应数据
     * @return R<T>
     */
    public static <T> R<T> ok(T data) {
        R<T> r = new R<>();
        r.code = 0;
        r.message = "success";
        r.data = data;
        return r;
    }

    /**
     * 成功响应（无数据）
     */
    public static <T> R<T> ok() {
        return ok(null);
    }

    /**
     * 失败响应
     *
     * @param code    业务错误码
     * @param message 错误描述
     */
    public static <T> R<T> fail(int code, String message) {
        R<T> r = new R<>();
        r.code = code;
        r.message = message;
        return r;
    }

    /**
     * 失败响应（使用通用错误码 -1）
     */
    public static <T> R<T> fail(String message) {
        return fail(-1, message);
    }

    /**
     * 判断是否成功
     */
    public boolean isSuccess() {
        return this.code == 0;
    }
}
