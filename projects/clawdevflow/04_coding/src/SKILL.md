---
name: clawdevflow
displayName: ClawDevFlow (CDF) - 爪刃研发流
description: AI 辅助研发流程编排引擎 v3.4.1，审阅驱动 + 会话隔离 + PTY 模式支持 OpenCode，自动化编排 designing→roadmapping→detailing→coding→testing→reviewing→precommit→releasing 完整流程
triggers:
  - /sessions_spawn clawdevflow
  - /sessions_spawn cdf
entry: workflow-executor.js
version: 3.4.1
author: openclaw-ouyp
license: MIT
---

# ClawDevFlow 流程引擎

> **定位说明**: 这是一个**流程编排引擎 skill**，以 Skill 形式提供，内部实现完整的流程管理、状态机、AI 工具适配等复杂功能。

## 简介

本引擎是一个**审阅驱动**的流程编排系统，自动化编排 AI 辅助研发流程。每个阶段完成后必须经 openclaw-ouyp 审阅确认后才继续，确保质量可控。

## 为什么是流程引擎 skill？

| 维度 | 传统 Skill | 本引擎 |
|------|-----------|------|
| **功能** | 单一任务 | 编排 8 个阶段 + 状态管理 |
| **代码规模** | ~100-500 行 | ~5500 行 |
| **状态管理** | 无 | 完整状态机 + 断点续传 |
| **可配置性** | 简单 | 完整 config.yaml |
| **扩展性** | 有限 | 插件式 AI 工具适配层 |

**设计理念**：
- ✅ **兼容 OpenClaw 生态** - 以 Skill 形式提供，安装/使用方式一致
- ✅ **内部复杂，外部简单** - 用户无需关心实现细节
- ✅ **审阅驱动** - 每个阶段必须确认后继续，质量可控
- ✅ **工具适配层预留** - 当前仅支持 OpenCode，后续可扩展其他工具
- ✅ **PTY 模式** - OpenCode CLI 需要交互式终端，使用 node-pty 提供支持

## 核心特性 v3.4.1

| 特性 | 说明 | 收益 |
|------|------|------|
| **审阅驱动** | 每个阶段必须 openclaw-ouyp 确认后才继续 | 贞量可控，错误不传递 |
| **会话隔离** | 每个阶段独立子会话执行 | 上下文不膨胀，Token 节省 |
| **工具适配层预留** | 当前仅支持 OpenCode（保留扩展接口） | 为后续扩展留空间 |
| **状态可追溯** | .cdf-state.json 久化，支持断点续传 | 中断后可恢复，决策可追溯 |
| **运行态隔离** | .cdf-work/ 存放审阅请求与临时产物 | 不影响提交，避免 precommit 阻塞 |
| **回滚灵活** | 策略 A（驳回后重新执行当前阶段） | 不影响已通过阶段 |
| **PTY 模式** | OpenCode 需要 PTY 终端环境 | 正确捕获输出和文件操作 |

## 依赖

- Node.js v18+
- **node-pty** (OpenCode CLI 需要 PTY 终端环境)
- opencode CLI v1.3+

## 支持的场景

1. **全新功能开发** - 从 0 到 1 的完整研发流程
2. **增量需求开发** - 在现有基础上添加新功能
3. **问题修复** - 定位并修复现有问题

## 使用方法

```bash
/sessions_spawn clawdevflow

# 任务：{任务描述}
# 场景类型：[全新功能 | 增量需求 | 问题修复]
# 需求说明：REQUIREMENTS.md（openclaw-ouyp 提供，可用“需求描述”替代）
# 问题记录（问题修复）：ISSUES.md
# 原有项目：{项目路径，增量/修复必填}
# 约束条件：{约束条件}
# 验收标准：{Given/When/Then}
# 输出目录：/home/ouyp/Learning/Practice/openclaw-universe/projects/{项目名}/
# 
# 重要要求：
# - 必须按照 01_designing~08_releasing 目录结构输出
# - 禁止直接输出到项目根目录
# - 增量需求：读取原有 PRD.md 并追加新章节
# - Bugfix 规范：REQUIREMENTS.md 不更新，使用 ISSUES.md
```

## 工作流程

### 阶段执行流程

```
designing → [审阅] → roadmapping → [审阅] → detailing → [审阅] → coding → [审阅] → testing → [审阅] → reviewing → [审阅] → precommit → [审阅] → releasing
    ↓            ↓           ↓           ↓          ↓           ↓         ↓           ↓         ↓           ↓         ↓           ↓         ↓           ↓
  PRD+TRD    通过/驳回   ROADMAP    通过/驳回    DETAIL    通过/驳回  src+CHANGESET 通过/驳回  TEST_RESULTS 通过/驳回  FINAL_REPORT 通过/驳回  PRECOMMIT_REPORT 通过/驳回  RELEASE_RECORD
```

### 审阅结论选项

| 结论 | 标识 | 后续动作 |
|------|------|---------|
| ✅ 通过 | `pass` | 进入下一阶段 |
| ⚠️ 条件通过 | `conditional` | designing 放行；其余自动阶段按驳回处理并触发返工 |
| ❌ 驳回 | `reject` | 重新执行当前阶段（策略 A） |
| ❓ 需澄清 | `clarify` | 回答问题后重新审阅 |
| 🛑 终止 | `terminate` | 停止整个流程 |

