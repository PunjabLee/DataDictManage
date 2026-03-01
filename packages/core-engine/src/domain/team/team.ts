/**
 * @file team.ts
 * @description 团队（Team）聚合根 — 团队上下文（Team Bounded Context）
 * @layer Domain Layer — domain/team
 *
 * 职责：
 *   管理用户在平台内的团队组织结构。
 *   团队是权限控制和资源共享的基本单元。
 *   一个团队可以有多个项目，成员有不同角色（Owner/Admin/Member/Viewer）。
 *
 * @pattern GoF: Factory Method（Team.create）
 *           Template Method（成员角色变更流程）
 *
 * @module @ddm/core-engine
 */

import { AggregateRoot, UniqueId, ValueObject, Result } from '../../shared/base'
import { TeamId, UserId } from '../model/model-types'

// ── 成员角色枚举 ──────────────────────────────────────────────────────────

/**
 * 团队成员角色
 * - OWNER: 创建者，最高权限，不可删除，不可转让（通过 transferOwnership 操作）
 * - ADMIN: 管理员，可管理成员和项目
 * - MEMBER: 普通成员，可创建和编辑模型
 * - VIEWER: 只读成员，只能查看
 */
export enum TeamRole {
  OWNER  = 'OWNER',
  ADMIN  = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

// ── 团队成员值对象 ────────────────────────────────────────────────────────

/**
 * TeamMember（团队成员）— 值对象
 * 成员只是用户 ID + 角色的组合，无独立生命周期
 */
export class TeamMember extends ValueObject<{
  userId: UserId
  role: TeamRole
  joinedAt: Date
  invitedBy: string
}> {
  get userId(): UserId { return this.props.userId }
  get role(): TeamRole { return this.props.role }
  get joinedAt(): Date { return this.props.joinedAt }
  get invitedBy(): string { return this.props.invitedBy }

  static create(userId: UserId, role: TeamRole, invitedBy: string): TeamMember {
    return new TeamMember({ userId, role, joinedAt: new Date(), invitedBy })
  }

  /**
   * 更改角色（返回新成员对象，值对象不可变）
   */
  withRole(newRole: TeamRole): TeamMember {
    return new TeamMember({ ...this.props, role: newRole })
  }

  isOwner(): boolean { return this.props.role === TeamRole.OWNER }
  isAdmin(): boolean { return this.props.role === TeamRole.ADMIN || this.isOwner() }
  canEdit(): boolean { return this.props.role !== TeamRole.VIEWER }
}

// ── 团队聚合根 ────────────────────────────────────────────────────────────

/**
 * Team（团队）— 聚合根
 *
 * 不变量：
 *  - 每个团队有且仅有一个 OWNER
 *  - 同一用户在同一团队内只有一个角色
 *  - 不能移除 OWNER（需先转让 Owner 权限）
 */
export class Team extends AggregateRoot<TeamId> {
  private _id: TeamId
  private _name: string
  private _description: string
  private _avatarUrl: string
  /** 成员集合（key: userId.value） */
  private _members: Map<string, TeamMember>
  private _createdAt: Date
  private _updatedAt: Date

  private constructor(
    id: TeamId,
    name: string,
    description: string,
    ownerUserId: UserId,
  ) {
    super()
    this._id = id
    this._name = name
    this._description = description
    this._avatarUrl = ''
    this._members = new Map()
    this._createdAt = new Date()
    this._updatedAt = new Date()

    // 自动将创建者设置为 OWNER
    const owner = TeamMember.create(ownerUserId, TeamRole.OWNER, ownerUserId.value)
    this._members.set(ownerUserId.value, owner)
  }

  // ── 工厂方法 ────────────────────────────────────────────────────────────

