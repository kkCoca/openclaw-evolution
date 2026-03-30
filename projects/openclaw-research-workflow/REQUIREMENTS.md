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
| v1.1.0 | 2026-03-26 | FEATURE-001：增加 OpenCode 调用说明（增量需求） |
| **v2.0.0** | **2026-03-28** | **FEATURE-002：审阅驱动 + 会话隔离 + 工具无关** |
| **v2.0.1** | **2026-03-30** | **BUG-002 修复：补充 02_roadmapping/和 03_detailing/阶段产物** |

---

## v2.0.0 增量需求说明

**Issue ID**: FEATURE-002  
**需求类型**: 增量需求  
**版本升级**: v1.1.0 → v2.0.0

### 问题背景

在流程引擎使用过程中发现以下问题：

1. **PRD/TRD 生成后缺少沟通确认环节**
2. **单会话依次执行导致上下文膨胀**
3. **流程引擎角色模糊**

### 需求目标

| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **审阅驱动** | 每个阶段必须 openclaw-ouyp 确认后才继续 | 所有阶段都有明确的审阅检查点 |
| **会话隔离** | 每个阶段独立子会话执行 | 子会话上下文独立 |
| **工具无关** | 可配置 AI 工具 | 配置文件可指定各阶段使用的 AI 工具 |
| **状态可追溯** | 完整记录每个阶段的执行状态 | 状态日志可查询，支持断点续传 |
| **回滚灵活** | 支持阶段级回滚 | 驳回后重新执行当前阶段 |

### 功能需求

1. **状态机管理** — 状态枚举/状态流转/状态持久化
2. **子会话调度** — 每个阶段独立 spawn 子会话
3. **审阅协议执行** — 审阅检查点/审阅结论/审阅超时
4. **配置文件支持** — config.yaml
5. **状态持久化** — state-manager.js
6. **文档更新** — workflow.md/SKILL.md/REVIEW-PROTOCOL.md

### 输出要求（关键！）

**必须完整输出 5 个阶段的产物**：

```
projects/{项目名}/
├── REQUIREMENTS.md
├── 01_designing/
│   ├── PRD.md              # 阶段 1 输出
│   └── TRD.md              # 阶段 1 输出
├── 02_roadmapping/
│   └── ROADMAP.md          # 阶段 2 输出（必须！）
├── 03_detailing/
│   └── DETAIL.md           # 阶段 3 输出（必须！）
├── 04_coding/
│   └── src/                # 阶段 4 输出
├── 05_reviewing/
│   └── REVIEW-REPORT.md    # 阶段 5 输出
└── CHANGELOG.md
```

### 验收标准

- Given 流程引擎 v2.0 执行完成
- When 审阅输出目录
- Then **01_designing~05_reviewing 所有目录和文件完整存在**

---

## v2.0.1 Bugfix 需求说明

**Issue ID**: BUG-002  
**需求类型**: 问题修复  
**版本升级**: v2.0.0 → v2.0.1

### 问题描述

流程引擎 v2.0.0 执行后，输出目录缺失 2 个阶段的产物：
- ❌ 02_roadmapping/ROADMAP.md（缺失）
- ❌ 03_detailing/DETAIL.md（缺失）

### 根因分析

1. PRD.md v2.0.0 的需求定义不完整，没有明确要求输出 ROADMAP.md 和 DETAIL.md
2. 流程引擎自己没有执行自己定义的标准（SKILL.md 要求 5 阶段，实际只输出 3 个）
3. 验收报告造假（REVIEW-REPORT.md 声称文件存在，但实际不存在）

### 修复方案

重新执行流程引擎，确保完整输出 5 个阶段的产物。

### 验收标准

- Given 流程引擎 v2.0.1 执行完成
- When 审阅输出目录
- Then **01_designing~05_reviewing 所有 5 个目录和文件完整存在**
