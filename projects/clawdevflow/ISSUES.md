# openclaw-research-workflow - 问题记录

---

## Issue #005（2026-03-31）

### 问题描述
技能入口文件配置错误，导致技能无法调用 AI 工具执行研发流程。

### 复现步骤
1. 安装技能：`./install.sh`
2. 尝试调用：`/sessions_spawn openclaw-research-workflow`
3. 技能无响应或报错

### 预期行为
- 技能正常启动
- 执行 5 个阶段流程（designing→roadmapping→detailing→coding→reviewing）
- 每阶段调用 AI 工具（OpenCode/Claude Code）
- 每阶段完成后发送审阅请求

### 实际行为
- 技能无法启动
- 无 AI 工具调用
- 无流程执行

### 根因分析
`SKILL.md` 中配置 `entry: workflow.md`，但 `workflow.md` 是 Markdown 文档，不是可执行代码。OpenClaw 无法执行 `.md` 文件，导致整个流程引擎无法启动。

### 修复方案
1. 创建 `workflow-executor.js` - 可执行的 JavaScript 入口文件
2. 创建 `workflow-orchestrator.js` - 流程编排器
3. 验证 `state-manager.js` 和 `ai-tool-adapter.js` 完整性
4. 更新 `SKILL.md` 中 `entry` 配置为 `workflow-executor.js`
5. 更新版本号至 v2.0.1

### 修复文件
- `~/.openclaw/skills/openclaw-research-workflow/workflow-executor.js`（新创建）
- `~/.openclaw/skills/openclaw-research-workflow/workflow-orchestrator.js`（新创建）
- `~/.openclaw/skills/openclaw-research-workflow/SKILL.md`（修改 entry 配置）

### 修复版本
v2.0.1

### 状态
⬜ 修复中

---

*ISSUES.md 由 openclaw-ouyp 维护，追加式记录所有问题*
