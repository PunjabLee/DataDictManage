package com.datadictmanage.modeling.infrastructure.persistence.team;

import com.datadictmanage.modeling.domain.team.TeamBO;
import com.datadictmanage.modeling.domain.team.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.stream.Collectors;

/**
 * TeamRepositoryImpl — 团队仓储实现
 */
@Repository
@RequiredArgsConstructor
public class TeamRepositoryImpl implements TeamRepository {

    private final TeamMapper teamMapper;

    @Override
    public TeamBO findById(String id) {
        TeamPO po = teamMapper.selectById(id);
        return po != null ? toBO(po) : null;
    }

    @Override
    public TeamBO findByOwnerId(String ownerId) {
        return null; // TODO: 实现
    }

    @Override
    public List<TeamBO> findByMemberId(String userId) {
        return null; // TODO: 通过成员表查询
    }

    @Override
    public List<TeamBO> findAll() {
        return teamMapper.selectList(null).stream()
                .map(this::toBO)
                .collect(Collectors.toList());
    }

    @Override
    public void save(TeamBO bo) {
        TeamPO po = toPO(bo);
        if (teamMapper.selectById(bo.getId()) != null) {
            teamMapper.updateById(po);
        } else {
            teamMapper.insert(po);
        }
    }

    @Override
    public void delete(String id) {
        teamMapper.deleteById(id);
    }

    private TeamBO toBO(TeamPO po) {
        return TeamBO.builder()
                .id(po.getId())
                .name(po.getName())
                .description(po.getDescription())
                .ownerId(po.getOwnerId())
                .status(po.getStatus())
                .createdBy(po.getCreatedAt() != null ? po.getCreatedAt().toString() : null)
                .createdAt(po.getCreatedAt())
                .updatedAt(po.getUpdatedAt())
                .build();
    }

    private TeamPO toPO(TeamBO bo) {
        TeamPO po = new TeamPO();
        po.setId(bo.getId());
        po.setName(bo.getName());
        po.setDescription(bo.getDescription());
        po.setOwnerId(bo.getOwnerId());
        po.setStatus(bo.getStatus());
        return po;
    }
}