> 说明：designing 阶段的 `conditional` 会直接放行并写入 approved 快照；其它自动化阶段的 `conditional` 将按驳回处理并触发返工。

### 目录结构

**必须按照以下目录结构输出到项目目录**：

```
projects/{项目名}/
├── REQUIREMENTS.md         # openclaw-ouyp 提供（已有）
├── 01_designing/
│   ├── PRD.md              # AI 生成（追加式）
│   └── TRD.md              # AI 生成（追加式）
├── 02_roadmapping/
│   └── ROADMAP.md          # AI 生成
├── 03_detailing/
│   └── DETAIL.md           # AI 生成
├── 04_coding/
│   ├── src/                # AI 生成（增量修改）
│   └── CHANGESET.md        # AI 生成（变更说明）
├── 05_reviewing/
│   ├── FINAL_REPORT.md     # AI 生成
│   └── RELEASE_READINESS.json # AI 生成
├── 06_testing/
│   ├── TEST_CONTEXT.json   # AI 生成
│   ├── TEST.log            # AI 生成
│   ├── TEST_RESULTS.json   # AI 生成
│   ├── VERIFY.log          # AI 生成
│   ├── VERIFY_RESULTS.json # AI 生成
│   └── VERIFICATION_REPORT.md # AI 生成
├── 07_precommit/
│   ├── PRECOMMIT_PLAN.json   # AI 生成
│   ├── PRECOMMIT_REPORT.json # AI 生成
│   └── PRECOMMIT_SUMMARY.md  # AI 生成
├── 08_releasing/
│   ├── RELEASE_RECORD.json   # AI 生成
│   ├── RELEASE_NOTES.md      # AI 生成
│   ├── ARTIFACT_MANIFEST.json # AI 生成
│   ├── CLEANUP_PLAN.json     # AI 生成
│   └── CLEANUP_REPORT.json   # AI 生成
├── CHANGELOG.md            # AI 生成（追加式）
└── ISSUES.md               # openclaw-ouyp 提供（Bugfix 使用）
```

**禁止**直接输出到项目根目录！
**禁止**覆盖原有 PRD.md（增量需求采用追加式）！

**追加式更新规范**：
- 全新功能：创建 REQUIREMENTS.md 和 PRD.md
- 增量需求：REQUIREMENTS.md 追加新章节，PRD.md 追加 v1.1.0 章节
- 问题修复：REQUIREMENTS.md 不更新，ISSUES.md 记录问题

## 配置

### 配置文件

`config.yaml` - 支持阶段参数与回滚策略配置

```yaml
global:
  defaultAITool: opencode  # 默认 AI 工具
  runtimeDir: ${CDF_RUNTIME_DIR:-.cdf-work}    # 运行态目录（审阅请求/临时产物）

stages:
  designing:
    aiTool: opencode       # 可单独配置
    requireReview: true    # 是否需要审阅
    timeoutSeconds: 1800   # 子会话超时

rollback:
  strategy: A              # A=当前阶段重做，B=回滚到上阶段，C=完全重启
  maxRetriesPerStage: 3    # 最大重试次数
```

详见 `config.yaml`

### AI 工具配置

当前版本仅支持 **OpenCode**（`opencode`），其他工具适配未实现。
如需调整 OpenCode CLI 参数，请修改 `config.yaml` 的 `openclaw` 配置。

详见 `ai-tools/opencode.js`。

## 状态管理

### 状态文件

`.cdf-state.json` - 记录流程执行状态，支持断点续传（位于项目目录）
`.cdf-work/` - 审阅请求与临时产物（运行态目录，禁止提交）

```json
{
  "workflowId": "cdf-20260328-ABCD",
  "currentStage": "detailing",
  "stages": {
    "designing": {
      "status": "passed",
      "reviewDecision": "pass",
      "outputs": ["01_designing/PRD.md", "01_designing/TRD.md"]
    }
  }
}
```

### 恢复流程

流程中断后，可从中断点继续：

```bash
# 流程会自动检测 .cdf-state.json 并恢复
/sessions_spawn clawdevflow
# 任务：恢复流程
```

## 日志

当前版本仅输出控制台日志，尚未生成 `logs/{workflowId}.log` 文件。

## 依赖

本 Skill 包含以下 bundled skills：
- designing
- roadmapping
- detailing
- coding
- testing
- reviewing
- precommit
- releasing

安装时自动注册，无需单独安装。

## 安装

详见 README.md

## 特性对比 v1.x vs v2.0

| 特性 | v1.x | v2.0 |
|------|------|------|
| 审阅机制 | 无 | ✅ 每个阶段必须审阅 |
| 会话模式 | 单会话 | ✅ 每个阶段独立子会话 |
| AI 工具 | 仅 OpenCode | ✅ 当前仅 OpenCode（预留扩展接口） |
| 状态持久化 | 无 | ✅ .cdf-state.json |
| 回滚策略 | 无 | ✅ 策略 A/B/C 可配置 |
| 断点续传 | 无 | ✅ 支持 |
| 日志追溯 | 基础 | ✅ 控制台日志 |

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-26 | 初始版本 |
| 1.1.0 | 2026-03-26 | FEATURE-001：增加 OpenCode 调用说明 |
| 1.2.0 | 2026-03-27 | 按 AGENTS.md v11.0 标准更新文档 |
| **2.0.0** | **2026-03-28** | **FEATURE-002：审阅驱动 + 会话隔离 + 适配层预留** |

## 许可证

MIT
