# 需求：流程引擎 Skill 增加 OpenCode 调用说明（FEATURE-001）

## 原始需求说明

流程引擎 Skill（openclaw-research-workflow）的原始需求：

1. **独立完整** — 一个包包含所有依赖 skills（designing/roadmapping/detailing/coding/reviewing）
2. **零感知安装** — 用户只需安装 1 个 skill，依赖自动注册
3. **流程标准化** — 所有场景都走完整研发流程（designing→roadmapping→detailing→coding）
4. **易于分享** — 支持 clawhub/脚本/压缩包多种安装方式

## 增量需求说明

**Issue ID**: FEATURE-001  
**需求类型**: 增量需求（在原始需求基础上增加）  
**版本升级**: v1.0.1 → v1.1.0

### 问题背景

在 AGENTS.md 审阅过程中发现，流程引擎 Skill（workflow.md）没有明确体现调用 OpenCode 执行研发流程。

**具体问题**：
1. 流程引擎 Skill 只是文档，没有说明如何调用 OpenCode
2. AGENTS.md 中的"三方协作架构"说明了流程引擎调用 OpenCode，但 workflow.md 本身没有体现
3. 用户查看 workflow.md 时，无法了解每个阶段是如何调用 OpenCode 执行的

**影响**：
- 流程引擎 Skill 的可读性差
- 开发者无法了解流程引擎的工作原理
- AGENTS.md 与 workflow.md 内容不一致

### 解决方案

在 workflow.md 中每个阶段明确说明"调用 OpenCode 执行 XXX skill"。

**保留原始需求**：
- ✅ 独立完整
- ✅ 零感知安装
- ✅ 流程标准化
- ✅ 易于分享

**新增需求**：
- ✅ 流程透明化（每个阶段明确调用 OpenCode）

### 修改内容

#### 1. workflow.md

每个阶段增加"调用 OpenCode 执行"说明。

#### 2. README.md

增加"工作原理"章节。

### 验收标准

### Given
- Git 分支已创建
- 需求文件已创建
- 流程引擎已执行完成
- 原始需求已满足（独立完整/零感知安装/流程标准化/易于分享）

### When
- 审阅 workflow.md 和 README.md

### Then
- workflow.md 每个阶段明确"调用 OpenCode 执行 XXX skill"
- README.md 增加"工作原理"章节
- 原始需求仍然满足
- 所有研发过程文档完整

### 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0.0 | 2026-03-26 | 初始版本（原始需求） |
| v1.0.1 | 2026-03-26 | BUG-001 修复（目录结构问题） |
| **v1.1.0** | **2026-03-26** | **FEATURE-001：增加 OpenCode 调用说明（增量需求）** |
