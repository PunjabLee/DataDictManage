package com.datadictmanage.common.exception;

import com.datadictmanage.common.result.R;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

/**
 * GlobalExceptionHandler — 全局异常处理器
 *
 * 职责：
 *   捕获控制器层抛出的所有异常，统一转换为 R<Void> 响应。
 *   区分业务异常（BizException）和系统异常（Exception），
 *   避免系统堆栈信息暴露给前端。
 *
 * @layer Common Layer (接入层的横切关注点)
 * @pattern GoF: Chain of Responsibility（Spring MVC 的异常处理链）
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 处理业务异常（预期内的业务错误）
     */
    @ExceptionHandler(BizException.class)
    @ResponseStatus(HttpStatus.OK)  // HTTP 层面总是 200，业务错误通过 code 区分
    public R<Void> handleBizException(BizException e) {
        log.warn("[BizException] code={}, message={}", e.getCode(), e.getMessage());
        return R.fail(e.getCode(), e.getMessage());
    }

    /**
     * 处理参数校验失败（@Valid / @Validated 注解校验失败）
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.OK)
    public R<Void> handleValidationException(MethodArgumentNotValidException e) {
        String errors = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        log.warn("[ValidationException] {}", errors);
        return R.fail(40001, "参数校验失败: " + errors);
    }

    /**
     * 处理参数类型不匹配（如路径变量类型错误）
     */
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.OK)
    public R<Void> handleIllegalArgument(IllegalArgumentException e) {
        log.warn("[IllegalArgument] {}", e.getMessage());
        return R.fail(40001, e.getMessage());
    }

    /**
     * 处理所有未预期的系统异常（降级保护，不暴露堆栈）
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public R<Void> handleSystemException(Exception e) {
        // 系统异常打印完整堆栈到日志，但只返回通用提示给前端
        log.error("[SystemException] 未处理的系统异常", e);
        return R.fail(50000, "系统内部错误，请联系管理员");
    }
}
