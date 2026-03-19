# Coding 阶段 A/B 实验设计

> **实验日期**: 2026-03-20  
> **实验任务**: obsidian-tasks Skill 编码实现  
> **实验目标**: 验证 Plan-and-Execute 模式在编码阶段的 Token 节省效果 (预测 40-60%)  
> **实验假设**: 编码阶段因上下文复用更多，Token 节省差异应大于 roadmap 阶段 (11-28%)

---

## 📊 实验设计

### 实验分组

| 组别 | 模式 | 执行方式 | 测量指标 |
|------|------|---------|---------|
| **A 组（水獭）** | 自由推理 | 直接开始编码，边写边调试 | Token 用量、返工次数、测试覆盖率 |
| **B 组（贤者）** | Plan-and-Execute | 先写步骤清单 → 按步骤编码 → 每步测试 | Token 用量、步骤清晰度、测试覆盖率 |

### 实验假设

- **H1**: B 组 Token 用量比 A 组减少 40-60% (高于 roadmap 阶段的 11-28%)
- **H2**: B 组返工次数比 A 组减少 80%+ (一次成型)
- **H3**: B 组测试覆盖率更高 (16/16 vs 部分覆盖)

---

## 📋 编码任务分解

### 标准步骤清单 (B 组使用)

1. [ ] **类型定义** (`types.ts`) - 定义 Skill 输入输出类型
2. [ ] **核心逻辑** (`obsidian-tasks-manager.ts`) - 实现任务管理核心逻辑
3. [ ] **适配层** (`obsidian-adapter.ts`) - 实现 Obsidian API 适配
4. [ ] **入口文件** (`index.ts`) - 导出 Skill 主入口
5. [ ] **单元测试** (`tests/*.test.ts`) - 编写测试用例
6. [ ] **使用文档** (`README.md`) - 编写 Skill 使用说明
7. [ ] **测试验证** (`npm test`) - 运行测试并验证

### Context Prefix (B 组复用)

```markdown
### Context Prefix（缓存复用）
- 核心约束：
  - Skill 必须兼容 OpenClaw Skill 规范
  - 支持读取 Obsidian tasks plugin 数据
  - 支持创建/更新/完成任务
- 架构约束：
  - 模块职责：index / manager / adapter
  - 状态机：Pending → In Progress → Completed
- 物理连接：
  - Obsidian Vault 路径：~/Documents/Obsidian Vault
  - tasks plugin 数据文件：tasks.json
```

---

## 📏 测量指标

| 指标 | A 组（自由） | B 组（规划） | 目标差异 |
|------|------------|------------|---------|
| Token 用量 | ~8k (预测) | ~4k (预测) | **节省 50%** |
| 返工次数 | 3-5 次 (预测) | 0-1 次 (预测) | **减少 80%** |
| 测试覆盖 | 10/16 (预测) | 16/16 (预测) | **一次成型** |
| 完成时间 | ~90 分钟 | ~60 分钟 | **节省 33%** |

---

## 🔬 执行计划

| 时间 | 动作 | 负责人 | 产出 |
|------|------|--------|------|
| 04:00-04:30 | 实验设计 | OpenClaw | 本文档 |
| 04:30-06:00 | A 组执行（自由推理） | OpenCode | `coding/group-a/` |
| 06:00-07:30 | B 组执行（Plan-and-Execute） | OpenCode | `coding/group-b/` |
| 07:30-08:00 | 数据对比分析 | OpenClaw | 实验报告 v2.0 |
| 08:00-08:30 | 更新 MEMORY.md | OpenClaw | 进化日志更新 |

---

## ✅ 前置条件检查

- [x] PRD.md 已完成 (01_designing/)
- [x] 实验目录已建立 (tasks/20260319-plan-execute-experiment/)
- [x] 昨日 roadmap 阶段实验报告已完成
- [ ] OpenCode 在线 (04:30 检查)
- [ ] Obsidian Vault 路径可访问 (需主人确认)

---

## 📈 预期结果

基于昨日 roadmap 阶段实验数据 (Token 节省 11-28%)，预测编码阶段：

```
编码阶段 Token 节省 = roadmap 阶段 × 2 (上下文复用更多)
                   = 11-28% × 2
                   = 22-56%

保守估计：40-60% (考虑编码复杂度增加)
```

**关键洞察预测**:
> "编码阶段的上下文复用效应更显著，因为类型定义、核心逻辑、适配层之间存在强依赖关系，Plan-and-Execute 模式的结构化步骤能最大化缓存命中率。"

---

*实验设计由 openclaw-ouyp 编写，遵循 HEARTBEAT.md v3.0 四时律动*  
**进化指数**: 72/100  
**内化率**: 72%