  static create(params: {
    name: string
    ownerUserId: string
    description?: string
  }): Result<Team> {
    if (!params.name?.trim()) return Result.fail('团队名称不能为空')
    if (params.name.length > 64) return Result.fail('团队名称不能超过 64 个字符')
    if (!params.ownerUserId) return Result.fail('Owner 用户 ID 不能为空')

    const team = new Team(
      TeamId.create(),
      params.name.trim(),
      params.description ?? '',
      UserId.create(params.ownerUserId),
    )
    return Result.ok(team)
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  get id(): TeamId { return this._id }
  get name(): string { return this._name }
  get description(): string { return this._description }
  get avatarUrl(): string { return this._avatarUrl }
  get members(): TeamMember[] { return Array.from(this._members.values()) }
  get createdAt(): Date { return this._createdAt }
  get updatedAt(): Date { return this._updatedAt }

  /**
   * 获取团队 Owner
   */
  get owner(): TeamMember {
    const owner = Array.from(this._members.values()).find(m => m.isOwner())
    if (!owner) throw new Error('团队数据损坏：没有找到 Owner')
    return owner
  }

  // ── 领域行为 ─────────────────────────────────────────────────────────────

  /**
   * 邀请成员加入团队
   */
  inviteMember(targetUserId: string, role: TeamRole, inviterUserId: string): Result<void> {
    if (role === TeamRole.OWNER) return Result.fail('不能通过邀请设置 Owner 角色')

    const inviter = this._members.get(inviterUserId)
    if (!inviter || !inviter.isAdmin()) return Result.fail('只有管理员才能邀请成员')

    if (this._members.has(targetUserId)) return Result.fail('该用户已经是团队成员')

    const member = TeamMember.create(UserId.create(targetUserId), role, inviterUserId)
    this._members.set(targetUserId, member)
    this._updatedAt = new Date()
    return Result.ok()
  }

  /**
   * 移除成员
   */
  removeMember(targetUserId: string, operatorUserId: string): Result<void> {
    const target = this._members.get(targetUserId)
    if (!target) return Result.fail('该用户不是团队成员')
    if (target.isOwner()) return Result.fail('不能移除团队 Owner，请先转让 Owner 权限')

    const operator = this._members.get(operatorUserId)
    if (!operator || !operator.isAdmin()) return Result.fail('只有管理员才能移除成员')

    this._members.delete(targetUserId)
    this._updatedAt = new Date()
    return Result.ok()
  }

  /**
   * 修改成员角色
   */
  changeMemberRole(targetUserId: string, newRole: TeamRole, operatorUserId: string): Result<void> {
    if (newRole === TeamRole.OWNER) return Result.fail('不能直接设置 Owner 角色，请使用 transferOwnership')

    const operator = this._members.get(operatorUserId)
    if (!operator || !operator.isAdmin()) return Result.fail('只有管理员才能修改成员角色')

    const target = this._members.get(targetUserId)
    if (!target) return Result.fail('该用户不是团队成员')
    if (target.isOwner()) return Result.fail('不能修改 Owner 的角色')

    this._members.set(targetUserId, target.withRole(newRole))
    this._updatedAt = new Date()
    return Result.ok()
  }

  /**
   * 转让 Owner 权限
   */
  transferOwnership(newOwnerUserId: string, currentOwnerUserId: string): Result<void> {
    const currentOwner = this._members.get(currentOwnerUserId)
    if (!currentOwner || !currentOwner.isOwner()) return Result.fail('只有当前 Owner 才能转让权限')

    const newOwner = this._members.get(newOwnerUserId)
    if (!newOwner) return Result.fail('新 Owner 必须已是团队成员')

    // 原 Owner 降为 Admin
    this._members.set(currentOwnerUserId, currentOwner.withRole(TeamRole.ADMIN))
    // 新成员升为 Owner
    this._members.set(newOwnerUserId, newOwner.withRole(TeamRole.OWNER))
    this._updatedAt = new Date()
    return Result.ok()
  }

  /**
   * 更新团队信息
   */
  update(params: { name?: string; description?: string; avatarUrl?: string }): Result<void> {
    if (params.name !== undefined) {
      if (!params.name.trim()) return Result.fail('团队名称不能为空')
      this._name = params.name.trim()
    }
    if (params.description !== undefined) this._description = params.description
    if (params.avatarUrl !== undefined) this._avatarUrl = params.avatarUrl
    this._updatedAt = new Date()
    return Result.ok()
  }

  /**
   * 查询某用户在团队中的角色
   */
  getMemberRole(userId: string): TeamRole | null {
    return this._members.get(userId)?.role ?? null
  }

  /**
   * 检查用户是否有编辑权限
   */
  canUserEdit(userId: string): boolean {
    return this._members.get(userId)?.canEdit() ?? false
  }
}

/**
 * 团队仓储接口
 */
export interface TeamRepository {
  findById(id: TeamId): Promise<Team | null>
  findByMember(userId: UserId): Promise<Team[]>
  save(team: Team): Promise<void>
  delete(id: TeamId): Promise<void>
}
