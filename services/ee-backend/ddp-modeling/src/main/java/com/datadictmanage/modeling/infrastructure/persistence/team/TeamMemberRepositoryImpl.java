package com.datadictmanage.modeling.infrastructure.persistence.team;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.datadictmanage.modeling.domain.team.TeamMemberBO;
import com.datadictmanage.modeling.domain.team.TeamMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.stream.Collectors;

/**
 * TeamMemberRepositoryImpl — 团队成员仓储实现
 */
@Repository
@RequiredArgsConstructor
public class TeamMemberRepositoryImpl implements TeamMemberRepository {

    private final TeamMemberMapper teamMemberMapper;

    @Override
    public TeamMemberBO findById(String id) {
        TeamMemberPO po = teamMemberMapper.selectById(id);
        return po != null ? toBO(po) : null;
    }

    @Override
    public TeamMemberBO findByTeamIdAndUserId(String teamId, String userId) {
        LambdaQueryWrapper<TeamMemberPO> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TeamMemberPO::getTeamId, teamId)
                .eq(TeamMemberPO::getUserId, userId);
        TeamMemberPO po = teamMemberMapper.selectOne(wrapper);
        return po != null ? toBO(po) : null;
    }

    @Override
    public List<TeamMemberBO> findByTeamId(String teamId) {
        LambdaQueryWrapper<TeamMemberPO> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TeamMemberPO::getTeamId, teamId);
        return teamMemberMapper.selectList(wrapper).stream()
                .map(this::toBO)
                .collect(Collectors.toList());
    }

    @Override
    public List<TeamMemberBO> findByUserId(String userId) {
        LambdaQueryWrapper<TeamMemberPO> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TeamMemberPO::getUserId, userId);
        return teamMemberMapper.selectList(wrapper).stream()
                .map(this::toBO)
                .collect(Collectors.toList());
    }

    @Override
    public void save(TeamMemberBO bo) {
        TeamMemberPO po = toPO(bo);
        if (teamMemberMapper.selectById(bo.getId()) != null) {
            teamMemberMapper.updateById(po);
        } else {
            teamMemberMapper.insert(po);
        }
    }

    @Override
    public void delete(String id) {
        teamMemberMapper.deleteById(id);
    }

    @Override
    public void deleteByTeamIdAndUserId(String teamId, String userId) {
        LambdaQueryWrapper<TeamMemberPO> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TeamMemberPO::getTeamId, teamId)
                .eq(TeamMemberPO::getUserId, userId);
        teamMemberMapper.delete(wrapper);
    }

    private TeamMemberBO toBO(TeamMemberPO po) {
        return TeamMemberBO.builder()
                .id(po.getId())
                .teamId(po.getTeamId())
                .userId(po.getUserId())
                .role(po.getRole())
                .status(po.getStatus())
                .joinedAt(po.getJoinedAt())
                .createdAt(po.getCreatedAt())
                .build();
    }

    private TeamMemberPO toPO(TeamMemberBO bo) {
        TeamMemberPO po = new TeamMemberPO();
        po.setId(bo.getId());
        po.setTeamId(bo.getTeamId());
        po.setUserId(bo.getUserId());
        po.setRole(bo.getRole());
        po.setStatus(bo.getStatus());
        return po;
    }
}
