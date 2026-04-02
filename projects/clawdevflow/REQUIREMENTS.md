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

---

## v2.1.0 增量需求说明 - Roadmap Agent 优化

**Issue ID**: FEATURE-003  
**需求类型**: 增量需求  
**版本升级**: v2.0.1 → v2.1.0

### 问题背景

在 roadmapping 阶段使用过程中发现以下问题：

1. **交互式技能不符合流程引擎设计理念** - 需要用户多次确认（评估范围、评审确认）
2. **依赖外部 skill** - 需要调用 designing skill 澄清需求，增加耦合
3. **审阅机制重复** - skill 内部评审 + 流程引擎审阅，用户需要审阅两次
4. **代码分析能力弱** - "搜索相关代码"但没有具体实现
5. **工作量评估主观** - 没有客观依据和检查标准

### 需求目标

| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **纯自动化** | 移除所有用户交互 | roadmapping 阶段无用户交互，直接输出 |
| **自审阅** | 增加 AI 自审阅 Agent | 生成后自动执行 10 项检查清单 |
| **自动修正** | 小问题自动修正 | 评分 8-9/10 时自动修正后输出 |
| **审阅透明** | 记录审阅过程 | 生成 SELF-REVIEW.md 记录审阅过程 |
| **文档标准化** | 完善技能文档 | SKILL.md 包含完整执行流程和检查清单 |

### 功能需求

1. **移除交互步骤** - 移除确认评估范围、用户评审确认等交互
2. **自动阅读文档** - 自动阅读 PRD.md + TRD.md 作为输入
3. **自动分析代码** - 增量需求时自动扫描项目结构
4. **自审阅 Agent** - 10 项检查清单（任务拆分、工作量、收尾项等）
5. **评分决策** - 10/10 通过、8-9/10 修正、<8/10 重做
6. **修正机制** - 最多 3 次修正机会
7. **审阅报告** - 生成 SELF-REVIEW.md（可选）
8. **文档完善** - SKILL.md、CHECKLIST.md、示例文件

### 输出要求

**roadmapping skill 输出**：
```
bundled-skills/roadmapping/
├── SKILL.md                  # 完全重构，包含自审阅流程
├── CHECKLIST.md              # 10 项检查清单详细说明（新增）
└── examples/
    ├── ROADMAP-example.md    # 开发计划示例（新增）
    └── SELF-REVIEW-example.md # 自审阅报告示例（新增）
```

**流程引擎适配器输出**：
```
adapters/opencode.js          # 增强 roadmapping 任务描述
cdf-orchestrator/
├── stage-executor.js         # 修复 designingPath 未定义 bug
└── workflow-orchestrator.js  # 添加 designingPath 输入
```

### 验收标准

### Given
- Git 分支已创建
- REQUIREMENTS.md 已追加 v2.1.0 需求
- 流程引擎已执行完成

### When
审阅以下文件：
1. `bundled-skills/roadmapping/SKILL.md`
2. `bundled-skills/roadmapping/CHECKLIST.md`
3. `adapters/opencode.js`
4. `cdf-orchestrator/stage-executor.js`
5. `cdf-orchestrator/workflow-orchestrator.js`

### Then
- ✅ SKILL.md 包含完整的自审阅流程（步骤 4-5）
- ✅ CHECKLIST.md 包含 10 项检查的详细说明和评分标准
- ✅ opencode.js 任务描述包含 10 项检查清单
- ✅ stage-executor.js 修复 `designingPath` 未定义 bug
- ✅ workflow-orchestrator.js 添加 `designingPath` 输入
- ✅ 示例文件完整（ROADMAP-example.md、SELF-REVIEW-example.md）

### 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0.0 | 2026-03-26 | 初始版本（原始需求） |
| v1.0.1 | 2026-03-26 | BUG-001 修复（目录结构问题） |
| v1.1.0 | 2026-03-26 | FEATURE-001：增加 OpenCode 调用说明 |
| v2.0.0 | 2026-03-28 | FEATURE-002：审阅驱动 + 会话隔离 + 工具无关 |
| v2.0.1 | 2026-03-30 | BUG-002 修复：补充 02_roadmapping/和 03_detailing/ |
| **v2.1.0** | **2026-04-02** | **FEATURE-003：Roadmap Agent 优化（纯自动化 + 自审阅）** |
| **v3.1.0** | **2026-04-02** | **FEATURE-004：DESIGNING 阶段审阅优化（需求追溯性+AI 检查）** |

---

## v3.1.0 增量需求说明 - DESIGNING 阶段审阅优化

**Issue ID**: FEATURE-004  
**需求类型**: 增量需求  
**版本升级**: v3.0.1 → v3.1.0

