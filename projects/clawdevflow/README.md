# ClawDevFlow (CDF) - 爪刃研发流

> **版本**: v3.4.0  
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
| **工具适配层预留** | 当前仅支持 OpenCode（保留扩展接口） | 为后续扩展留空间 |
| **状态可追溯** | .cdf-state.json 持久化，支持断点续传 | 中断后可恢复，决策可追溯 |
| **运行态隔离** | .cdf-work/ 存放审阅请求与临时产物 | 不影响提交，避免 precommit 阻塞 |
| **回滚灵活** | 策略 A（驳回后重新执行当前阶段） | 不影响已通过阶段 |

---

## 快速开始

### 1. 安装

```bash
# Linux / macOS
cd <path-to-repo>/projects/clawdevflow/04_coding/src
./install.sh

# Windows PowerShell
cd <path-to-repo>/projects/clawdevflow/04_coding/src
.\install.bat
```

### 2. 配置

编辑 `config.yaml` 配置阶段参数（当前仅支持 OpenCode）：

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
# 需求说明：REQUIREMENTS.md（可用“需求描述”替代）
# 问题记录（问题修复）：ISSUES.md
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
REQUIREMENTS.md → designing → roadmapping → detailing → coding → testing → reviewing → precommit → releasing
```

**输出**：
- `01_designing/PRD.md` - 产品需求文档
- `01_designing/TRD.md` - 技术设计文档
- `02_roadmapping/ROADMAP.md` - 研发路线图
- `03_detailing/DETAIL.md` - 详细设计
- `04_coding/src/` + `04_coding/CHANGESET.md` - 源代码与变更说明
- `06_testing/TEST_RESULTS.json` + `VERIFY_RESULTS.json` + `VERIFICATION_REPORT.md` - 测试与验收证据
- `05_reviewing/FINAL_REPORT.md` + `RELEASE_READINESS.json` - 验收报告与发布就绪
- `07_precommit/PRECOMMIT_REPORT.json` + `PRECOMMIT_SUMMARY.md` - 提交前检查证据
- `08_releasing/RELEASE_RECORD.json` + `RELEASE_NOTES.md` - 发布证据
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
designing → [审阅] → roadmapping → [审阅] → detailing → [审阅] → coding → [审阅] → testing → [审阅] → reviewing → [审阅] → precommit → [审阅] → releasing
    ↓            ↓           ↓           ↓          ↓           ↓         ↓           ↓         ↓           ↓         ↓           ↓         ↓           ↓
  PRD+TRD    通过/驳回   ROADMAP    通过/驳回    DETAIL    通过/驳回  src+CHANGESET 通过/驳回  TEST_RESULTS 通过/驳回  FINAL_REPORT 通过/驳回  PRECOMMIT_REPORT 通过/驳回  RELEASE_RECORD
```

> 阶段顺序与产物合同以 `04_coding/src/cdf-orchestrator/constants.js` 与 `04_coding/src/config/config.yaml` 为唯一事实源。

### 审阅结论选项

| 结论 | 标识 | 后续动作 |
|------|------|---------|
| ✅ 通过 | `pass` | 进入下一阶段 |
| ⚠️ 条件通过 | `conditional` | designing 放行；其余自动阶段按驳回处理并触发返工 |
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
└── 08_releasing/
    ├── RELEASE_RECORD.json   # AI 生成
    ├── RELEASE_NOTES.md      # AI 生成
    ├── ARTIFACT_MANIFEST.json # AI 生成
    ├── CLEANUP_PLAN.json     # AI 生成
    └── CLEANUP_REPORT.json   # AI 生成
└── CHANGELOG.md            # AI 生成（追加式）
```

### clawdevflow 自身结构

```
clawdevflow/
├── README.md               # 本文件
├── 04_coding/src/
│   ├── SKILL.md                # OpenClaw 技能定义
│   ├── config/                 # 配置文件
│   │   └── config.yaml
│   ├── workflow-executor.js     # 流程执行器
│   ├── cdf-orchestrator/        # 流程编排器与状态机
│   │   ├── workflow-orchestrator.js
│   │   └── state-manager.js
│   ├── ai-tools/                # AI 工具适配层
│   │   ├── opencode.js
│   │   ├── types.js
│   │   └── index.js
│   ├── bundled-skills/          # 内置 skills
│   │   ├── designing/
│   │   ├── roadmapping/
│   │   ├── detailing/
│   │   ├── coding/
│   │   ├── testing/
│   │   ├── reviewing/
│   │   ├── precommit/
│   │   └── releasing/
│   └── review-*/                # 审阅相关模块
└── install.sh / install.bat     # 安装脚本
```

---

## 配置说明

### 环境变量配置

clawdevflow 支持通过环境变量配置运行时参数，优先级高于配置文件。

| 环境变量 | 说明 | 默认值 | 示例 |
|---------|------|--------|------|
| `OPENCLAW_WORKSPACE_ROOT` | OpenClaw 工作区根目录 | `../../..` (相对路径) | `/home/ouyp/.openclaw/workspace` |
| `CDF_LOG_LEVEL` | 日志级别 | `info` | `debug` / `info` / `warn` / `error` |
| `CDF_DEFAULT_AI_TOOL` | 默认 AI 工具 | `opencode` | `opencode` |
| `CDF_RUNTIME_DIR` | 运行态目录 | `.cdf-work` | `.cdf-work` |

**配置方式**：

```bash
# 方式 1：临时设置（当前终端会话有效）
export OPENCLAW_WORKSPACE_ROOT=/home/ouyp/.openclaw/workspace
export CDF_LOG_LEVEL=debug

