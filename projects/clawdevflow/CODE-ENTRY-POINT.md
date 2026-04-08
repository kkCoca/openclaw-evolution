# ClawDevFlow 代码级入口说明

> **版本**: v1.0  
> **日期**: 2026-04-08  
> **作者**: openclaw-ouyp

---

## 入口文件

### 1. Skill 入口

**文件**: `~/.openclaw/skills/clawdevflow/SKILL.md`

```yaml
---
name: clawdevflow
displayName: ClawDevFlow (CDF) - 爪刃研发流
entry: workflow-executor.js  # ← 入口文件
triggers:
  - /sessions_spawn clawdevflow
  - /sessions_spawn cdf
---
```

**触发方式**：
```bash
/sessions_spawn clawdevflow
```

---

### 2. 主执行器

**文件**: `~/.openclaw/skills/clawdevflow/workflow-executor.js`

**代码位置**：
```javascript
/**
 * 主函数：执行工作流
 * @param {object} taskConfig - 任务配置
 */
async function executeWorkflow(taskConfig) {
  // 1. 加载配置
  const config = loadConfig();
  
  // 2. 解析任务参数
  const workflowConfig = parseTaskConfig(taskConfig, config);
  
  // 3. 执行流程
  const orchestrator = new WorkflowOrchestrator(config);
  const result = await orchestrator.execute(workflowConfig);
  
  return result;
}
```

**执行流程**：
```
/sessions_spawn clawdevflow
       ↓
workflow-executor.js:executeWorkflow(taskConfig)
       ↓
1. loadConfig() → config.yaml
2. parseTaskConfig() → workflowConfig
3. new WorkflowOrchestrator(config)
4. orchestrator.execute(workflowConfig)
```

---

### 3. 流程编排器

**文件**: `~/.openclaw/skills/clawdevflow/cdf-orchestrator/workflow-orchestrator.js`

**代码位置**：
```javascript
/**
 * 执行工作流
 * @param {object} workflow - 工作流配置
 */
async function execute(workflow) {
  console.log('[Orchestrator] 开始执行工作流', { workflowId: workflow.id });
  
  // 从断点恢复（如有）
  const resumed = await this.stateManager.load();
  
  // 执行各阶段
  while (this.currentStageIndex < STAGES.length) {
    const stageName = STAGES[this.currentStageIndex];
    
    if (stageName === 'designing') {
      // Designing 专用流程（两次确认）
      const result = await this.executeDesigning(workflow);
      // ...处理结果
    } else {
      // 通用阶段流程（roadmapping/detailing/coding/reviewing）
      await this.executeStage(stageName, workflow);
      // ...等待审阅、处理决策
    }
  }
}
```

**阶段定义**：
```javascript
const STAGES = [
  'designing',
  'roadmapping',
  'detailing',
  'coding',
  'reviewing'
];
```

---

## 完整调用链

```
用户触发
  ↓
/sessions_spawn clawdevflow
  ↓
OpenClaw Skill 系统
  ↓
~/.openclaw/skills/clawdevflow/workflow-executor.js:executeWorkflow(taskConfig)
  ↓
1. loadConfig()
   - 读取 ~/.openclaw/skills/clawdevflow/config.yaml
   - 配置 AI 工具、超时、重试策略等

2. parseTaskConfig(taskConfig, config)
   - 解析任务描述字符串
   - 提取：任务、场景类型、需求说明、输出目录、原有项目
   - 生成 workflowConfig

3. new WorkflowOrchestrator(config)
   - 初始化编排器
   - 加载 StateManager
   - 验证 Policy 配置

4. orchestrator.execute(workflowConfig)
   ↓
   ┌─────────────────────────────────────────┐
   │ STAGES[0]: designing                    │
   │  - executeDesigning(workflow)           │
   │  - 生成 PRD.md + TRD.md                 │
   │  - 自动审阅 (D1-D7)                     │
   │  - PRD 确认（第一次）                    │
   │  - TRD 确认（第二次）                    │
   │  - 写入 approved 快照                    │
   └─────────────────────────────────────────┘
   ↓
   ┌─────────────────────────────────────────┐
   │ STAGES[1]: roadmapping                  │
   │  - 入口门禁校验×2                       │
   │  - executeStage('roadmapping')          │
   │  - 生成 ROADMAP.md                      │
   │  - 自动审阅 (R1-R3)                     │
   │  - 重试闭环（最多 3 次）                  │
   └─────────────────────────────────────────┘
   ↓
   ┌─────────────────────────────────────────┐
   │ STAGES[2]: detailing                    │
   │  - executeStage('detailing')            │
   │  - 生成 DETAIL.md                       │
   │  - 自动审阅                             │
   └─────────────────────────────────────────┘
   ↓
   ┌─────────────────────────────────────────┐
   │ STAGES[3]: coding                       │
   │  - executeStage('coding')               │
   │  - 生成 src/                            │
   │  - 自动审阅                             │
   └─────────────────────────────────────────┘
   ↓
   ┌─────────────────────────────────────────┐
   │ STAGES[4]: reviewing                    │
   │  - executeStage('reviewing')            │
   │  - 生成 REVIEW-REPORT.md                │
   │  - 自动审阅                             │
   └─────────────────────────────────────────┘
   ↓
执行完成
```

