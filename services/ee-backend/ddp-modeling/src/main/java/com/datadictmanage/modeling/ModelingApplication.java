package com.datadictmanage.modeling;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

/**
 * ModelingApplication — 建模微服务启动类
 *
 * 微服务职责：
 *   - 数据模型（Model/Entity/Field）的 CRUD 管理
 *   - DDL 生成（支持 MySQL/PG/Oracle/达梦/金仓）
 *   - 模型版本快照（Git-like 分支管理）
 *   - 模型 Diff（两个版本间的结构差异分析）
 *   - 数据标准合规检查（字段是否绑定了数据标准）
 *
 * DDD 分层说明：
 *   接入层（interfaces）: REST Controller + VO
 *   应用层（application）: Facade Service + DTO + Assembler
 *   领域层（domain）: BO + Repository接口 + Domain Service + 领域事件
 *   基础设施层（infrastructure）: PO + Mapper + Repository实现 + ACL
 *
 * @layer Infrastructure Layer (启动入口)
 */
@SpringBootApplication
@MapperScan("com.datadictmanage.modeling.infrastructure.persistence.mapper")
public class ModelingApplication {

    public static void main(String[] args) {
        SpringApplication.run(ModelingApplication.class, args);
    }
}
