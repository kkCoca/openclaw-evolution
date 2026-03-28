# 流程编排逻辑 (Workflow Orchestration)

> **版本**: v2.0.0  
> **说明**: 流程引擎核心编排逻辑，实现状态机管理、子会话调度、审阅协议执行

---

## 架构设计

### 角色定位

**流程引擎 = 纯编排器**（不执行具体任务，只调度）

```
┌─────────────────────────────────────────────────────────────┐
│                    流程引擎 (编排器)                          │
│                                                             │
│  输入层：                                                    │
│  - 解析任务（场景类型 + REQUIREMENTS.md）                     │
│  - 加载配置（config.yaml）                                   │
│                                                             │
│  编排层：                                                    │
│  - 状态机管理（待执行/执行中/待审阅/通过/驳回）                │
│  - 子会话调度（sessions_spawn）                             │
│  - 审阅协议执行（等待确认→决策→继续/回滚）                    │
│                                                             │
│  适配层：                                                    │
│  - AI 工具抽象（OpenCode/Claude Code/Custom）                │
│  - 统一调用接口（executeStage）                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │ 子会话 1 │          │ 子会话 2 │          │ 子会话 5 │
   │designing│          │roadmap  │          │reviewing│
   │         │          │         │          │         │
   │AI 工具执行│          │AI 工具执行│          │AI 工具执行│
   └─────────┘          └─────────┘          └─────────┘
        ↓                     ↓                     ↓
   PRD.md + TRD.md      ROADMAP.md          REVIEW-REPORT.md
```

---

## 状态机设计

### 状态枚举

```javascript
const StageStatus = {
  PENDING: 'pending',           // 待执行
  RUNNING: 'running',           // 执行中
  REVIEWING: 'reviewing',       // 待审阅
  PASSED: 'passed',             // 通过
  CONDITIONAL_PASSED: 'conditional_passed', // 条件通过
  REJECTED: 'rejected',         // 驳回（重新执行）
  TERMINATED: 'terminated'      // 终止（用户主动停止）
};
```

### 状态流转

```
┌──────────┐    spawn 子会话    ┌──────────┐    子会话完成    ┌──────────┐
│ 待执行   │ ───────────────→ │ 执行中   │ ─────────────→ │ 待审阅   │
│ Pending  │                   │ Running  │                 │ Reviewing│
└──────────┘                   └──────────┘                 └────┬─────┘
                                                                  │
                     ┌────────────────────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────────────────────────────┐
        │              openclaw-ouyp 审阅                 │
        └────────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬────────────┐
        ↓            ↓            ↓            ↓
   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
   │ 通过   │  │条件通过│  │ 驳回   │  │ 需澄清 │
   │ Pass   │  │Conditional││ Reject ││ Clarify│
   └───┬────┘  └───┬────┘  └───┬────┘  └───┬────┘
       │           │           │           │
       │ 进入下一阶段  │ 进入下一阶段  │ 重新执行   │ 回答后重新审阅
       │           │ (记录待修复项)│ 当前阶段   │
       ↓           ↓           ↓           ↓
   ┌────────────────────────────────────────────────┐
   │                  下一阶段                        │
   └────────────────────────────────────────────────┘
```

---

## 核心流程

### 主流程伪代码

```javascript
async function executeWorkflow(taskConfig) {
  // 1. 初始化状态
  const stateManager = new StateManager();
  const config = loadConfig('./config.yaml');
  
  const state = stateManager.init(
    generateWorkflowId(),
    taskConfig.task,
    taskConfig.scenario,
    taskConfig.projectPath
  );
  
  const stages = ['designing', 'roadmapping', 'detailing', 'coding', 'reviewing'];
  
  // 2. 阶段执行循环
  while (true) {
    const currentStage = state.currentStage;
    
    // 检查流程是否完成
    if (stateManager.isCompleted()) {
      log('workflow_completed');
      break;
    }
    
    // 检查流程是否终止
    if (stateManager.isTerminated()) {
      log('workflow_terminated');
      break;
    }
    
    // 3. 执行当前阶段
    await executeStage(currentStage, config, stateManager);
    
    // 4. 等待用户审阅
    const decision = await waitForUserReview(currentStage, stateManager);
    
    // 5. 处理审阅结论
    const result = stateManager.handleReviewDecision(currentStage, decision);
    
    switch (result.action) {
      case 'continue':
        // 进入下一阶段
        const nextStage = stateManager.getNextStage();
        if (!nextStage) {
          // 已是最后阶段，流程完成
          stateManager.updateStage(currentStage, StageStatus.PASSED);
          break;
        }
        stateManager.updateStage(currentStage, StageStatus.PASSED);
        break;
        
      case 'retry':
        // 重新执行当前阶段（策略 A）
        log(`阶段 ${currentStage} 被驳回，重新执行`);
        continue; // 不改变 currentStage，重新执行
        
      case 'wait':
        // 等待用户澄清
        log('等待用户澄清问题');
        continue;
        
      case 'terminate':
        // 流程终止
        stateManager.state.status = StageStatus.TERMINATED;
        stateManager.save();
        log(`流程终止：${result.reason}`);
        return;
    }
  }
  
  return stateManager.getSummary();
}
```

