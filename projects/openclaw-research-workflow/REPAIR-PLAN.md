# OpenClaw Research Workflow 技能修复方案

> **文档类型**: 系统修复方案  
> **版本**: v1.0.0  
> **日期**: 2026-03-31  
> **作者**: openclaw-ouyp  
> **适用范围**: 全公司研发体系

---

## 📋 执行摘要

### 问题概述

`openclaw-research-workflow` 技能已安装到 OpenClaw，但**无法正确调用 AI 工具执行研发流程**。

### 根本原因

**技能入口文件 `workflow.md` 是 Markdown 文档，不是可执行代码**。OpenClaw 无法执行 `.md` 文件，导致整个流程引擎无法启动。

### 影响范围

| 影响项 | 程度 | 说明 |
|-------|------|------|
| **技能可用性** | 🔴 严重 | 技能完全无法使用 |
| **研发流程** | 🔴 严重 | 无法自动化执行 |
| **公司推广** | 🔴 严重 | 无法分享给团队使用 |
| **已有项目** | 🟡 中等 | 不影响已生成的项目 |

### 修复目标

1. ✅ 创建可执行的 JavaScript 入口文件
2. ✅ 实现完整的流程编排逻辑
3. ✅ 确保 AI 工具正确调用（OpenCode/Claude Code）
4. ✅ 实现审阅驱动机制
5. ✅ 实现状态持久化（断点续传）
6. ✅ 通过完整测试验证

---

## 🔍 问题分析

### 当前技能结构

```
/home/ouyp/.openclaw/skills/openclaw-research-workflow/
├── SKILL.md              # ✅ 技能定义
├── workflow.md           # ❌ 问题文件（Markdown 文档，无法执行）
├── ai-tool-adapter.js    # ✅ 有实现但未被调用
├── state-manager.js      # ✅ 有实现但未被调用
├── config.yaml           # ✅ 配置文件
├── bundled-skills/       # ✅ 子技能
└── ...
```

### SKILL.md 配置

```yaml
name: openclaw-research-workflow
entry: workflow.md        # ❌ 错误：指向 Markdown 文档
triggers:
  - /sessions_spawn openclaw-research-workflow
```

### OpenClaw 技能入口要求

| 文件类型 | 是否支持 | 说明 |
|---------|---------|------|
| `.js` | ✅ 支持 | Node.js 脚本 |
| `.sh` | ✅ 支持 | Shell 脚本 |
| `.md` | ❌ 不支持 | Markdown 文档 |
| `.py` | ⚠️ 视情况 | Python 脚本 |

---

## 🎯 修复目标

### 功能目标

| 目标 | 验收标准 | 优先级 |
|------|---------|--------|
| **可执行入口** | 创建 `workflow-executor.js` | P0 |
| **流程编排** | 实现 5 阶段完整流程 | P0 |
| **AI 工具调用** | 正确调用 OpenCode/Claude Code | P0 |
| **审阅驱动** | 每阶段必须审阅确认 | P0 |
| **状态持久化** | state.json 支持断点续传 | P1 |
| **日志追溯** | 完整 JSON Lines 日志 | P1 |
| **回滚机制** | 策略 A/B/C 可配置 | P2 |

### 质量目标

| 指标 | 目标值 | 测量方式 |
|------|--------|---------|
| **流程执行成功率** | > 95% | 10 次执行测试 |
| **AI 工具调用成功率** | > 98% | 50 次调用测试 |
| **状态持久化可靠性** | 100% | 中断恢复测试 |
| **日志完整性** | 100% | 日志审计 |

---

## 🏗️ 技术方案

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    流程引擎 (workflow-executor.js)           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  入口层 (Entry Point)                                │   │
│  │  - 解析任务参数                                      │   │
│  │  - 加载配置文件                                      │   │
│  │  - 初始化状态管理器                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  编排层 (Orchestration Layer)                        │   │
│  │  - 状态机管理                                        │   │
│  │  - 阶段调度                                          │   │
│  │  - 审阅协议执行                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  适配层 (Adapter Layer)                              │   │
│  │  - AI 工具适配器 (OpenCode/Claude Code/Custom)        │   │
│  │  - 统一调用接口                                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │ 子会话 1 │          │ 子会话 2 │          │ 子会话 5 │
   │designing│          │roadmap  │          │reviewing│
   └─────────┘          └─────────┘          └─────────┘