---

## 任务配置解析

### 用户输入格式

```bash
/sessions_spawn clawdevflow

# 任务：DDG 搜索功能
# 场景类型：全新功能
# 需求说明：REQUIREMENTS.md
# 输出目录：/home/ouyp/Learning/Practice/openclaw-universe/projects/ddg-websearch/
```

### 解析代码

**文件**: `workflow-executor.js:200-280`

```javascript
function parseTaskConfig(taskConfig, config) {
  const workflowId = `cdf-${Date.now()}-${Math.random()}`;
  
  let task = '';
  let scenario = '全新功能';
  let requirementsFile = '';
  let projectPath = '';
  let outputDir = '';
  
  // 从任务描述字符串解析
  const lines = taskConfig.split('\n');
  for (const line of lines) {
    if (line.startsWith('# 任务：')) 
      task = line.replace('# 任务：', '').trim();
    if (line.startsWith('场景类型：')) 
      scenario = line.replace('场景类型：', '').trim();
    if (line.startsWith('需求说明：')) 
      requirementsFile = line.replace('需求说明：', '').trim();
    if (line.startsWith('输出目录：')) 
      outputDir = line.replace('输出目录：', '').trim();
    if (line.startsWith('原有项目：')) 
      projectPath = line.replace('原有项目：', '').trim();
  }
  
  return {
    workflowId,
    task,
    scenario,
    requirementsFile,
    projectPath,
    outputDir
  };
}
```

### 解析结果

```javascript
{
  workflowId: 'cdf-20260408-X7K9',
  task: 'DDG 搜索功能',
  scenario: '全新功能',
  requirementsFile: 'REQUIREMENTS.md',
  projectPath: '/home/ouyp/Learning/Practice/openclaw-universe/projects/ddg-websearch/',
  outputDir: '/home/ouyp/Learning/Practice/openclaw-universe/projects/ddg-websearch/'
}
```

---

## 配置文件

### config.yaml

**文件**: `~/.openclaw/skills/clawdevflow/config.yaml`

```yaml
global:
  defaultAITool: opencode
  workspaceRoot: ${OPENCLAW_WORKSPACE_ROOT:-../../..}
  logLevel: info

stages:
  designing:
    aiTool: opencode
    requireReview: true
    timeoutSeconds: 1800
    policy:
      retry:
        max_total_retries: 3
      small_scope:
        enabled: true
        auto_approve_prd: false
  roadmapping:
    aiTool: opencode
    requireReview: true
    timeoutSeconds: 1800
    maxRetries: 3
  detailing:
    aiTool: opencode
    requireReview: true
    timeoutSeconds: 1800
  coding:
    aiTool: opencode
    requireReview: true
    timeoutSeconds: 3600
  reviewing:
    aiTool: opencode
    requireReview: true
    timeoutSeconds: 1800

rollback:
  strategy: A  # 策略 A：驳回后重新执行当前阶段
  maxRetriesPerStage: 3
```

---

## 状态管理

### StateManager

**文件**: `~/.openclaw/skills/clawdevflow/cdf-orchestrator/state-manager.js`

**核心方法**：

