package com.datadictmanage.modeling.domain.team;

import java.util.List;

/**
 * TeamMemberRepository — 团队成员仓储接口
 */
public interface TeamMemberRepository {

    TeamMemberBO findById(String id);

    TeamMemberBO findByTeamIdAndUserId(String teamId, String userId);

    List<TeamMemberBO> findByTeamId(String teamId);

    List<TeamMemberBO> findByUserId(String userId);

    void save(TeamMemberBO bo);

    void delete(String id);

    void deleteByTeamIdAndUserId(String teamId, String userId);
}
