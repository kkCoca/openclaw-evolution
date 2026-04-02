# ClawDevFlow 调用流程环节图

**日期**: 2026-04-02  
**版本**: v3.0.1  
**项目**: `/home/ouyp/Learning/Practice/openclaw-universe/projects/clawdevflow/04_coding/src/`

---

## 一、整体调用流程总览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           用户调用                                       │
│                    /sessions_spawn clawdevflow                          │
│                    任务：{任务描述}                                      │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  环节 1: Workflow Executor (workflow-executor.js)                       │
│  职责：加载配置、解析任务、启动流程                                      │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  环节 2: Workflow Orchestrator (workflow-orchestrator.js)               │
│  职责：阶段编排、状态管理、审阅协调                                      │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ↓                        ↓                        ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  环节 3:         │  │  环节 4:         │  │  环节 5:         │
│  Stage Executor  │  │  Review          │  │  State           │
│  (阶段执行)       │  │  Orchestrator    │  │  Manager         │
│                  │  │  (审阅编排)       │  │  (状态管理)       │
└────────┬─────────┘  └────────┬─────────┘  └──────────────────┘
         │                     │
         ↓                     ↓
┌──────────────────┐  ┌──────────────────┐
│  环节 6:         │  │  环节 7:         │
│  AI Tool         │  │  Review          │
│  Adapter         │  │  Agents          │
│  (调用 OpenCode)  │  │  (审阅 Agent)     │
└──────────────────┘  └──────────────────┘
```

---

## 二、环节 1: Workflow Executor 调用流程

**文件**: `workflow-executor.js`

```
┌─────────────────────────────────────────────────────────────────┐
│                     Workflow Executor                            │
│                     (工作流执行器)                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  executeWorkflow  │
                    │  (taskConfig)     │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                    │  1. 加载配置       │
                    │  loadConfig()     │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  读取 config.yaml  │
                    │  - defaultAITool  │
                    │  - workspaceRoot  │
                    │  - 各阶段配置      │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  2. 解析任务参数   │
                    │  parseTaskConfig()│
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  提取配置：        │
                    │  - workflowId     │
                    │  - scenario       │
                    │  - projectPath    │
                    │  - requirements   │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  3. 执行流程编排   │
                    │  orchestrator.    │
                    │  execute(config)  │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  4. 输出结果       │
                    │  - success        │
                    │  - workflowId     │
                    │  - report         │
                    └───────────────────┘
```

### 输入输出

| 类型 | 名称 | 说明 |
|------|------|------|
| **输入** | `taskConfig` | 用户任务描述（来自 sessions_spawn） |
| **输出** | `result` | `{ success, workflowId, report, error }` |

### 关键代码

```javascript
// workflow-executor.js
async function executeWorkflow(taskConfig) {
  // 1. 加载配置
  const config = loadConfig();  // 读取 config.yaml
  
  // 2. 解析任务参数
  const workflowConfig = parseTaskConfig(taskConfig, config);
  // 提取：workflowId, scenario, projectPath, requirementsFile
  
  // 3. 执行流程编排
  const orchestrator = new WorkflowOrchestrator(config);
  const result = await orchestrator.execute(workflowConfig);
  
  // 4. 输出结果
  return result;
}
```

---

## 三、环节 2: Workflow Orchestrator 编排流程

**文件**: `cdf-orchestrator/workflow-orchestrator.js`

```
┌─────────────────────────────────────────────────────────────────┐
│                   Workflow Orchestrator                          │
│                    (流程编排器)                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  execute()        │
                    │  (workflowConfig) │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                    │  1. 初始化状态管理器│
                    │  new StateManager()│
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  创建 state.json   │
                    │  记录元数据：      │
                    │  - scenario       │
                    │  - startTime      │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  2. 阶段循环       │
                    │  for stage in     │
                    │  STAGE_SEQUENCE   │
                    └─────────┬─────────┘
                              │
                              ↓
              ┌───────────────────────────────┐
              │   STAGE_SEQUENCE = [          │
│     DESIGNING → ROADMAPPING → DETAILING →   │
│     CODING → TESTING → REVIEWING            │
│   ]                                         │
              └───────────────────────────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  executeStage()   │
                    │  (stageName)      │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                    │  a. 准备阶段输入   │
                    │  prepareStageInput│
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  b. 执行阶段       │
                    │  stageExecutor.   │
                    │  execute()        │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  c. 执行审阅       │
                    │  reviewOrchestrator│
                    │  .review()        │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  d. 处理审阅决策   │
                    │  handleReview     │
                    │  Decision()       │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                    │  decision = ?     │
                    └─────────┬─────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ↓                 ↓                 ↓
      ┌──────────┐     ┌──────────┐     ┌──────────┐
      │ pass     │     │conditional│    │ reject   │
      │ 进入下   │     │ 进入下    │     │ 重新执行 │
      │ 一阶段   │     │ 阶段+记录  │     │ 当前阶段 │
      └──────────┘     └──────────┘     └──────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  3. 完成工作流     │
                    │  stateManager.    │
                    │  complete()       │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  4. 生成报告       │
                    │  stateManager.    │
                    │  getReport()      │
                    └─────────┬─────────┘
