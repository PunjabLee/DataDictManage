# 技术债务备忘录 (Technical Debt Memo)

> 记录项目中的技术债务，便于后续优化

---

## 记录日期
2026-03-03

---

## 待处理技术债务

### 🔴 高优先级

| 序号 | 标题 | 描述 | 模块 | 预计工时 |
|------|------|------|------|----------|
| TD-01 | DDL 生成对接 | generateDDL 需实际调用 db-dialect 模块 | desktop-ce | 2h |
| TD-02 | 快捷键系统缺失 | 缺少键盘快捷键支持 (Ctrl+Z/Y, Delete 等) | desktop-ce | 1h |
| TD-03 | 模型持久化 | localStorage + IPC 存取未完整实现 | desktop-ce | 2h |
| TD-04 | 版本管理后端 | 快照创建/回滚 API 未实现 | ee-backend | 3h |
| TD-05 | ModelAssembler 完善 | EntityBO/FieldBO → DTO 映射不完整 | ee-backend | 1h |
| TD-06 | ModelRepositoryImpl | MyBatis 实现类缺失 | ee-backend | 4h |

### 🟡 中优先级

| 序号 | 标题 | 描述 | 模块 | 预计工时 |
|------|------|------|------|----------|
| TD-07 | 错误目录清理 | 存在 `{packages` 错误目录 | 项目根目录 | 0.5h |
| TD-08 | 命名统一 | pdmaas-* 需统一为 ddp-* | ee-backend | 1h |
| TD-09 | 多人实时编辑 | Yjs CRDT 集成未实现 | canvas-render | 8h |
| TD-10 | 权限系统 | 团队/项目/模型三级权限 | ee-backend | 6h |
| TD-11 | Web 版骨架 | qiankun 微前端框架 | web-ee | 8h |
| TD-12 | 数据标准 API | DataItem/CodeValue CRUD | ee-backend | 4h |

### 🟢 低优先级 (文档/注释)

| 序号 | 标题 | 描述 | 模块 | 预计工时 |
|------|------|------|------|----------|
| TD-13 | API 文档 | 缺少请求/响应示例 | docs | 2h |
| TD-14 | 代码注释 | 部分 Java 类缺少 Javadoc | ee-backend | 3h |
| TD-15 | 开发指南 | 新增功能使用说明 | docs | 1h |
| TD-16 | 单元测试 | 核心模块测试覆盖不足 | 全局 | 8h |

---

## 已完成技术债务

| 序号 | 标题 | 解决日期 | 备注 |
|------|------|----------|------|
| - | - | - | - |

---

## 技术债务治理原则

1. **预防优于修复** — 新功能开发时优先解决相关技术债务
2. **定期回顾** — 每两周进行一次技术债务评审
3. **小步迭代** — 单次迭代不积累超过 8h 的技术债务
4. **文档记录** — 所有技术债务必须记录在案

---

## 触发技术债务警报的条件

- 单个接口响应时间 > 500ms
- 测试覆盖率 < 60%
- 代码重复率 > 10%
- 构建时间 > 5min

---

*由 小jeep 🟣 创建 | DataDictManage Team*