---

## 阶段执行逻辑

### executeStage 函数

```javascript
async function executeStage(stageName, config, stateManager) {
  const stageConfig = config.stages[stageName];
  const aiTool = stageConfig.aiTool || config.global.defaultAITool;
  
  // 1. 更新状态为执行中
  stateManager.updateStage(stageName, StageStatus.RUNNING);
  
  // 2. 准备阶段输入
  const input = await prepareStageInput(stageName, stateManager.state);
  
  // 3. Spawn 子会话执行
  const session = await sessions_spawn({
    task: buildStageTask(stageName, input, stageConfig),
    runtime: "subagent",
    mode: "run",
    timeoutSeconds: stageConfig.timeoutSeconds
  });
  
  // 4. 记录会话 ID
  stateManager.setSessionId(stageName, session.id);
  
  // 5. 等待子会话完成
  const result = await waitForCompletion(session.id);
  
  // 6. 记录输出
  stateManager.addOutputs(stageName, stageConfig.outputs);
  
  // 7. 更新状态为待审阅
  stateManager.updateStage(stageName, StageStatus.REVIEWING);
  
  // 8. 生成审阅请求
  const reviewRequest = await generateReviewRequest(
    stageName,
    stageConfig,
    result.outputs,
    stateManager.state
  );
  
  // 9. 发送审阅请求给用户
  await sendReviewRequest(reviewRequest);
  
  return result;
}
```

---

## 阶段输入准备

### prepareStageInput 函数

```javascript
async function prepareStageInput(stageName, state) {
  const projectPath = state.projectPath;
  
  switch (stageName) {
    case 'designing':
      // 输入：REQUIREMENTS.md
      return {
        requirementsFile: path.join(projectPath, 'REQUIREMENTS.md'),
        scenario: state.scenario
      };
      
    case 'roadmapping':
      // 输入：PRD.md + TRD.md
      return {
        prdFile: path.join(projectPath, '01_designing/PRD.md'),
        trdFile: path.join(projectPath, '01_designing/TRD.md')
      };
      
    case 'detailing':
      // 输入：PRD.md + TRD.md + ROADMAP.md
      return {
        prdFile: path.join(projectPath, '01_designing/PRD.md'),
        trdFile: path.join(projectPath, '01_designing/TRD.md'),
        roadmapFile: path.join(projectPath, '02_roadmapping/ROADMAP.md')
      };
      
    case 'coding':
      // 输入：DETAIL.md + 最佳实践文档
      return {
        detailFile: path.join(projectPath, '03_detailing/DETAIL.md'),
        bestPracticesDir: path.join(__dirname, 'best-practices')
      };
      
    case 'reviewing':
      // 输入：所有产出
      return {
        projectPath: projectPath,
        documents: [
          '01_designing/PRD.md',
          '01_designing/TRD.md',
          '02_roadmapping/ROADMAP.md',
          '03_detailing/DETAIL.md',
          '04_coding/src/',
          '04_coding/tests/',
          '04_coding/README.md'
        ]
      };
      
    default:
      throw new Error(`未知阶段：${stageName}`);
  }
}
```

---

## 审阅请求生成

### generateReviewRequest 函数

```javascript
async function generateReviewRequest(stageName, stageConfig, outputs, state) {
  // 加载审阅协议
  const protocol = loadReviewProtocol(stageName);
  
  // 生成检查点表格
  const checkpoints = protocol.reviewCheckpoints.map(cp => {
    return `| ${cp.id} | ${cp.name} | ⬜ | |`;
  }).join('\n');
  
  // 生成关键决策（从阶段输出中提取）
  const keyDecisions = await extractKeyDecisions(outputs, stageName);
  
  // 填充模板
  const template = stageConfig.reviewTemplate || protocol.requestTemplate;
  const reviewRequest = template
    .replace('{stageName}', stageName)
    .replace('{stageGoal}', protocol.stageGoal)
    .replace('{inputDocuments}', formatInputDocuments(stageName, state))
    .replace('{outputDocuments}', formatOutputDocuments(outputs))
    .replace('{checkpoints}', checkpoints)
    .replace('{keyDecisions}', keyDecisions);
  
  return reviewRequest;
}
```