```

### 输入输出

| 类型 | 名称 | 说明 |
|------|------|------|
| **输入** | `workflowConfig` | `{ projectPath, scenario, requirementsFile }` |
| **输出** | `result` | `{ success, workflowId, report, failedStage, error }` |

### 阶段序列

```javascript
const STAGE_SEQUENCE = [
  Stage.DESIGNING,    // 01_designing/
  Stage.ROADMAPPING,  // 02_roadmapping/
  Stage.DETAILING,    // 03_detailing/
  Stage.CODING,       // 04_coding/src/
  Stage.TESTING,      // 04_coding/tests/
  Stage.REVIEWING     // 05_reviewing/
];
```

---

## 四、环节 3: Stage Executor 执行流程

**文件**: `cdf-orchestrator/stage-executor.js`

```
┌─────────────────────────────────────────────────────────────────┐
│                      Stage Executor                              │
│                      (阶段执行器)                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  execute()        │
                    │  (stageName,      │
                    │   input,          │
                    │   projectPath)    │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                    │  switch(stageName)│
                    └─────────┬─────────┘
                              │
        ┌─────────┬───────────┼───────────┬─────────┐
        │         │           │           │         │
        ↓         ↓           ↓           ↓         ↓
  ┌──────────┐ ┌──────┐ ┌──────────┐ ┌──────┐ ┌──────────┐
  │designing │ │road- │ │detailing │ │coding│ │reviewing │
  │          │ │mapping│ │          │ │      │ │          │
  └────┬─────┘ └───┬──┘ └────┬─────┘ └──┬───┘ └────┬─────┘
       │           │          │          │          │
       ↓           ↓          ↓          ↓          ↓
  ┌─────────────────────────────────────────────────┐
  │  executeXXX(input, projectPath)                 │
  │  1. 创建输出目录                                 │
  │  2. 调用 AI 工具适配器                            │
  │  3. 返回输出文件列表                             │
  └─────────────────────────────────────────────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  aiAdapter.       │
                    │  execute(stage,   │
                    │            input) │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  返回：            │
                    │  { success,       │
                    │    outputs,       │
                    │    error }        │
                    └───────────────────┘
```

### 以 Roadmapping 阶段为例

```javascript
// stage-executor.js
async executeRoadmapping(input, projectPath) {
  // 1. 创建输出目录
  const roadmappingPath = path.join(projectPath, '02_roadmapping');
  const designingPath = path.join(projectPath, '01_designing');
  
  if (!fs.existsSync(roadmappingPath)) {
    fs.mkdirSync(roadmappingPath, { recursive: true });
  }
  
  // 2. 调用 AI 工具适配器
  const result = await this.aiAdapter.execute('roadmapping', {
    projectPath: projectPath,
    designingPath: designingPath,
    outputDir: roadmappingPath
  });
  
  // 3. 返回输出文件
  return {
    success: true,
    outputs: result.outputs.map(o => ({
      name: path.basename(o),
      path: path.relative(projectPath, o)
    }))
  };
}
```

---

## 五、环节 4: AI Tool Adapter 调用流程

**文件**: `adapters/opencode.js`

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Tool Adapter                               │
│                   (OpenCode 适配器)                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  execute()        │
                    │  (stageName,      │
                    │   input)          │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  1. 构建任务描述   │
                    │  buildTask()      │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  根据 stageName   │
                    │  生成不同的任务   │
                    │  描述             │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  2. Spawn 子会话   │
                    │  spawnSession()   │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  sessions_spawn({ │
                    │    task: task,    │
                    │    runtime:       │
                    │      "subagent",  │
                    │    mode: "run",   │
                    │    timeoutSeconds:│
                    │      1800         │
                    │  })               │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  3. 等待完成       │
                    │  waitForCompletion│
                    │  (sessionKey)     │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  轮询检查输出文件  │
                    │  checkOutputs()   │
                    │  (每 3 秒一次)       │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  检测到输出文件？  │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                    │ YES               │ NO
                    │                   │
                    ↓                   ↓
              ┌──────────┐        ┌──────────┐
              │ 返回     │        │ 继续轮询 │
              │ outputs  │        │ 或超时   │
              └──────────┘        └──────────┘
```

