package com.datadictmanage.modeling.interfaces.rest;

import com.datadictmanage.common.result.R;
import com.datadictmanage.modeling.application.dto.AddTeamMemberDTO;
import com.datadictmanage.modeling.application.service.TeamFacade;
import com.datadictmanage.modeling.domain.team.TeamMemberBO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * TeamMemberController — 团队成员 REST 接口
 */
@Slf4j
@Tag(name = "团队成员管理", description = "团队成员 CRUD")
@RestController
@RequestMapping("/modeling/teams/{teamId}/members")
@RequiredArgsConstructor
public class TeamMemberController {

    private final TeamFacade teamFacade;

    @Operation(summary = "添加团队成员")
    @PostMapping
    public R<TeamMemberBO> addMember(
            @PathVariable String teamId,
            @Valid @RequestBody AddTeamMemberDTO dto,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(teamFacade.addMember(teamId, dto.getUserId(), dto.getUserName(), dto.getUserEmail(), dto.getRole(), operatorId));
    }

    @Operation(summary = "获取团队成员列表")
    @GetMapping
    public R<List<TeamMemberBO>> listMembers(@PathVariable String teamId) {
        return R.ok(teamFacade.getMembers(teamId));
    }

    @Operation(summary = "移除团队成员")
    @DeleteMapping("/{userId}")
    public R<Void> removeMember(
            @PathVariable String teamId,
            @PathVariable String userId
    ) {
        teamFacade.removeMember(teamId, userId);
        return R.ok();
    }

    @Operation(summary = "更新成员角色")
    @PutMapping("/{userId}/role")
    public R<TeamMemberBO> updateRole(
            @PathVariable String teamId,
            @PathVariable String userId,
            @RequestParam String role,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String operatorId
    ) {
        return R.ok(teamFacade.updateMemberRole(teamId, userId, role, operatorId));
    }
}
