# 产品需求文档（PRD）

## 文档信息

| 字段 | 值 |
|------|-----|
| 版本 | v1.1.0 |
| 日期 | 2026-03-26 |
| 状态 | 待评审 |
| 作者 | openclaw-ouyp |

---

## 1. 需求背景

### 1.1 问题描述

在 AGENTS.md 审阅过程中发现，流程引擎 Skill（workflow.md）没有明确体现调用 OpenCode 执行研发流程。

**具体问题**：
1. 流程引擎 Skill 只是文档，没有说明如何调用 OpenCode
2. AGENTS.md 中的"三方协作架构"说明了流程引擎调用 OpenCode，但 workflow.md 本身没有体现
3. 用户查看 workflow.md 时，无法了解每个阶段是如何调用 OpenCode 执行的

### 1.2 影响范围

- 流程引擎 Skill 的可读性差
- 开发者无法了解流程引擎的工作原理
- AGENTS.md 与 workflow.md 内容不一致

---

## 2. 需求目标

### 2.1 核心目标

在 workflow.md 中每个阶段明确说明"调用 OpenCode 执行 XXX skill"，提升文档透明度和可读性。

### 2.2 保留原始需求

必须保留流程引擎 Skill 的原始需求：
- ✅ **独立完整** — 一个包包含所有依赖 skills
- ✅ **零感知安装** — 用户只需安装 1 个 skill，依赖自动注册
- ✅ **流程标准化** — 所有场景都走完整研发流程
- ✅ **易于分享** — 支持多种安装方式

### 2.3 新增需求

- ✅ **流程透明化** — 每个阶段明确调用 OpenCode 执行

---

## 3. 功能需求

### 3.1 workflow.md 修改

**需求描述**：在每个阶段增加"调用 OpenCode 执行"说明。

**修改范围**：
- 阶段 1: designing → 明确"调用 OpenCode 执行 designing skill"
- 阶段 2: roadmapping → 明确"调用 OpenCode 执行 roadmapping skill"
- 阶段 3: detailing → 明确"调用 OpenCode 执行 detailing skill"
- 阶段 4: coding → 明确"调用 OpenCode 执行 coding skill"
- 阶段 5: reviewing → 明确"调用 OpenCode 执行 reviewing skill"

### 3.2 README.md 修改

**需求描述**：增加"工作原理"章节。

**内容要求**：
- 展示三方协作架构图（openclaw-ouyp → 流程引擎 → OpenCode）
- 说明每个阶段的调用关系
- 保持与 AGENTS.md 的一致性

---

## 4. 非功能需求

### 4.1 文档质量

- 语言简洁清晰
- 结构层次分明
- 图表辅助说明

### 4.2 兼容性

- 保持与现有文档风格一致
- 不影响现有功能
- 向后兼容

---

## 5. 验收标准

### 5.1 Given

- Git 分支已创建
- 需求文件已创建
- 流程引擎已执行完成
- 原始需求已满足

### 5.2 When

- 审阅 workflow.md 和 README.md

### 5.3 Then

- workflow.md 每个阶段明确"调用 OpenCode 执行 XXX skill"
- README.md 增加"工作原理"章节
- 原始需求仍然满足
- 所有研发过程文档完整

---

## 6. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0.0 | 2026-03-26 | 初始版本（原始需求） |
| v1.0.1 | 2026-03-26 | BUG-001 修复（目录结构问题） |
| v1.1.0 | 2026-03-26 | FEATURE-001：增加 OpenCode 调用说明 |

---

## 7. 附录

### 7.1 相关文档

- AGENTS.md - 操作手册
- REQUIREMENTS.md - 需求说明
- workflow.md - 流程编排逻辑
- README.md - 使用文档

### 7.2 术语表

| 术语 | 说明 |
|------|------|
| OpenCode | 执行者，负责具体研发任务执行 |
| 流程引擎 | 编排者，负责流程监督和 skill 调用 |
| openclaw-ouyp | 审阅者，负责任务分配和验收验证 |
