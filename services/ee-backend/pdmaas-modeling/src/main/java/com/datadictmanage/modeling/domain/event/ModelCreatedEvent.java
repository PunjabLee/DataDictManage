package com.datadictmanage.modeling.domain.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.time.LocalDateTime;

/**
 * ModelCreatedEvent — 模型创建领域事件
 *
 * 职责：
 *   当 Model 聚合根被成功创建时，发布此事件。
 *   事件订阅方（EventHandler）可执行副作用：
 *   - 更新搜索索引（Elasticsearch）
 *   - 发送审计日志
 *   - 向 MQ 发布跨服务事件（如通知项目服务更新模型计数）
 *
 * @layer Domain Layer — domain/event
 * @pattern GoF: Observer Pattern（Spring 的 ApplicationEvent 是 Observer 机制）
 */
@Getter
public class ModelCreatedEvent extends ApplicationEvent {

    /** 模型 ID */
    private final String modelId;

    /** 项目 ID */
    private final String projectId;

    /** 模型名称 */
    private final String modelName;

    /** 操作人 ID */
    private final String operatorId;

    /** 事件发生时间 */
    private final LocalDateTime occurredAt;

    /**
     * @param source     事件源（通常为发布事件的 Service）
     * @param modelId    新建模型的 ID
     * @param projectId  所属项目 ID
     * @param modelName  模型名称
     * @param operatorId 创建人
     */
    public ModelCreatedEvent(
        Object source,
        String modelId,
        String projectId,
        String modelName,
        String operatorId
    ) {
        super(source);
        this.modelId = modelId;
        this.projectId = projectId;
        this.modelName = modelName;
        this.operatorId = operatorId;
        this.occurredAt = LocalDateTime.now();
    }
}
