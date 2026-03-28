---
name: openclaw-research-workflow
description: AI 辅助研发流程引擎 v2.0，审阅驱动 + 会话隔离 + 工具无关，自动化编排 designing→roadmapping→detailing→coding→reviewing 完整流程
triggers:
  - /sessions_spawn openclaw-research-workflow
entry: workflow.md
version: 2.0.0
author: openclaw-ouyp
license: MIT
---

# OpenClaw Research Workflow Skill v2.0

## 简介

本 Skill 是一个流程引擎，**审阅驱动**地编排 AI 辅助研发流程。每个阶段完成后必须经 openclaw-ouyp 审阅确认后才继续，确保质量可控。

## 核心特性 v2.0

| 特性 | 说明 | 收益 |
|------|------|------|
| **审阅驱动** | 每个阶段必须 openclaw-ouyp 确认后才继续 | 质量可控，错误不传递 |
| **会话隔离** | 每个阶段独立子会话执行 | 上下文不膨胀，Token 节省 |
| **工具无关** | 可配置 AI 工具（OpenCode/Claude Code/Custom） | 灵活切换，不绑定厂商 |
| **状态可追溯** | state.json 持久化，支持断点续传 | 中断后可恢复，决策可追溯 |
| **回滚灵活** | 策略 A（驳回后重新执行当前阶段） | 不影响已通过阶段 |

## 支持的场景

1. **全新功能开发** - 从 0 到 1 的完整研发流程
2. **增量需求开发** - 在现有基础上添加新功能
3. **问题修复** - 定位并修复现有问题

## 使用方法

```bash
/sessions_spawn openclaw-research-workflow

# 任务：{任务描述}
# 场景类型：[全新功能 | 增量需求 | 问题修复]
# 需求说明：REQUIREMENTS.md（openclaw-ouyp 提供）
# 原有项目：{项目路径，增量/修复必填}
# 约束条件：{约束条件}
# 验收标准：{Given/When/Then}
# 输出目录：/home/ouyp/Learning/Practice/openclaw-universe/projects/{项目名}/
# 
# 重要要求：
# - 必须按照 01_designing~05_reviewing 目录结构输出
# - 禁止直接输出到项目根目录
# - 增量需求：读取原有 PRD.md 并追加新章节
# - Bugfix 规范：REQUIREMENTS.md 不更新，使用 ISSUES.md
```

## 工作流程

### 阶段执行流程

```
designing → [审阅] → roadmapping → [审阅] → detailing → [审阅] → coding → [审阅] → reviewing → [验收]
    ↓            ↓           ↓           ↓          ↓           ↓         ↓           ↓         ↓
  PRD+TRD    通过/驳回   ROADMAP    通过/驳回    DETAIL    通过/驳回    src/     通过/驳回  REVIEW-REPORT
```

### 审阅结论选项

| 结论 | 标识 | 后续动作 |
|------|------|---------|
| ✅ 通过 | `pass` | 进入下一阶段 |
| ⚠️ 条件通过 | `conditional` | 进入下一阶段，记录待修复项 |
| ❌ 驳回 | `reject` | 重新执行当前阶段（策略 A） |
| ❓ 需澄清 | `clarify` | 回答问题后重新审阅 |
| 🛑 终止 | `terminate` | 停止整个流程 |

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
│   └── src/                # AI 生成（增量修改）
├── 05_reviewing/
│   └── REVIEW-REPORT.md    # AI 生成
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

`config.yaml` - 支持 AI 工具选择、审阅配置、回滚策略等

```yaml
global:
  defaultAITool: opencode  # 默认 AI 工具

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

支持 3 种 AI 工具：

| 工具 | 配置项 | 说明 |
|------|--------|------|
| **OpenCode** | `opencode` | 通过 OpenClaw sessions_spawn 调用 |
| **Claude Code** | `claude-code` | 通过 CLI 命令行调用 |
| **Custom** | `custom` | 支持任意自定义 AI 工具 |

**配置示例**：

```yaml
aiTools:
  # OpenCode 配置
  opencode:
    timeoutSeconds: 1800
    
  # Claude Code 配置
  claude-code:
    args:
      - --print
      - --permission-mode
      - bypassPermissions
    timeoutSeconds: 1800
    
  # 自定义工具配置
  custom:
    command: /path/to/custom/tool
    args:
      - --stage
      - '{stage}'
    env:
      API_KEY: ${CUSTOM_AI_API_KEY}
```

详见 `ai-tool-adapter.js` 和 `adapters/` 目录。

## 状态管理

### 状态文件

`state.json` - 记录流程执行状态，支持断点续传

```json
{
  "workflowId": "wf-20260328-001",
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
# 流程会自动检测 state.json 并恢复
/sessions_spawn openclaw-research-workflow
# 任务：恢复流程
```

## 日志

### 日志文件

`logs/{workflowId}.log` - JSON Lines 格式，完整记录执行过程

### 查询日志

```bash
# 查看流程执行日志
cat logs/wf-20260328-001.log | jq

# 查看特定阶段日志
cat logs/wf-20260328-001.log | jq 'select(.stage == "designing")'
```

## 依赖

本 Skill 包含以下 bundled skills：
- designing
- roadmapping
- detailing
- coding
- reviewing

安装时自动注册，无需单独安装。

## 安装

详见 README.md

## 特性对比 v1.x vs v2.0

| 特性 | v1.x | v2.0 |
|------|------|------|
| 审阅机制 | 无 | ✅ 每个阶段必须审阅 |
| 会话模式 | 单会话 | ✅ 每个阶段独立子会话 |
| AI 工具 | 仅 OpenCode | ✅ 可配置（OpenCode/Claude Code/Custom） |
| 状态持久化 | 无 | ✅ state.json |
| 回滚策略 | 无 | ✅ 策略 A/B/C 可配置 |
| 断点续传 | 无 | ✅ 支持 |
| 日志追溯 | 基础 | ✅ 完整 JSON Lines |

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-26 | 初始版本 |
| 1.1.0 | 2026-03-26 | FEATURE-001：增加 OpenCode 调用说明 |
| 1.2.0 | 2026-03-27 | 按 AGENTS.md v11.0 标准更新文档 |
| **2.0.0** | **2026-03-28** | **FEATURE-002：审阅驱动 + 会话隔离 + 工具无关** |

## 许可证

MIT
