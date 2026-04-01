# ClawDevFlow (CDF) - 爪刃研发流

> **版本**: v3.0.1  
> **定位**: AI 辅助研发流程编排引擎  
> **作者**: openclaw-ouyp  
> **许可证**: MIT

---

## 简介

ClawDevFlow 是一个**审阅驱动**的流程编排系统，自动化编排 AI 辅助研发流程。每个阶段完成后必须经 openclaw-ouyp 审阅确认后才继续，确保质量可控。

### 核心特性

| 特性 | 说明 | 收益 |
|------|------|------|
| **审阅驱动** | 每个阶段必须确认后继续 | 质量可控，错误不传递 |
| **会话隔离** | 每个阶段独立子会话执行 | 上下文不膨胀，Token 节省 |
| **工具无关** | 可配置 AI 工具（OpenCode/Claude Code/Custom） | 灵活切换，不绑定厂商 |
| **状态可追溯** | state.json 持久化，支持断点续传 | 中断后可恢复，决策可追溯 |
| **回滚灵活** | 策略 A（驳回后重新执行当前阶段） | 不影响已通过阶段 |

---

## 快速开始

### 1. 安装

```bash
# Linux / macOS
cd ~/.openclaw/skills/clawdevflow
./install.sh

# Windows PowerShell
cd ~/.openclaw/skills/clawdevflow
.\install.bat
```

### 2. 配置

编辑 `config.yaml` 配置 AI 工具：

```yaml
global:
  defaultAITool: opencode  # 默认 AI 工具

stages:
  designing:
    aiTool: opencode
    requireReview: true
    timeoutSeconds: 1800
```

### 3. 使用

```bash
/sessions_spawn clawdevflow

# 任务：{任务描述}
# 场景类型：[全新功能 | 增量需求 | 问题修复]
# 需求说明：REQUIREMENTS.md
# 输出目录：/home/ouyp/Learning/Practice/openclaw-universe/projects/{项目名}/
```

---

## 支持的场景

### 1. 全新功能开发

从 0 到 1 的完整研发流程。

**前提条件**：
- 创建 `REQUIREMENTS.md` 需求说明

**流程**：
```
REQUIREMENTS.md → designing → roadmapping → detailing → coding → reviewing
```

**输出**：
- `01_designing/PRD.md` - 产品需求文档
- `01_designing/TRD.md` - 技术设计文档
- `02_roadmapping/ROADMAP.md` - 研发路线图
- `03_detailing/DETAIL.md` - 详细设计
- `04_coding/src/` - 源代码
- `05_reviewing/REVIEW-REPORT.md` - 验收报告
- `CHANGELOG.md` - 变更日志

### 2. 增量需求开发

在现有基础上添加新功能。

**前提条件**：
- 追加 `REQUIREMENTS.md` 新章节
- 保留原有项目目录

**流程**：
```
REQUIREMENTS.md (v1.0 + v1.1) → 读取增量内容 → 追加 PRD.md → 增量修改 src/
```

**保证**：
- 原有功能不丢失
- PRD.md 追加新章节，不覆盖
- 代码增量修改

### 3. 问题修复

定位并修复现有问题。

**前提条件**：
- 创建/更新 `ISSUES.md` 问题记录

**流程**：
```
ISSUES.md → 分析根因 → 最小化修复 → 回归测试
```

**保证**：
- REQUIREMENTS.md 不更新
- 最小化修复代码
- 回归测试通过

---

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

---

## 目录结构

### 项目输出结构

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
└── CHANGELOG.md            # AI 生成（追加式）
```

### clawdevflow 自身结构

```
clawdevflow/
├── README.md               # 本文件
├── SKILL.md                # OpenClaw 技能定义
├── config.yaml             # 配置文件
├── 04_coding/src/
│   ├── workflow-executor.js     # 流程执行器
│   ├── workflow-orchestrator.js # 流程编排器
│   ├── ai-tool-adapter.js       # AI 工具适配器
│   ├── state-manager.js         # 状态管理器
│   ├── adapters/                # AI 工具适配器实现
│   │   ├── opencode.js
│   │   ├── claude-code.js
│   │   └── custom.js
│   ├── bundled-skills/          # 内置 skills
│   │   ├── designing/
│   │   ├── roadmapping/
│   │   ├── detailing/
│   │   ├── coding/
│   │   └── reviewing/
│   └── review-*/                # 审阅相关模块
└── install.sh / install.bat     # 安装脚本
```

---

## 配置说明

### config.yaml

```yaml
# 全局设置
global:
  defaultAITool: opencode      # 默认 AI 工具
  workspaceRoot: /path/to/workspace
  logLevel: info

