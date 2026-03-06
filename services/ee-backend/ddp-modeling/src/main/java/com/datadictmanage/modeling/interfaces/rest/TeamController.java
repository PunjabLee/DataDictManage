package com.datadictmanage.modeling.interfaces.rest;

import com.datadictmanage.common.result.R;
import com.datadictmanage.modeling.application.dto.CreateTeamDTO;
import com.datadictmanage.modeling.application.service.TeamFacade;
import com.datadictmanage.modeling.domain.team.TeamBO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * TeamController — 团队 REST 接口
 */
@Slf4j
@Tag(name = "团队管理", description = "团队 CRUD")
@RestController
@RequestMapping("/modeling/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamFacade teamFacade;

    @Operation(summary = "创建团队")
    @PostMapping
    public R<TeamBO> create(
            @Valid @RequestBody CreateTeamDTO dto,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(teamFacade.createTeam(dto, operatorId));
    }

    @Operation(summary = "获取团队详情")
    @GetMapping("/{id}")
    public R<TeamBO> get(@PathVariable String id) {
        return R.ok(teamFacade.getTeam(id));
    }

    @Operation(summary = "获取用户所属团队")
    @GetMapping("/user/{userId}")
    public R<List<TeamBO>> getUserTeams(@PathVariable String userId) {
        return R.ok(teamFacade.getUserTeams(userId));
    }

    @Operation(summary = "更新团队")
    @PutMapping("/{id}")
    public R<TeamBO> update(
            @PathVariable String id,
            @Valid @RequestBody CreateTeamDTO dto,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(teamFacade.updateTeam(id, dto, operatorId));
    }

    @Operation(summary = "删除团队")
    @DeleteMapping("/{id}")
    public R<Void> delete(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        teamFacade.deleteTeam(id, operatorId);
        return R.ok();
    }
}
