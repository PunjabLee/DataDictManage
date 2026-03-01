# Git 分支工作流规范

## 分支策略（Git Flow 变体）

```
main          ──────●──────────────────────●────────────────▶ 生产分支（只接受 PR）
                   /                        ↑
develop       ─●──●───●───●───●────────────●────────────────▶ 集成分支
              /      \   /     \
feature/*  ─●──●──●──●         ●──●──●──● ──▶ 功能分支（每个 Sprint 任务）
                                           
hotfix/*   (从 main 创建，修复后合并到 main 和 develop)
```

---

## 分支命名规范

| 类型 | 命名格式 | 示例 |
|------|---------|------|
| 功能 | `feature/<sprint>-<task>` | `feature/S01-core-engine-setup` |
| 修复 | `fix/<issue-id>-<desc>` | `fix/101-model-delete-bug` |
| 热修复 | `hotfix/<version>-<desc>` | `hotfix/v1.0.1-auth-crash` |
| 发布 | `release/<version>` | `release/v1.0.0` |
| 文档 | `docs/<desc>` | `docs/api-update` |

---

## Commit 消息规范（Conventional Commits）

```
<type>(<scope>): <subject>

[body]

[footer]
```

**type 说明：**

| type | 含义 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `refactor` | 重构（不改变功能） |
| `docs` | 文档更新 |
| `test` | 测试相关 |
| `chore` | 构建/工具/依赖更新 |
| `perf` | 性能优化 |
| `style` | 代码格式（不影响逻辑） |

**scope 建议：**
- `core-engine`, `canvas-render`, `db-dialect`, `desktop-ce`
- `modeling`, `standard`, `team`, `auth`, `gateway`

**示例：**
```
feat(core-engine): add ModelFactory for DDD aggregate reconstitution

- Add ModelFactory.reconstitute() for repository layer use
- Add EntityFactory and EntityReconstituter helpers
- Follow GoF Factory Method pattern

Sprint: S02 | Task: DDM-045
```

---

## Pull Request 规范

1. PR 标题遵循 Commit 规范
2. PR 描述包含：
   - 改动内容
   - 测试方法
   - 相关 Issue/Task 编号
3. 至少 1 人 Code Review 通过后合并
4. 合并方式：`Squash and Merge`（保持主分支历史整洁）
5. 合并后删除功能分支

---

## Sprint 节奏

| Sprint | 周期 | 目标 |
|--------|------|------|
| S01 | W1-W2 | Monorepo 框架搭建 + 基础 DDD 模型 |
| S02 | W3-W4 | core-engine 完整领域层 |
| S03 | W5-W6 | canvas-render 渲染引擎 |
| S04 | W7-W8 | desktop-ce 桌面端 MVP |
| S05 | W9-W10 | EE 后端骨架 + API 联调 |
| S06 | W11-W12 | 数据标准管理模块 |
