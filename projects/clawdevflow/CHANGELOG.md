# 变更日志 - ClawDevFlow

> **项目**: openclaw-evolution  
> **仓库**: https://github.com/kkCoca/openclaw-evolution  
> **维护者**: openclaw-ouyp

---

## 2026-04-08

### 专业收口（Docs & Acceptance Closure）

**提交**: `0071533`

**变更**：
- 统一验收用例编号（1~8 连续）
- 更新测试结果汇总表（覆盖 8 条）
- 更新验收报告模板（覆盖 8 条）
- 修订状态语义（重试耗尽 = TERMINATED）

**影响**：
- 文档与实现完全对齐
- 验收可执行、可签字、可留证据

---

### Auto-convergence 修复

**提交**: `9b71c91`

**变更**：
- roadmapping 3 处 clarify → reject（恢复自动收敛）
- 删除 coding 入口门禁（让缺 manifest 可自动返工）

**影响**：
- roadmapping 缺 ROADMAP.md → reject → 自动返工
- coding 缺 manifest → reject → 自动返工补齐

**代码统计**：
- review-orchestrator.js: +15 行（3 处 clarify → reject）
- workflow-orchestrator.js: -40 行（删除 coding 入口门禁）
- 净变化：-25 行（精简代码）

---

### GAP 修复（GAP-1/GAP-2）

**提交**: `2989d01`

**变更**：
- GAP-1: CHANGESET 模板写入真实 test 命令
- GAP-2: coding 阶段增加入口门禁

**影响**：
- CHANGESET.md 包含真实 test 命令（非占位符）
- coding 入口门禁校验 manifest 存在 + commands.test 存在

**代码统计**：
- stage-executor.js: +20 行
- workflow-orchestrator.js: +30 行
- 总计：+50 行

---

### Coding Gates 实现

**提交**: `225bae1`

**变更**：
- 引入 PROJECT_MANIFEST.json（项目自描述）
- coding 纳入自动返工循环
- 实现 Gate C0-C5（真执行命令）
- CHANGESET.md 强制生成

**影响**：
- 质量可控（真执行 test/lint/build）
- 可收敛自动返工

**代码统计**：
- workflow-orchestrator.js: +10 行
- review-orchestrator.js: +100 行
- stage-executor.js: +40 行
- state-manager.js: +5 行
- 新增文档：2 个
- 总计：+155 行代码

---

## 2026-04-07

### Stage Sign-off Hardening

**提交**: `8a179f8` + `c047e29`

**变更**：
- TODO-1: 禁止 while-loop 默认 success
- TODO-2: 新增 BLOCKED 状态
- TODO-3: Gate 失败/clarify 改用 BLOCKED
- TODO-4: 写回 lastBlockingIssues
- TODO-5: resume() 初始化 StageExecutor

**影响**：
- 状态语义清晰（BLOCKED vs TERMINATED）
- 断点恢复时 Gate#2 仍生效

---

### P0 问题修复

**提交**: `705b5b2` + `7284e93`

**变更**：
- P0#1: retryCount 重复自增修复
- P0#2: Gate#2 缺失修复
- P0#3: clarify/conditional 语义修复

**影响**：
- retryCount 每次只 +1（不会提前耗尽）
- roadmapping 双门禁落地（防绕过）
- clarify 不得直接放行

---

### 端到端整改

**提交**: `e95e409` + `9335eec`

**变更**：
- designing → roadmapping → detailing 端到端连通
- 自动返工闭环（roadmapping/detailing）
- approved 快照写入（designing pass 时）

**影响**：
- designing 唯一人工确认点
- roadmapping/detailing 自动审阅 + 自动返工

---

## 2026-04-02

### 端到端流程文档

**提交**: `183f660` + `1f62fd2` + `807d1c6`

**变更**：
- END-TO-END-FLOW.md - 端到端流程
- DESIGNING-TO-ROADMAPPING-FLOW.md - 环节流程
- CODE-ENTRY-POINT.md - 代码级入口说明

---

### Roadmapping 待办建议修复

**提交**: `d18a17c` (tag: v3.5.0)

**变更**：
- 空内容判空
- 需求提取规则增强
- 集成测试（5/5 通过）

---

## 版本历史

| 日期 | 提交 | 说明 |
|------|------|------|
| 2026-04-08 | a05104e | 专业收口（Docs & Acceptance Closure） |
| 2026-04-08 | 9b71c91 | Auto-convergence 修复 |
| 2026-04-08 | 2989d01 | GAP 修复（GAP-1/GAP-2） |
| 2026-04-08 | 225bae1 | Coding Gates 实现 |
| 2026-04-08 | c047e29 | Stage Sign-off Notes |
| 2026-04-08 | 8a179f8 | Stage Sign-off Hardening |
| 2026-04-08 | 7284e93 | P0 问题修复报告 |
| 2026-04-08 | 705b5b2 | P0 问题修复 |
| 2026-04-08 | 9335eec | 端到端整改完成报告 |
| 2026-04-08 | e95e409 | 端到端整改 |
| 2026-04-08 | d18a17c | Roadmapping 待办建议修复 (v3.5.0) |
| 2026-04-02 | ... | 端到端流程文档 |

---

*CHANGELOG by openclaw-ouyp*  
**版本**: v1.0 | **日期**: 2026-04-08
