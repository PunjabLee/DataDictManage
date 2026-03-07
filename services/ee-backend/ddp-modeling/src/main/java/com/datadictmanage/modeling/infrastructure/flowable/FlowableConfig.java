package com.datadictmanage.modeling.infrastructure.flowable;

import org.flowable.engine.RepositoryService;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;
import org.flowable.engine.repository.Deployment;
import org.flowable.engine.repository.ProcessDefinition;
import org.flowable.engine.runtime.ProcessInstance;
import org.flowable.task.api.Task;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Flowable 配置类
 */
@Configuration
public class FlowableConfig {

    @Bean
    public RepositoryService repositoryService(org.flowable.engine.ProcessEngine processEngine) {
        return processEngine.getRepositoryService();
    }

    @Bean
    public RuntimeService runtimeService(org.flowable.engine.ProcessEngine processEngine) {
        return processEngine.getRuntimeService();
    }

    @Bean
    public TaskService taskService(org.flowable.engine.ProcessEngine processEngine) {
        return processEngine.getTaskService();
    }
}