### 任务描述构建示例

```javascript
// adapters/opencode.js
buildTask(stageName, input) {
  const stageTasks = {
    designing: `你是一个产品设计专家。请执行 designing skill：

1. 阅读需求文件：${input.requirementsFile}
2. 分析需求并生成 PRD.md 和 TRD.md
3. 输出到目录：${input.outputDir}

要求：
- PRD.md 包含完整的产品需求、用户故事、验收标准
- TRD.md 包含技术选型、架构设计、接口定义
- 直接创建文件到指定目录`,

    roadmapping: `你是一个技术项目经理。请执行 roadmapping skill：

1. 阅读设计文档：${input.designingPath}/PRD.md 和 TRD.md
2. 生成详细的开发计划 ROADMAP.md
3. 输出到目录：${input.outputDir}

要求：
- 任务拆分到可执行粒度
- 包含依赖关系和优先级
- 直接创建文件到指定目录`
  };
  
  return stageTasks[stageName];
}
```

---

## 六、环节 5: Review Orchestrator 审阅流程

**文件**: `review-orchestrator/review-orchestrator.js`

```
┌─────────────────────────────────────────────────────────────────┐
│                    Review Orchestrator                           │
│                    (审阅编排器)                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  review()         │
                    │  (stageName,      │
                    │   input,          │
                    │   outputs,        │
                    │   projectPath)    │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  1. 获取 Review    │
                    │  Agent            │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  const agent =    │
                    │  this.agents[     │
                    │    stageName]     │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  已注册 Agent:     │
                    │  - designing      │
                    │  - coding         │
                    │  - roadmapping ❌ │
                    │  - detailing ❌   │
                    │  - testing ❌     │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  2. 执行自动检查   │
                    │  agent.execute()  │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  执行检查点：      │
                    │  - D1: 需求覆盖率  │
                    │  - D2: 文档完整性  │
                    │  - D3: 无模糊词    │
                    │  - D4: 技术选型 ❌ │
                    │  - D5: 向后兼容    │
                    │  - D6: 异常处理 ❌ │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  3. 执行审阅工作流 │
                    │  workflow.execute()│
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  生成审阅结论：    │
                    │  - decision       │
                    │  - notes          │
                    │  - fixItems       │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  返回：            │
                    │  ReviewDecision   │
                    └───────────────────┘
```

### 已注册 Agent

```javascript
// review-orchestrator.js
constructor(config) {
  this.agents = {
    designing: new ReviewDesignAgent(config),  // ✅ 已实现
    coding: new ReviewCodeAgent(config)        // ✅ 已实现
    // ❌ roadmapping: 缺失
    // ❌ detailing: 缺失
    // ❌ testing: 缺失
  };
}
```

---

## 七、环节 6: Review Agent 检查流程

**文件**: `review-agents/review-design.js`

```
┌─────────────────────────────────────────────────────────────────┐
│                    ReviewDesignAgent                             │
│                  (设计阶段审阅 Agent)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  execute()        │
                    │  (input)          │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  1. 加载检查点     │
                    │  loadCheckpoints()│
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  Checkpoints:     │
                    │  - D1: 需求覆盖率  │
                    │  - D2: 文档完整性  │
                    │  - D3: 无模糊词    │
                    │  - D4: 技术选型    │
                    │  - D5: 向后兼容    │
                    │  - D6: 异常处理    │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  2. 执行检查循环   │
                    │  for checkpoint   │
                    │  in checkpoints   │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  validateCheckpoint│
                    │  (checkpoint,     │
                    │   input)          │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  switch(checkpoint│
                    │         .id)      │
                    └─────────┬─────────┘
                              │
        ┌─────────┬───────────┼───────────┬─────────┐
        │         │           │           │         │
        ↓         ↓           ↓           ↓         ↓
  ┌──────────┐ ┌──────┐ ┌──────────┐ ┌──────┐ ┌──────────┐
  │   D1     │ │  D2  │ │    D3    │ │  D5  │ │  D4/D6   │
  │ 需求覆盖  │ │文档  │ │ 无模糊词  │ │向后  │ │   ❌     │
  │          │ │完整性│ │          │ │兼容  │ │ AI 检查   │
  │  auto ✅  │ │auto  │ │  auto ✅  │ │auto  │ │ 未实现  │
  └────┬─────┘ └──┬───┘ └────┬─────┘ └──┬───┘ └────┬─────┘
       │          │          │          │          │
       ↓          ↓          ↓          ↓          ↓
  ┌─────────────────────────────────────────────────┐
  │  检查方法：                                     │
  │  - 字符串匹配                                   │
  │  - 关键词检测                                   │
  │  - 章节标题检查                                 │
  │  ❌ 只检查"有无"，不检查"质量"                   │
  └─────────────────────────────────────────────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  3. 计算得分       │
                    │  (未实现权重)      │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  4. 生成结论       │
                    │  { decision,      │
                    │    notes,         │
                    │    fixItems }     │
                    └───────────────────┘
```

