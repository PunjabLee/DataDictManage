package com.datadictmanage.modeling.interfaces.rest;

import com.datadictmanage.common.result.R;
import com.datadictmanage.modeling.application.dto.CreateProjectDTO;
import com.datadictmanage.modeling.application.service.TeamFacade;
import com.datadictmanage.modeling.domain.team.ProjectBO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ProjectController — 项目 REST 接口
 */
@Slf4j
@Tag(name = "项目管理", description = "项目 CRUD")
@RestController
@RequestMapping("/modeling/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final TeamFacade teamFacade;

    @Operation(summary = "创建项目")
    @PostMapping
    public R<ProjectBO> create(
            @Valid @RequestBody CreateProjectDTO dto,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(teamFacade.createProject(dto, operatorId));
    }

    @Operation(summary = "获取项目详情")
    @GetMapping("/{id}")
    public R<ProjectBO> get(@PathVariable String id) {
        return R.ok(teamFacade.getProject(id));
    }

    @Operation(summary = "获取团队下的项目列表")
    @GetMapping("/team/{teamId}")
    public R<List<ProjectBO>> getTeamProjects(@PathVariable String teamId) {
        return R.ok(teamFacade.getTeamProjects(teamId));
    }

    @Operation(summary = "删除项目")
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable String id) {
        teamFacade.deleteProject(id);
        return R.ok();
    }
}