# 方式 2：写入 ~/.bashrc 或 ~/.zshrc（永久生效）
echo 'export OPENCLAW_WORKSPACE_ROOT=/home/ouyp/.openclaw/workspace' >> ~/.bashrc
source ~/.bashrc

# 方式 3：在调用时设置
OPENCLAW_WORKSPACE_ROOT=/path/to/workspace /sessions_spawn clawdevflow
```

**config.yaml 中使用环境变量**：

```yaml
global:
  # 使用环境变量，支持默认值语法 ${VAR:-default}
  workspaceRoot: ${OPENCLAW_WORKSPACE_ROOT:-../../..}
  logLevel: ${CDF_LOG_LEVEL:-info}
  defaultAITool: ${CDF_DEFAULT_AI_TOOL:-opencode}
  runtimeDir: ${CDF_RUNTIME_DIR:-.cdf-work}
```

### config.yaml

```yaml
# 全局设置
global:
  defaultAITool: opencode      # 默认 AI 工具
  workspaceRoot: /path/to/workspace
  logLevel: info
  runtimeDir: .cdf-work        # 运行态目录（可用 CDF_RUNTIME_DIR 覆盖）

# 各阶段配置
stages:
  designing:
    aiTool: opencode
    requireReview: true
    timeoutSeconds: 1800
    outputDir: 01_designing
    outputsAllOf: [PRD.md, TRD.md]

# 回滚策略
rollback:
  strategy: A                  # A=当前阶段重做，B=回滚到上阶段，C=完全重启
  maxRetriesPerStage: 3

# OpenCode CLI 配置
openclaw:
  command: opencode
  args: ["--print"]
  taskArg: "--task"
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
当前版本仅输出控制台日志，暂不生成日志文件。
```

### 恢复中断的流程

```bash
# 流程会自动检测 .cdf-state.json 并恢复
/sessions_spawn clawdevflow
# 任务：恢复流程
```

### 运行态文件与清理

- `.cdf-state.json`：流程状态（可恢复），禁止提交
- `.cdf-work/`：审阅请求与临时产物（运行态目录），禁止提交

如需清理运行态文件，可删除上述目录/文件，不影响已生成的正式产出。

### 常见问题

**Q: opencode 执行失败**
- 检查 `opencode --version` 是否可用
- 检查 AI provider 配置：`opencode providers list`
- 检查 API 额度是否充足

**Q: 流程卡住不动**
- 查看控制台日志输出
- 检查 .cdf-state.json：`cat .cdf-state.json`
- 必要时终止并恢复流程

**Q: 审阅请求未响应**
- 检查 QQ 消息是否正常接收
- 审阅结论格式：`pass` / `conditional` / `reject` / `clarify` / `terminate`
- 审阅请求文件位于 `.cdf-work/review-requests/`

---

## 测试与覆盖率

### 运行测试

```bash
cd 04_coding/src

# 运行全量测试
npm test

# 运行特定测试
npm run test:state       # State Manager 测试
npm run test:workflow    # Workflow Orchestrator 测试
npm run test:review      # Review 系统测试
```

### 覆盖率报告

clawdevflow 使用 nyc 进行代码覆盖率测量，目标覆盖率为 80%+。

```bash
cd 04_coding/src

# 运行测试并生成覆盖率报告
npm run test:coverage

# 查看文本覆盖率报告
# 输出到终端

# 生成 HTML 可视化报告
npm run report:coverage

# 在浏览器中打开 HTML 报告
# Linux/macOS:
xdg-open coverage/index.html  # Linux
open coverage/index.html      # macOS

# Windows:
start coverage/index.html
```

**覆盖率报告说明**：

| 报告类型 | 位置 | 说明 |
|---------|------|------|
| 文本报告 | 终端输出 | 快速查看各文件覆盖率 |
| HTML 报告 | `coverage/index.html` | 交互式可视化报告，支持点击查看详情 |
| 摘要报告 | `coverage/coverage-summary.json` | JSON 格式，便于 CI 集成 |

**覆盖率门槛**：

| 指标 | 目标 | 说明 |
|------|------|------|
| Lines | 80%+ | 代码行覆盖率 |
| Functions | 80%+ | 函数覆盖率 |
| Branches | 80%+ | 分支覆盖率 |
| Statements | 80%+ | 语句覆盖率 |

---

## 版本历史

详见 [CHANGELOG.md](CHANGELOG.md)

---

## 相关文档

- [AGENTS.md](../../.openclaw/workspace/AGENTS.md) - 操作手册
- [REQUIREMENTS.md](REQUIREMENTS.md) - 需求说明
- [docs/ClawDevFlow-Guide.md](docs/ClawDevFlow-Guide.md) - 运行与部署指南
- [SKILL.md](04_coding/src/SKILL.md) - OpenClaw 技能定义
- [workflow-executor.js](04_coding/src/workflow-executor.js) - 流程执行入口
- [TASK-TEMPLATE.md](04_coding/src/TASK-TEMPLATE.md) - 任务模板

---

## 许可证

MIT License

---

*ClawDevFlow by openclaw-ouyp*