### 检查点实现示例

```javascript
// review-design.js
async validateCheckpoint(checkpoint, input) {
  switch (checkpoint.id) {
    case 'D1':  // 需求覆盖率
      return this.checkRequirementsCoverage(input);
    case 'D2':  // 文档完整性
      return this.checkDocumentCompleteness(input);
    case 'D3':  // 无模糊词
      return this.checkVagueWords(input);
    case 'D5':  // 向后兼容
      return this.checkCompatibility(input);
    // ❌ D4/D6: AI 检查未实现
    default:
      throw new Error(`未知检查点：${checkpoint.id}`);
  }
}

// D1: 需求覆盖率检查
async checkRequirementsCoverage(input) {
  // 1. 提取 REQUIREMENTS.md 中的需求项
  const requirements = this.extractRequirements(requirementsContent);
  
  // 2. 检查每条需求在 PRD 中是否有对应
  for (const req of requirements) {
    const isCovered = prdContent.includes(req.id) || 
                     prdContent.includes(req.description);
    // ❌ 只检查关键词是否出现，不检查语义映射
  }
  
  // 3. 计算覆盖率
  const rate = covered / requirements.length;
  return rate >= 1.0;  // 100% 覆盖
}
```

---

## 八、环节 7: State Manager 状态管理流程

**文件**: `cdf-orchestrator/state-manager.js`

```
┌─────────────────────────────────────────────────────────────────┐
│                      State Manager                               │
│                      (状态管理器)                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  构造函数          │
                    │  (config,         │
                    │   projectPath)    │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  1. 初始化状态     │
                    │  this.state = {   │
                    │    workflowId,    │
                    │    projectPath,   │
                    │    stages: {},    │
                    │    status:        │
                    │      'running'    │
                    │  }                │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  2. 创建 state.json│
                    │  fs.writeFileSync(│
                    │    'state.json',  │
                    │    JSON.stringify(│
                    │      this.state)) │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  3. 更新阶段状态   │
                    │  updateStageStatus│
                    │  (stageName,      │
                    │   status)         │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  this.state.      │
                    │  stages[stageName]│
                    │  = { status,      │
                    │      outputs,     │
                    │      review,      │
                    │      timestamp }  │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  4. 记录审阅决策   │
                    │  recordReview     │
                    │  Decision()       │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  this.state.      │
                    │  stages[stageName]│
                    │  .review = {      │
                    │    decision,      │
                    │    notes,         │
                    │    fixItems }     │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  5. 生成报告       │
                    │  getReport()      │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │  返回完整报告：    │
                    │  - workflowId     │
                    │  - projectPath    │
                    │  - progress       │
                    │  - stages         │
                    │  - totalFixItems  │
                    └───────────────────┘
```

### 状态文件结构

```json
{
  "workflowId": "wf-20260402-001",
  "projectPath": "/path/to/project",
  "status": "running",
  "stages": {
    "designing": {
      "status": "passed",
      "outputs": ["01_designing/PRD.md", "01_designing/TRD.md"],
      "review": {
        "decision": "pass",
        "notes": "设计文档质量良好",
        "fixItems": []
      },
      "timestamp": "2026-04-02T10:00:00Z"
    },
    "roadmapping": {
      "status": "running",
      "outputs": [],
      "review": null,
      "timestamp": "2026-04-02T10:05:00Z"
    }
  },
  "metadata": {
    "scenario": "全新功能",
    "requirementsFile": "REQUIREMENTS.md",
    "startTime": "2026-04-02T10:00:00Z"
  }
}
```