```javascript
class StateManager {
  // 保存状态
  async save() {
    const statePath = path.join(this.projectPath, 'state.json');
    fs.writeFileSync(statePath, JSON.stringify(this.state, null, 2));
  }
  
  // 加载状态（断点续传）
  async load() {
    const statePath = path.join(this.projectPath, 'state.json');
    if (fs.existsSync(statePath)) {
      this.state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      return true;
    }
    return false;
  }
  
  // 更新阶段状态
  updateStage(stageName, stageStatus, additionalData) {
    this.state.stages[stageName].stageStatus = stageStatus;
    Object.assign(this.state.stages[stageName], additionalData);
  }
  
  // 记录状态流转
  logTransition(from, to, event, metadata) {
    this.state.transitions.push({
      from,
      to,
      event,
      timestamp: Date.now(),
      ...metadata
    });
  }
  
  // 写入 approved 快照（Designing 完成后）
  approveTRD(userId, requirementsHash, prdHash, trdHash, notes) {
    this.state.stages.designing.approved = {
      requirementsHash,
      prdHash,
      trdHash,
      requirementsContent: this.state.requirementsContent,
      prdContent: this.state.stages.designing.lastPrdContent,
      trdContent: this.state.stages.designing.lastTrdContent,
      approvedBy: userId,
      approvedAt: new Date().toISOString(),
      transitionId: `TRD_APPROVED_${Date.now()}`
    };
  }
}
```

---

## 关键代码位置索引

### workflow-executor.js

| 功能 | 行号 | 说明 |
|------|------|------|
| `executeWorkflow()` | 20-100 | 主函数 |
| `loadConfig()` | 105-145 | 加载配置 |
| `parseTaskConfig()` | 200-280 | 解析任务配置 |
| `substituteEnvVars()` | 150-180 | 环境变量替换 |

### workflow-orchestrator.js

| 功能 | 行号 | 说明 |
|------|------|------|
| `execute()` | 70-200 | 执行工作流 |
| `executeDesigning()` | 890-1050 | 执行 Designing 阶段 |
| `executeStage()` | 220-350 | 执行通用阶段 |
| `approvePRD()` | 712-790 | PRD 确认 |
| `approveTRD()` | 797-870 | TRD 确认 |
| `executeRoadmapReviewV1()` | 1091-1130 | Roadmap 审阅 |
| `handleRoadmappingReviewDecision()` | 1140-1200 | 处理 Roadmap 审阅结果 |
| `validateRoadmappingEntry()` | 外部工具 | 入口门禁校验 |

### state-manager.js

| 功能 | 行号 | 说明 |
|------|------|------|
| `save()` | 50-70 | 保存状态 |
| `load()` | 75-95 | 加载状态 |
| `updateStage()` | 100-120 | 更新阶段状态 |
| `logTransition()` | 125-145 | 记录状态流转 |
| `approveTRD()` | 200-230 | 写入 approved 快照 |

---

## 调试入口

### 1. 查看日志

```bash
# 查看流程执行日志
cat ~/.openclaw/skills/clawdevflow/logs/{workflowId}.log | jq

# 查看特定阶段日志
cat ~/.openclaw/skills/clawdevflow/logs/{workflowId}.log | jq 'select(.stage == "designing")'
```

### 2. 查看状态

```bash
# 查看当前状态
cat projects/{项目名}/state.json | jq

# 查看 Designing 阶段状态
cat projects/{项目名}/state.json | jq '.stages.designing'

# 查看 approved 快照
cat projects/{项目名}/state.json | jq '.stages.designing.approved'
```

### 3. 手动触发

```javascript
// Node.js REPL 或测试脚本
const executor = require('./workflow-executor.js');

const taskConfig = `
# 任务：测试功能
# 场景类型：全新功能
# 需求说明：REQUIREMENTS.md
# 输出目录：/tmp/test-project/
`;

executor.executeWorkflow(taskConfig);
```

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-04-08 | 初始版本，整理代码级入口说明 |

---

## 参考文档

- `SKILL.md` - Skill 定义文件
- `workflow-executor.js` - 主执行器
- `workflow-orchestrator.js` - 流程编排器
- `state-manager.js` - 状态管理器
- `config.yaml` - 配置文件
- `TASK-TEMPLATE.md` - 任务模板

---

*本文档由 openclaw-ouyp 维护*  
**版本**: v1.0 | **状态**: 稳定 ✅
