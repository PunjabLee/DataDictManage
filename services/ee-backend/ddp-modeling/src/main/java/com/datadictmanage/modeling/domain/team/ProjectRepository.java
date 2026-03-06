package com.datadictmanage.modeling.domain.team;

import java.util.List;

/**
 * ProjectRepository — 项目仓储接口
 */
public interface ProjectRepository {

    ProjectBO findById(String id);

    List<ProjectBO> findByTeamId(String teamId);

    List<ProjectBO> findByMemberId(String userId);

    List<ProjectBO> findAll();

    void save(ProjectBO bo);

    void delete(String id);
}