---

## 九、完整调用链路图

```
用户调用
   │
   ↓
┌──────────────────────────────────────────────────────────────────┐
│  1. Workflow Executor (workflow-executor.js)                     │
│     executeWorkflow(taskConfig)                                  │
│     - loadConfig()                                               │
│     - parseTaskConfig()                                          │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│  2. Workflow Orchestrator (workflow-orchestrator.js)             │
│     execute(workflowConfig)                                      │
│     - new StateManager() → state.json                            │
│     - for stage in STAGE_SEQUENCE                                │
└────────────────────────────┬─────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ↓                    ↓                    ↓
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  3. Stage        │ │  4. Review       │ │  5. State        │
│  Executor        │ │  Orchestrator    │ │  Manager         │
│  execute()       │ │  review()        │ │  updateStage()   │
│  - 创建目录       │ │  - get Agent     │ │  - state.json    │
│  - 调用 AI        │ │  - auto check    │ │  - 记录审阅       │
└────────┬─────────┘ │  - workflow      │ └──────────────────┘
         │           └────────┬─────────┘
         │                    │
         ↓                    ↓
┌──────────────────┐ ┌──────────────────┐
│  6. AI Tool      │ │  7. Review       │
│  Adapter         │ │  Agents          │
│  execute()       │ │  execute()       │
│  - buildTask()   │ │  - D1 需求覆盖    │
│  - spawnSession()│ │  - D2 文档完整    │
│  - waitFor()     │ │  - D3 无模糊词    │
│  - checkOutputs()│ │  - D4 技术选型 ❌ │
└──────────────────┘ │  - D5 向后兼容    │
                     │  - D6 异常处理 ❌ │
                     └──────────────────┘
```

---

## 十、优化机会点

### 10.1 环节 1-2: 配置和编排

| 问题 | 优化建议 |
|------|---------|
| 配置加载简单 | 增加配置验证和错误处理 |
| 阶段序列固定 | 支持动态配置阶段序列 |

### 10.2 环节 3-4: 执行和 AI 调用

| 问题 | 优化建议 |
|------|---------|
| 任务描述硬编码 | 支持模板化任务描述 |
| 轮询效率低 | 使用 WebSocket 或回调机制 |
| 超时处理简单 | 增加重试和降级策略 |

### 10.3 环节 5-6: 审阅和 Agent

| 问题 | 优化建议 |
|------|---------|
| AI 检查未实现 | 实现 type: 'ai' 的检查逻辑 |
| 检查粒度粗 | 从"有无"升级为"质量" |
| 权重未使用 | 实现加权评分算法 |
| Agent 缺失 | 新增 Roadmap/Detailing/Testing Agent |

### 10.4 环节 7: 状态管理

| 问题 | 优化建议 |
|------|---------|
| 审阅记录简单 | 增加详细审阅过程记录 |
| 无断点续传 | 实现从中断点恢复功能 |
| 报告简单 | 增加可视化报告生成 |

---

## 十一、总结

### 调用流程关键环节

| 环节 | 文件 | 职责 | 状态 |
|------|------|------|------|
| 1. Workflow Executor | workflow-executor.js | 加载配置、解析任务 | ✅ 正常 |
| 2. Workflow Orchestrator | workflow-orchestrator.js | 阶段编排、审阅协调 | ✅ 正常 |
| 3. Stage Executor | stage-executor.js | 阶段执行、目录管理 | ✅ 正常 |
| 4. AI Tool Adapter | opencode.js | 调用 OpenCode | ✅ 正常 |
| 5. Review Orchestrator | review-orchestrator.js | 审阅编排、Agent 调度 | ⚠️ Agent 缺失 |
| 6. Review Agents | review-design/code.js | 自动检查、AI 检查 | ❌ AI 检查未实现 |
| 7. State Manager | state-manager.js | 状态管理、报告生成 | ✅ 正常 |

### 优先级排序

| 优先级 | 优化项 | 影响 | 工作量 |
|--------|--------|------|--------|
| P0 | 实现 AI 检查逻辑 | 高 | 中 |
| P1 | 增强检查粒度 | 高 | 中 |
| P2 | 新增 Review Agent | 中 | 高 |
| P3 | 实现权重评分 | 中 | 低 |

---

*调用流程环节图 by openclaw-ouyp*  
**版本**: v1.0 | **日期**: 2026-04-02 | **状态**: 完成 ✅