---

## 回滚机制（策略 A）

### 策略 A 定义

**驳回后重新执行当前阶段，不影响已通过阶段**

### 实现逻辑

```javascript
async function handleReject(stageName, stateManager, rejectReason) {
  const stage = stateManager.state.stages[stageName];
  const maxRetries = 3;
  
  // 检查重试次数
  if (stage.retryCount >= maxRetries) {
    stateManager.updateStage(stageName, StageStatus.TERMINATED);
    throw new Error(`阶段 ${stageName} 超过最大重试次数 (${maxRetries})`);
  }
  
  // 记录驳回原因
  stateManager.recordReviewDecision(stageName, 'reject', rejectReason);
  
  // 重置阶段状态为待执行（策略 A：当前阶段重做）
  stateManager.updateStage(stageName, StageStatus.PENDING, {
    retryCount: stage.retryCount + 1,
    reviewerNotes: rejectReason
  });
  
  // 更新重试计数
  stateManager.state.retries.total += 1;
  stateManager.state.retries.perStage[stageName] = stage.retryCount + 1;
  stateManager.save();
  
  // 记录日志
  stateManager.log('stage_rejected', {
    stage: stageName,
    reason: rejectReason,
    retryCount: stage.retryCount + 1
  });
  
  // 返回重新执行信号
  return { action: 'retry', stage: stageName };
}
```

---

## 状态持久化

### state.json 结构

```json
{
  "workflowId": "wf-20260328-001",
  "task": "DDG 搜索添加 timeout 参数",
  "scenario": "增量需求",
  "projectPath": "/home/ouyp/Learning/Practice/openclaw-universe/projects/ddg-websearch",
  "startedAt": "2026-03-28T10:00:00+08:00",
  "updatedAt": "2026-03-28T10:30:00+08:00",
  "currentStage": "detailing",
  "status": "running",
  "retries": {
    "total": 1,
    "perStage": {
      "detailing": 1
    }
  },
  "stages": {
    "designing": {
      "status": "passed",
      "sessionId": "session-designing-001",
      "outputs": ["01_designing/PRD.md", "01_designing/TRD.md"],
      "reviewDecision": "pass",
      "reviewedAt": "2026-03-28T10:30:00+08:00",
      "reviewerNotes": "",
      "startedAt": "2026-03-28T10:00:00+08:00",
      "completedAt": "2026-03-28T10:30:00+08:00",
      "retryCount": 0
    },
    "roadmapping": {
      "status": "conditional_passed",
      "sessionId": "session-roadmapping-001",
      "outputs": ["02_roadmapping/ROADMAP.md"],
      "reviewDecision": "conditional",
      "reviewedAt": "2026-03-28T11:00:00+08:00",
      "reviewerNotes": "任务 3 工作量估算偏高，后续关注",
      "startedAt": "2026-03-28T10:31:00+08:00",
      "completedAt": "2026-03-28T11:00:00+08:00",
      "retryCount": 0
    },
    "detailing": {
      "status": "reviewing",
      "sessionId": "session-detailing-001",
      "outputs": ["03_detailing/DETAIL.md"],
      "reviewDecision": null,
      "reviewedAt": null,
      "reviewerNotes": null,
      "startedAt": "2026-03-28T11:01:00+08:00",
      "completedAt": null,
      "retryCount": 0
    },
    "coding": {
      "status": "pending",
      "sessionId": null,
      "outputs": [],
      "reviewDecision": null,
      "reviewedAt": null,
      "reviewerNotes": null,
      "startedAt": null,
      "completedAt": null,
      "retryCount": 0
    },
    "reviewing": {
      "status": "pending",
      "sessionId": null,
      "outputs": [],
      "reviewDecision": null,
      "reviewedAt": null,
      "reviewerNotes": null,
      "startedAt": null,
      "completedAt": null,
      "retryCount": 0
    }
  }
}
```

---

## 日志格式

### 日志文件

`logs/{workflowId}.log`（JSON Lines 格式）

### 日志条目示例