### 问题背景

在 DESIGNING 阶段审阅使用过程中发现以下问题：

1. **需求追溯性不足** - PRD/TRD 未声明对齐的 REQUIREMENTS 版本/哈希
2. **需求映射不准确** - 只靠自然语言匹配，无法验证真实映射
3. **AI 检查未实现** - D4 技术选型、D6 异常处理的 AI 检查逻辑缺失
4. **检查粒度粗** - 只检查"有无"，不检查"质量"
5. **验收标准缺失** - 缺少 D7 验收标准可测试性检查

### 需求目标

| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **需求追溯性** | PRD/TRD 必须声明对齐的 REQUIREMENTS 版本/哈希 | 版本一致，哈希匹配 |
| **可定位映射** | 每条需求必须有可定位的映射（章节 + 行号） | 需求追溯矩阵完整 |
| **AI 检查实现** | 实现 D4/D6/D7 的 AI 检查逻辑 | AI 检查正常执行 |
| **检查粒度增强** | 从"有无"升级为"质量" | D2/D5 检查内容质量 |
| **文档标准化** | 提供 REQUIREMENTS/PRD/TRD 模板 | 模板包含追溯矩阵 |

### 功能需求

1. **版本/哈希对齐检查** - PRD/TRD 必须声明对齐的 REQUIREMENTS 版本/哈希，且与最新版本一致
2. **需求追溯矩阵检查** - PRD 必须包含需求追溯矩阵，覆盖所有需求
3. **可定位映射检查** - 每个映射必须有 PRD 章节和行号
4. **D4 技术选型 AI 检查** - 评估技术选型合理性（比较表 + 决策依据）
5. **D6 异常处理 AI 检查** - 评估异常处理完整性（正常 + 失败 + 边界）
6. **D7 验收标准可测试性检查** - 检查验收标准是否包含 Given/When/Then
7. **文档模板** - 提供 REQUIREMENTS/PRD/TRD 模板，包含追溯矩阵格式

### 检查点分类

| 类型 | 检查点 | 权重 | 不满足后果 |
|------|--------|------|-----------|
| 红线项 | D1 需求覆盖率（含版本对齐 + 可定位映射） | 0.25 | ❌ reject |
| 红线项 | D2 文档完整性 | 0.15 | ❌ reject |
| 红线项 | D4 技术选型合理 | 0.20 | ❌ reject |
| 红线项 | D6 异常处理 | 0.20 | ❌ reject |
| 质量项 | D5 向后兼容（仅增量需求） | 0.12 | ⚠️ conditional |
| 质量项 | D7 验收标准可测试性 | 0.10 | ⚠️ conditional |
| 加分项 | D3 无模糊词 | 0.08 | ✅ pass + 建议 |

### 输出要求

**审阅 Agent 输出**：
```
review-agents/
└── review-design.js          # 重写 D1 检查，实现 D4/D6/D7 AI 检查
```

**文档模板输出**：
```
templates/
├── REQUIREMENTS-template.md  # 含版本、哈希、需求 ID（REQ-XXX）
├── PRD-template.md           # 含对齐版本/哈希、需求追溯矩阵
└── TRD-template.md           # 含对齐 REQUIREMENTS+PRD 版本/哈希
```

### 验收标准

### Given
- Git 分支已创建
- REQUIREMENTS.md 已追加 v3.1.0 需求
- 流程引擎已执行完成

### When
审阅以下文件：
1. `review-agents/review-design.js`
2. `templates/REQUIREMENTS-template.md`
3. `templates/PRD-template.md`
4. `templates/TRD-template.md`

### Then
- ✅ D1 检查实现版本对齐验证（PRD 声明版本/哈希）
- ✅ D1 检查实现版本一致性验证（与 REQUIREMENTS 比对）
- ✅ D1 检查实现追溯矩阵提取和验证
- ✅ D1 检查实现需求映射可定位性验证（章节 + 行号）
- ✅ D4 实现 AI 检查（技术选型合理性评估）
- ✅ D6 实现 AI 检查（异常处理完整性评估）
- ✅ D7 实现验收标准可测试性检查
- ✅ 提供 REQUIREMENTS 模板（含版本、哈希、需求 ID）
- ✅ 提供 PRD 模板（含对齐版本/哈希、追溯矩阵）
- ✅ 提供 TRD 模板（含对齐 REQUIREMENTS+PRD 版本/哈希）

### 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v3.0.1 | 2026-04-01 | 基础版本 |
| **v3.1.0** | **2026-04-02** | **FEATURE-004：DESIGNING 阶段审阅优化** |
