package com.datadictmanage.modeling.application.service;

import com.datadictmanage.modeling.application.dto.*;
import com.datadictmanage.modeling.domain.team.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * TeamFacade — 团队上下文应用服务门面
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TeamFacade {

    private final TeamRepository teamRepository;
    private final ProjectRepository projectRepository;
    private final TeamMemberRepository teamMemberRepository;

    // ==================== Team 团队 ====================

    /**
     * 创建团队
     */
    @Transactional
    public TeamBO createTeam(CreateTeamDTO dto, String operatorId) {
        TeamBO team = TeamBO.builder()
                .id(UUID.randomUUID().toString())
                .name(dto.getName())
                .description(dto.getDescription() != null ? dto.getDescription() : "")
                .ownerId(dto.getOwnerId() != null ? dto.getOwnerId() : operatorId)
                .status(1)
                .createdBy(operatorId)
                .build();

        teamRepository.save(team);

        // 创建者自动成为所有者
        addMember(team.getId(), team.getOwnerId(), dto.getOwnerName(), null, TeamMemberBO.ROLE_OWNER, operatorId);

        log.info("创建团队成功: {}, owner: {}", team.getName(), team.getOwnerId());
        return team;
    }

    /**
     * 获取团队详情
     */
    public TeamBO getTeam(String id) {
        TeamBO team = teamRepository.findById(id);
        if (team != null) {
            // 加载成员列表
            List<TeamMemberBO> members = teamMemberRepository.findByTeamId(id);
            team.setMembers(members);
        }
        return team;
    }

    /**
     * 获取用户所属团队
     */
    public List<TeamBO> getUserTeams(String userId) {
        return teamRepository.findByMemberId(userId);
    }

    /**
     * 更新团队
     */
    @Transactional
    public TeamBO updateTeam(String id, CreateTeamDTO dto, String operatorId) {
        TeamBO team = teamRepository.findById(id);
        if (team == null) {
            throw new RuntimeException("团队不存在: " + id);
        }

        if (dto.getName() != null) team.setName(dto.getName());
        if (dto.getDescription() != null) team.setDescription(dto.getDescription());

        teamRepository.save(team);
        log.info("更新团队成功: {}", id);
        return team;
    }

    /**
     * 删除团队
     */
    @Transactional
    public void deleteTeam(String id, String operatorId) {
        teamRepository.delete(id);
        log.info("删除团队成功: {}", id);
    }

    // ==================== Project 项目 ====================

    /**
     * 创建项目
     */
    @Transactional
    public ProjectBO createProject(CreateProjectDTO dto, String operatorId) {
        ProjectBO project = ProjectBO.builder()
                .id(UUID.randomUUID().toString())
                .teamId(dto.getTeamId())
                .name(dto.getName())
                .description(dto.getDescription() != null ? dto.getDescription() : "")
                .icon(dto.getIcon())
                .status(1)
                .createdBy(operatorId)
                .build();

        projectRepository.save(project);
        log.info("创建项目成功: {}, team: {}", project.getName(), dto.getTeamId());
        return project;
    }

    /**
     * 获取项目详情
     */
    public ProjectBO getProject(String id) {
        return projectRepository.findById(id);
    }

    /**
     * 获取团队下的项目列表
     */
    public List<ProjectBO> getTeamProjects(String teamId) {
        return projectRepository.findByTeamId(teamId);
    }

    /**
     * 删除项目
     */
    @Transactional
    public void deleteProject(String id) {
        projectRepository.delete(id);
        log.info("删除项目成功: {}", id);
    }

    // ==================== TeamMember 团队成员 ====================

    /**
     * 添加团队成员
     */
    @Transactional
    public TeamMemberBO addMember(String teamId, String userId, String userName, String userEmail, String role, String operatorId) {
        // 检查是否已存在
        TeamMemberBO existing = teamMemberRepository.findByTeamIdAndUserId(teamId, userId);
        if (existing != null) {
            throw new RuntimeException("用户已是团队成员");
        }

        TeamMemberBO member = TeamMemberBO.builder()
                .id(UUID.randomUUID().toString())
                .teamId(teamId)
                .userId(userId)
                .userName(userName)
                .userEmail(userEmail)
                .role(role)
                .status("ACTIVE")
                .build();

        teamMemberRepository.save(member);
        log.info("添加团队成员成功: {} -> {}", userId, teamId);
        return member;
    }

    /**
     * 移除团队成员
     */
    @Transactional
    public void removeMember(String teamId, String userId) {
        // 不能移除所有者
        TeamMemberBO member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId);
        if (member != null && TeamMemberBO.ROLE_OWNER.equals(member.getRole())) {
            throw new RuntimeException("不能移除团队所有者");
        }

        teamMemberRepository.deleteByTeamIdAndUserId(teamId, userId);
        log.info("移除团队成员成功: {} <- {}", userId, teamId);
    }

    /**
     * 获取团队成员列表
     */
    public List<TeamMemberBO> getMembers(String teamId) {
        return teamMemberRepository.findByTeamId(teamId);
    }

    /**
     * 更新成员角色
     */
    @Transactional
    public TeamMemberBO updateMemberRole(String teamId, String userId, String newRole, String operatorId) {
        TeamMemberBO member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId);
        if (member == null) {
            throw new RuntimeException("成员不存在");
        }

        // 不能修改所有者角色
        if (TeamMemberBO.ROLE_OWNER.equals(member.getRole())) {
            throw new RuntimeException("不能修改所有者角色");
        }

        member.setRole(newRole);
        teamMemberRepository.save(member);
        log.info("更新成员角色成功: {} -> {}", userId, newRole);
        return member;
    }
}