```

### 核心模块

#### 1. 入口模块 (`workflow-executor.js`)

```javascript
/**
 * OpenClaw Research Workflow Executor
 * 
 * 流程引擎主入口，负责：
 * - 解析任务参数
 * - 加载配置
 * - 执行流程编排
 * - 处理审阅协议
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const StateManager = require('./state-manager');
const AIToolAdapter = require('./ai-tool-adapter');

// 主函数
async function executeWorkflow(taskConfig) {
  // 1. 加载配置
  const config = loadConfig();
  
  // 2. 初始化状态管理器
  const stateManager = new StateManager(config);
  
  // 3. 解析任务参数
  const workflow = parseTaskConfig(taskConfig);
  
  // 4. 执行流程
  await runWorkflow(workflow, config, stateManager);
  
  // 5. 保存状态
  stateManager.save();
}

// 导出给 OpenClaw 调用
module.exports = { executeWorkflow };
```

#### 2. 状态管理器 (`state-manager.js`)

**已有实现，需要验证完整性**

```javascript
class StateManager {
  constructor(config) {
    this.config = config;
    this.state = this.loadOrCreateState();
  }
  
  // 状态管理方法
  updateStage(stageName, status, data = {}) {}
  setSessionId(stageName, sessionId) {}
  addOutputs(stageName, outputs) {}
  recordReviewDecision(stageName, decision, notes) {}
  
  // 持久化
  save() {}
  load() {}
}
```

#### 3. AI 工具适配器 (`ai-tool-adapter.js`)

**已有实现，需要验证完整性**

```javascript
class OpenCodeAdapter extends AIToolAdapter {
  async execute(stageName, input) {
    // 1. 构建任务描述
    const task = this.buildTask(stageName, input);
    
    // 2. 调用 OpenCode（通过 sessions_spawn）
    const session = await this.spawnSession(task);
    
    // 3. 等待完成
    const result = await this.waitForCompletion(session.id);
    
    return result;
  }
}
```

#### 4. 流程编排器 (`workflow-orchestrator.js`)

**需要新建**

```javascript
class WorkflowOrchestrator {
  constructor(config, stateManager) {
    this.config = config;
    this.stateManager = stateManager;
    this.adapter = new AIToolAdapter(config);
  }
  
  async executeStage(stageName) {
    // 1. 更新状态为执行中
    this.stateManager.updateStage(stageName, 'running');
    
    // 2. 准备阶段输入
    const input = await this.prepareStageInput(stageName);
    
    // 3. 调用 AI 工具
    const result = await this.adapter.execute(stageName, input);
    
    // 4. 记录输出
    this.stateManager.addOutputs(stageName, result.outputs);
    
    // 5. 更新状态为待审阅
    this.stateManager.updateStage(stageName, 'reviewing');
    
    // 6. 发送审阅请求
    await this.sendReviewRequest(stageName, result.outputs);
    
    return result;
  }
  
  async waitForReview(stageName) {
    // 等待用户审阅确认
    // 支持：pass / conditional / reject / clarify / terminate
  }
}
```

---

## 📝 实施计划

### 阶段 1：核心框架（2 人天）

| 任务 | 说明 | 验收标准 |
|------|------|---------|
| **1.1 创建入口文件** | `workflow-executor.js` | 可被 OpenClaw 调用 |
| **1.2 验证状态管理器** | 检查 `state-manager.js` | 状态持久化正常 |
| **1.3 验证 AI 适配器** | 检查 `ai-tool-adapter.js` | 可调用 OpenCode |
| **1.4 创建编排器** | `workflow-orchestrator.js` | 5 阶段流程可执行 |

### 阶段 2：审阅协议（1 人天）

| 任务 | 说明 | 验收标准 |
|------|------|---------|
| **2.1 实现审阅请求** | 生成审阅表格 | 格式正确 |
| **2.2 实现决策处理** | 处理 5 种审阅结论 | 状态流转正确 |
| **2.3 实现回滚机制** | 策略 A/B/C | 回滚后状态正确 |

### 阶段 3：日志与监控（0.5 人天）

| 任务 | 说明 | 验收标准 |
|------|------|---------|
| **3.1 实现日志记录** | JSON Lines 格式 | 日志完整 |
| **3.2 创建日志查看器** | `log-viewer.js` | 可查询日志 |
| **3.3 实现进度通知** | 每阶段完成通知 | 通知及时 |

### 阶段 4：测试验证（1.5 人天）

| 任务 | 说明 | 验收标准 |
|------|------|---------|
| **4.1 单元测试** | 各模块独立测试 | 覆盖率 > 80% |
| **4.2 集成测试** | 完整流程测试 | 10 次执行成功率 > 95% |
| **4.3 中断恢复测试** | 断点续传测试 | 恢复后状态正确 |
| **4.4 用户验收测试** | 真实场景测试 | 3 个项目验证 |

---

## 🧪 测试计划

### 测试场景

#### 场景 1：全新功能开发

```bash
# 测试命令
/sessions_spawn openclaw-research-workflow

# 任务：用户认证系统
# 场景类型：全新功能
# 需求说明：REQUIREMENTS.md
# 输出目录：/home/ouyp/Learning/Practice/openclaw-universe/projects/user-auth-system/
```

**验收标准**：
- [ ] 5 个阶段依次执行
- [ ] 每阶段都发送审阅请求
- [ ] 审阅通过后进入下一阶段
- [ ] 所有产出文件正确生成

#### 场景 2：增量需求开发

```bash
# 测试命令
/sessions_spawn openclaw-research-workflow

# 任务：DDG 搜索添加 timeout 参数
# 场景类型：增量需求
# 需求说明：REQUIREMENTS.md（已追加 v1.1.0）
# 原有项目：/home/ouyp/Learning/Practice/openclaw-universe/projects/ddg-websearch/
# 输出目录：/home/ouyp/Learning/Practice/openclaw-universe/projects/ddg-websearch/
```

**验收标准**：
- [ ] 读取原有 PRD.md
- [ ] 追加 v1.1.0 章节（不覆盖）
- [ ] 原功能测试通过
- [ ] 新功能测试通过

#### 场景 3：问题修复

```bash
# 测试命令
/sessions_spawn openclaw-research-workflow

# 任务：修复 DDG 500 错误
# 场景类型：问题修复
# 问题记录：ISSUES.md
# 原有项目：/home/ouyp/Learning/Practice/openclaw-universe/projects/ddg-websearch/
# 输出目录：/home/ouyp/Learning/Practice/openclaw-universe/projects/ddg-websearch/
```

**验收标准**：
- [ ] REQUIREMENTS.md 不更新
- [ ] ISSUES.md 记录问题
- [ ] 最小化修复代码
- [ ] 回归测试通过

#### 场景 4：中断恢复

```bash
# 测试步骤
1. 启动流程
2. 在 roadmapping 阶段中断（模拟）
3. 重新启动流程
4. 验证从 roadmapping 阶段继续
```

**验收标准**：
- [ ] 已通过的阶段不重做
- [ ] 从断点阶段继续
- [ ] 状态正确恢复

---

## 📊 质量保证

### 代码审查清单

| 检查项 | 检查人 | 状态 |
|-------|--------|------|
| **入口文件可执行** | openclaw-ouyp | ⬜ |
| **状态持久化正确** | openclaw-ouyp | ⬜ |
| **AI 工具调用正确** | openclaw-ouyp | ⬜ |
| **审阅协议完整** | openclaw-ouyp | ⬜ |
| **回滚机制可靠** | openclaw-ouyp | ⬜ |
| **日志记录完整** | openclaw-ouyp | ⬜ |
| **错误处理完善** | openclaw-ouyp | ⬜ |
| **文档完整准确** | openclaw-ouyp | ⬜ |

### 测试覆盖率要求

| 模块 | 目标覆盖率 | 测量工具 |
|------|-----------|---------|
| `workflow-executor.js` | > 85% | Jest/nyc |
| `state-manager.js` | > 90% | Jest/nyc |
| `ai-tool-adapter.js` | > 85% | Jest/nyc |
| `workflow-orchestrator.js` | > 80% | Jest/nyc |

---

## 🚀 部署方案

### 部署步骤

```bash
# 第 1 步：备份现有技能
cp -r ~/.openclaw/skills/openclaw-research-workflow \
      ~/.openclaw/skills/openclaw-research-workflow.backup

# 第 2 步：部署新文件
cd /path/to/fixed/skill
cp workflow-executor.js ~/.openclaw/skills/openclaw-research-workflow/
cp workflow-orchestrator.js ~/.openclaw/skills/openclaw-research-workflow/
# ... 其他文件

# 第 3 步：更新 SKILL.md
# 修改 entry: workflow-executor.js

# 第 4 步：验证安装
openclaw skills list
# 确认 openclaw-research-workflow 状态正常

# 第 5 步：运行测试
/sessions_spawn openclaw-research-workflow
# 任务：测试流程
# 场景类型：全新功能
# ...
```

### 回滚方案

```bash
# 如果部署失败，回滚到备份
rm -rf ~/.openclaw/skills/openclaw-research-workflow
mv ~/.openclaw/skills/openclaw-research-workflow.backup \
   ~/.openclaw/skills/openclaw-research-workflow

# 重启 OpenClaw
openclaw gateway restart
```

---

## 📚 文档更新计划

### 需要更新的文档

| 文档 | 更新内容 | 优先级 |
|------|---------|--------|
| **README.md** | 添加安装/使用指南 | P0 |
| **SKILL.md** | 修正 entry 配置 | P0 |
| **TASK-TEMPLATE.md** | 更新任务模板 | P0 |
| **DEPLOYMENT.md** | 新增部署指南 | P1 |
| **TROUBLESHOOTING.md** | 新增故障排查 | P2 |

### 用户文档

创建用户友好的使用指南：

```markdown
# OpenClaw Research Workflow 使用指南

## 快速开始

### 1. 安装技能
./install.sh

### 2. 使用技能
/sessions_spawn openclaw-research-workflow

# 任务：{任务描述}
# 场景类型：[全新功能 | 增量需求 | 问题修复]
# 需求说明：REQUIREMENTS.md
# 输出目录：/path/to/project/

### 3. 审阅阶段产出
- 查看审阅请求
- 填写验收结论
- 提交确认

### 4. 查看进度
cat logs/{workflowId}.log | jq
```

---

## 📅 项目时间表

| 阶段 | 开始日期 | 结束日期 | 工期 |
|------|---------|---------|------|
| **阶段 1：核心框架** | 2026-03-31 | 2026-04-01 | 2 人天 |
| **阶段 2：审阅协议** | 2026-04-02 | 2026-04-02 | 1 人天 |
| **阶段 3：日志监控** | 2026-04-03 | 2026-04-03 | 0.5 人天 |
| **阶段 4：测试验证** | 2026-04-04 | 2026-04-05 | 1.5 人天 |
| **阶段 5：部署上线** | 2026-04-06 | 2026-04-06 | 0.5 人天 |
| **总计** | | | **5.5 人天** |

---

## 🎯 成功标准

### 技术标准

- [ ] 入口文件可被 OpenClaw 正确调用
- [ ] 5 阶段流程完整执行
- [ ] AI 工具调用成功率 > 98%
- [ ] 状态持久化 100% 可靠
- [ ] 测试覆盖率 > 80%

### 业务标准

- [ ] 可支持全公司研发团队使用
- [ ] 流程执行时间 < 30 分钟/阶段
- [ ] 用户满意度 > 90%
- [ ] 零重大故障

---

## 📞 联系方式

| 角色 | 负责人 | 联系方式 |
|------|--------|---------|
| **项目负责人** | openclaw-ouyp | (内部联系方式) |
| **技术负责人** | TBD | (内部联系方式) |
| **测试负责人** | TBD | (内部联系方式) |

---

## 📝 变更历史

| 版本 | 日期 | 变更说明 | 作者 |
|------|------|---------|------|
| 1.0.0 | 2026-03-31 | 初始版本 | openclaw-ouyp |

---

*本方案由 openclaw-ouyp 编制，适用于全公司研发体系*

**版本**: v1.0.0 | **状态**: 待审批 ⬜ | **下次审查**: 2026-04-07
