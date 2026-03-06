package com.datadictmanage.modeling.infrastructure.persistence.team;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.datadictmanage.modeling.domain.team.ProjectBO;
import com.datadictmanage.modeling.domain.team.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.stream.Collectors;

/**
 * ProjectRepositoryImpl — 项目仓储实现
 */
@Repository
@RequiredArgsConstructor
public class ProjectRepositoryImpl implements ProjectRepository {

    private final ProjectMapper projectMapper;

    @Override
    public ProjectBO findById(String id) {
        ProjectPO po = projectMapper.selectById(id);
        return po != null ? toBO(po) : null;
    }

    @Override
    public List<ProjectBO> findByTeamId(String teamId) {
        LambdaQueryWrapper<ProjectPO> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ProjectPO::getTeamId, teamId);
        return projectMapper.selectList(wrapper).stream()
                .map(this::toBO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProjectBO> findByMemberId(String userId) {
        return null; // TODO: 通过成员表查询
    }

    @Override
    public List<ProjectBO> findAll() {
        return projectMapper.selectList(null).stream()
                .map(this::toBO)
                .collect(Collectors.toList());
    }

    @Override
    public void save(ProjectBO bo) {
        ProjectPO po = toPO(bo);
        if (projectMapper.selectById(bo.getId()) != null) {
            projectMapper.updateById(po);
        } else {
            projectMapper.insert(po);
        }
    }

    @Override
    public void delete(String id) {
        projectMapper.deleteById(id);
    }

    private ProjectBO toBO(ProjectPO po) {
        return ProjectBO.builder()
                .id(po.getId())
                .teamId(po.getTeamId())
                .name(po.getName())
                .description(po.getDescription())
                .icon(po.getIcon())
                .status(po.getStatus())
                .createdBy(po.getCreatedBy())
                .createdAt(po.getCreatedAt())
                .updatedAt(po.getUpdatedAt())
                .build();
    }

    private ProjectPO toPO(ProjectBO bo) {
        ProjectPO po = new ProjectPO();
        po.setId(bo.getId());
        po.setTeamId(bo.getTeamId());
        po.setName(bo.getName());
        po.setDescription(bo.getDescription());
        po.setIcon(bo.getIcon());
        po.setStatus(bo.getStatus());
        po.setCreatedBy(bo.getCreatedBy());
        return po;
    }
}