# 各阶段配置
stages:
  designing:
    aiTool: opencode
    requireReview: true
    timeoutSeconds: 1800
    outputDir: 01_designing
    outputs: [PRD.md, TRD.md]

# 回滚策略
rollback:
  strategy: A                  # A=当前阶段重做，B=回滚到上阶段，C=完全重启
  maxRetriesPerStage: 3

# AI 工具配置
aiTools:
  opencode:
    command: opencode
    args: [--print, --permission-mode, bypassPermissions]
  
  claude-code:
    command: claude
    args: [--print, --permission-mode, bypassPermissions]
  
  custom:
    command: /path/to/custom/tool
    env:
      API_KEY: ${CUSTOM_AI_API_KEY}
```

---

## 使用示例

### 示例 1：全新功能

```bash
# 1. 创建需求说明
mkdir -p projects/user-auth-system/01_designing
cat > projects/user-auth-system/REQUIREMENTS.md << EOF
# 用户认证系统 - 需求说明

## v1.0.0（2026-04-01）
### 目标
完整的用户注册、登录、权限管理系统

### 约束条件
- 支持 OAuth2
- 支持 JWT
EOF

# 2. 调用流程引擎
/sessions_spawn clawdevflow
# 任务：用户认证系统
# 场景类型：全新功能
# 需求说明：REQUIREMENTS.md
# 输出目录：projects/user-auth-system/

# 3. 等待各阶段完成并审阅
# 4. 验收通过后提交 Git
```

### 示例 2：增量需求

```bash
# 1. 阅读原有需求
cd projects/ddg-websearch
cat REQUIREMENTS.md

# 2. 追加新需求
cat >> REQUIREMENTS.md << EOF

## v1.1.0（2026-04-01）
### 目标
添加 timeout 参数配置

### 功能需求
- 用户可自定义请求超时时间
- 默认值 30 秒
EOF

# 3. 调用流程引擎
/sessions_spawn clawdevflow
# 任务：DDG 搜索添加 timeout 参数
# 场景类型：增量需求
# 需求说明：REQUIREMENTS.md
# 原有项目：projects/ddg-websearch/

# 4. 流程引擎会读取完整 REQUIREMENTS.md，分析增量内容
# 5. 追加 PRD.md v1.1.0 章节，增量修改 src/
```

### 示例 3：问题修复

```bash
# 1. 记录问题
cat >> ISSUES.md << EOF
## Issue #123（2026-04-01）
### 问题描述
DDG 搜索返回 500 错误

### 根因
超时未处理导致服务崩溃

### 修复版本
v1.0.1
EOF

# 2. 调用流程引擎
/sessions_spawn clawdevflow
# 任务：修复 DDG 500 错误
# 场景类型：问题修复
# 问题记录：ISSUES.md
# 原有项目：projects/ddg-websearch/

# 3. 流程引擎分析根因，最小化修复代码
# 4. 更新 CHANGELOG.md v1.0.1
```

---

## 故障排查

### 查看日志

```bash
# 查看流程执行日志
cat ~/.openclaw/skills/clawdevflow/logs/{workflowId}.log | jq

# 查看特定阶段日志
cat ~/.openclaw/skills/clawdevflow/logs/{workflowId}.log | jq 'select(.stage == "designing")'
```

### 恢复中断的流程

```bash
# 流程会自动检测 state.json 并恢复
/sessions_spawn clawdevflow
# 任务：恢复流程
```

### 常见问题

**Q: opencode 执行失败**
- 检查 `opencode --version` 是否可用
- 检查 AI provider 配置：`opencode providers list`
- 检查 API 额度是否充足

**Q: 流程卡住不动**
- 查看日志：`cat logs/{workflowId}.log`
- 检查 state.json：`cat .cdf-state.json`
- 必要时终止并恢复流程

**Q: 审阅请求未响应**
- 检查 QQ 消息是否正常接收
- 审阅结论格式：`pass` / `conditional` / `reject` / `clarify` / `terminate`

---

## 版本历史

详见 [CHANGELOG.md](CHANGELOG.md)

---

## 相关文档

- [AGENTS.md](../../.openclaw/workspace/AGENTS.md) - 操作手册
- [REQUIREMENTS.md](REQUIREMENTS.md) - 需求说明
- [SKILL.md](04_coding/src/SKILL.md) - OpenClaw 技能定义
- [workflow.md](04_coding/src/workflow.md) - 流程编排逻辑
- [TASK-TEMPLATE.md](04_coding/src/TASK-TEMPLATE.md) - 任务模板

---

## 许可证

MIT License

---

*ClawDevFlow by openclaw-ouyp*
