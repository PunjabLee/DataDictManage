package com.datadictmanage.modeling.domain.team;

import java.util.List;

/**
 * TeamRepository — 团队仓储接口
 */
public interface TeamRepository {

    TeamBO findById(String id);

    TeamBO findByOwnerId(String ownerId);

    List<TeamBO> findByMemberId(String userId);

    List<TeamBO> findAll();

    void save(TeamBO bo);

    void delete(String id);
}