```json
{"timestamp":"2026-03-28T10:00:00.000Z","workflowId":"wf-20260328-001","stage":"designing","event":"workflow_started","details":{"task":"DDG 搜索添加 timeout 参数","scenario":"增量需求","projectPath":"/home/ouyp/Learning/Practice/openclaw-universe/projects/ddg-websearch"}}
{"timestamp":"2026-03-28T10:00:01.000Z","workflowId":"wf-20260328-001","stage":"designing","event":"stage_started","details":{"sessionId":"session-designing-001","aiTool":"opencode"}}
{"timestamp":"2026-03-28T10:25:00.000Z","workflowId":"wf-20260328-001","stage":"designing","event":"stage_completed","details":{"sessionId":"session-designing-001","outputs":["01_designing/PRD.md","01_designing/TRD.md"],"durationSeconds":1500}}
{"timestamp":"2026-03-28T10:25:01.000Z","workflowId":"wf-20260328-001","stage":"designing","event":"review_request_sent","details":{"checkpoints":6}}
{"timestamp":"2026-03-28T10:30:00.000Z","workflowId":"wf-20260328-001","stage":"designing","event":"review_decision","details":{"decision":"pass","reviewer":"openclaw-ouyp","notes":""}}
{"timestamp":"2026-03-28T10:30:01.000Z","workflowId":"wf-20260328-001","stage":"roadmapping","event":"stage_started","details":{"sessionId":"session-roadmapping-001","aiTool":"opencode"}}
```

---

## 断点续传

### 恢复流程

```javascript
async function resumeWorkflow() {
  const stateManager = new StateManager();
  const state = stateManager.load();
  
  if (!state) {
    throw new Error('未找到现有流程状态');
  }
  
  // 检查流程是否已完成或终止
  if (stateManager.isCompleted()) {
    log('流程已完成，无需恢复');
    return stateManager.getSummary();
  }
  
  if (stateManager.isTerminated()) {
    log('流程已终止，无法恢复');
    return stateManager.getSummary();
  }
  
  // 从当前阶段继续
  const currentStage = state.currentStage;
  log(`从阶段 ${currentStage} 恢复流程`);
  
  // 继续执行主流程
  return await executeWorkflow(state);
}
```

---

## AI 工具适配

### 工具抽象接口

```javascript
async function executeWithAITool(stageName, input, aiTool, config) {
  switch (aiTool) {
    case 'opencode':
      return await executeWithOpenCode(stageName, input, config.aiTools.opencode);
      
    case 'claude-code':
      return await executeWithClaudeCode(stageName, input, config.aiTools.claude-code);
      
    case 'custom':
      return await executeWithCustomTool(stageName, input, config.aiTools.custom);
      
    default:
      throw new Error(`不支持的 AI 工具：${aiTool}`);
  }
}
```

### OpenCode 适配器示例

```javascript
async function executeWithOpenCode(stageName, input, config) {
  const task = buildStageTask(stageName, input);
  
  const session = await sessions_spawn({
    task: task,
    runtime: "subagent",
    mode: "run",
    timeoutSeconds: config.timeoutSeconds
  });
  
  return await waitForCompletion(session.id);
}
```

---

## 配置加载

### loadConfig 函数

```javascript
function loadConfig(configFile = './config.yaml') {
  const content = fs.readFileSync(configFile, 'utf8');
  const config = yaml.parse(content);
  
  // 替换环境变量
  const resolved = resolveEnvVariables(config);
  
  // 验证配置
  validateConfig(resolved);
  
  return resolved;
}

function resolveEnvVariables(obj) {
  if (typeof obj === 'string') {
    return obj.replace(/\$\{(\w+)\}/g, (match, name) => {
      return process.env[name] || match;
    });
  }
  
  if (Array.isArray(obj)) {
    return obj.map(resolveEnvVariables);
  }
  
  if (typeof obj === 'object') {
    const resolved = {};
    for (const key in obj) {
      resolved[key] = resolveEnvVariables(obj[key]);
    }
    return resolved;
  }
  
  return obj;
}
```

---

## 错误处理

### 错误类型

| 错误类型 | 处理方式 |
|---------|---------|
| 子会话超时 | 重试（最多 3 次），仍失败则驳回 |
| 状态持久化失败 | 立即重试，记录错误日志 |
| 配置文件格式错误 | 使用默认配置，记录警告 |
| 审阅结论解析失败 | 请求用户重新输入 |
| AI 工具调用失败 | 重试（最多 3 次），仍失败则终止 |

### 错误日志

所有错误都会记录到日志文件，并可选地通知用户：

```javascript
async function handleError(error, context) {
  stateManager.log('error', {
    type: error.name,
    message: error.message,
    stack: error.stack,
    context
  });
  
  // 判断是否需要用户介入
  if (isCriticalError(error)) {
    await notifyUser(`流程遇到严重错误：${error.message}`);
  }
}
```

---

*本文档由 openclaw-ouyp 维护*  
**版本**: v2.0.0  
**状态**: 开发中 🚧
