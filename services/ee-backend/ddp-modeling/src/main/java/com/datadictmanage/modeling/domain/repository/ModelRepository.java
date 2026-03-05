package com.datadictmanage.modeling.domain.repository;

import com.datadictmanage.modeling.domain.model.ModelBO;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * ModelRepository — 模型仓储接口
 *
 * 职责：
 *   领域层定义仓储接口（依赖倒置原则），
 *   基础设施层（ModelRepositoryImpl）实现具体的持久化逻辑。
 *   领域层只依赖此接口，不依赖 MyBatis-Plus 等框架。
 *
 * 设计原则：
 *   - 接口使用领域语言（ModelBO），不使用 PO/DO
 *   - 返回类型使用 Optional 替代 null（更安全）
 *   - 查询方法命名遵循 DDD 仓储约定（findById/save/delete）
 *
 * @layer Domain Layer — domain/repository
 * @pattern GoF: Repository Pattern
 *           依赖倒置原则（DIP）：领域层定义接口，基础设施层实现
 */
public interface ModelRepository {

    /**
     * 根据 ID 查找模型
     *
     * @param id 模型 ID
     * @return 模型领域对象，不存在时返回 Optional.empty()
     */
    Optional<ModelBO> findById(String id);

    /**
     * 根据项目 ID 查询所有模型
     *
     * @param projectId 项目 ID
     * @return 模型列表（按更新时间倒序）
     */
    List<ModelBO> findByProjectId(String projectId);

    /**
     * 根据名称查找（在项目范围内，名称唯一）
     *
     * @param projectId 项目 ID
     * @param name      模型名称
     * @return 模型（可能不存在）
     */
    Optional<ModelBO> findByProjectIdAndName(String projectId, String name);

    /**
     * 保存模型（新增或更新，使用 Upsert 语义）
     *
     * @param model 模型领域对象
     */
    void save(ModelBO model);

    /**
     * 删除模型
     *
     * @param id 模型 ID
     */
    void deleteById(String id);

    /**
     * 检查模型是否存在
     */
    boolean existsById(String id);

    /**
     * 保存模型快照（版本管理）
     *
     * @param modelId    模型 ID
     * @param branchId   分支 ID
     * @param snapshot   快照内容（JSON 字符串）
     * @param versionTag 版本标签（如 v1.0.0）
     * @return 快照 ID
     */
    String saveSnapshot(String modelId, String branchId, String snapshot, String versionTag);

    /**
     * 根据模型 ID 查询所有快照
     *
     * @param modelId 模型 ID
     * @return 快照列表（按创建时间倒序）
     */
    List<Map<String, Object>> findSnapshots(String modelId);

    /**
     * 根据快照 ID 读取快照内容
     */
    Optional<String> findSnapshot(String snapshotId);
}
