package com.datadictmanage.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * LoginDTO — 登录入参
 * @layer Application Layer (接入层 DTO)
 */
@Data
public class LoginDTO {

    /** 用户名 */
    @NotBlank(message = "用户名不能为空")
    private String username;

    /** 密码（传输时建议 Base64 编码，服务端解码后验证） */
    @NotBlank(message = "密码不能为空")
    private String password;

    /** 验证码（可选，启用人机验证时必填） */
    private String captchaCode;

    /** 验证码 Key（Redis Key） */
    private String captchaKey;
}
