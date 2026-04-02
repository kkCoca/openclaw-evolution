# ClawDevFlow 执行流程与审阅 Agent 分析报告

**日期**: 2026-04-02  
**版本**: v3.0.1  
**分析对象**: `/home/ouyp/Learning/Practice/openclaw-universe/projects/clawdevflow/04_coding/src/`

---

## 一、整体执行流程

### 1.1 流程架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                    Workflow Executor                             │
│                    (workflow-executor.js)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Workflow Orchestrator                           │
│              (cdf-orchestrator/workflow-orchestrator.js)         │
│                                                                  │
│  阶段序列：DESIGNING → ROADMAPPING → DETAILING → CODING →       │
│            TESTING → REVIEWING                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Stage         │ │ State         │ │ Review        │
│ Executor      │ │ Manager       │ │ Orchestrator  │
│ (阶段执行)     │ │ (状态管理)     │ │ (审阅编排)     │
└───────┬───────┘ └───────────────┘ └───────┬───────┘
        │                                   │
        ↓                                   ↓
┌───────────────┐                   ┌───────────────┐
│ AI Tool       │                   │ Review        │
│ Adapter       │                   │ Agents        │
│ (调用 OpenCode)│                   │ (审阅 Agent)   │
└───────────────┘                   └───────┬───────┘
                                            │
                        ┌───────────────────┼───────────────────┐
                        ↓                   ↓                   ↓
                ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
                │ Review        │   │ Review        │   │ Review        │
                │ Design Agent  │   │ Code Agent    │   │ Workflow      │
                │ (设计审阅)     │   │ (代码审阅)     │   │ (审阅工作流)   │
                └───────────────┘   └───────────────┘   └───────────────┘
```

---

### 1.2 执行步骤详解

#### 步骤 1: 加载配置 (workflow-executor.js)
```javascript
// 1. 加载 config.yaml
const config = loadConfig();
// - defaultAITool: opencode
// - workspaceRoot: /home/ouyp/Learning/Practice/openclaw-universe
// - 各阶段配置（aiTool, requireReview, timeoutSeconds）
```

#### 步骤 2: 解析任务参数 (workflow-executor.js)
```javascript
// 解析用户输入的任务描述
const workflowConfig = parseTaskConfig(taskConfig, config);
// - workflowId: wf-20260402-001
// - scenario: 全新功能/增量需求/问题修复
// - projectPath: 项目路径
// - requirementsFile: REQUIREMENTS.md
```

#### 步骤 3: 初始化状态管理器 (workflow-orchestrator.js)
```javascript
this.stateManager = new StateManager(config, projectPath);
// - 创建 state.json
// - 记录元数据（scenario, requirementsFile, startTime）
```

#### 步骤 4: 执行阶段循环 (workflow-orchestrator.js)
```javascript
for (const stageName of STAGE_SEQUENCE) {
  const stageResult = await this.executeStage(stageName, workflowConfig);
  
  // 每个阶段执行：
  // 1. 准备阶段输入
  // 2. StageExecutor.execute() - 调用 AI 工具
  // 3. ReviewOrchestrator.review() - 执行审阅
  // 4. handleReviewDecision() - 处理审阅结论
}
```

#### 步骤 5: 阶段执行 (stage-executor.js)
```javascript
async execute(stageName, input, projectPath) {
  switch (stageName) {
    case 'designing':
      return await this.executeDesigning(input, projectPath);
    case 'roadmapping':
      return await this.executeRoadmapping(input, projectPath);
    // ...
  }
}
```

#### 步骤 6: 调用 AI 工具 (adapters/opencode.js)
```javascript
async execute(stageName, input) {
  // 1. 构建任务描述
  const task = this.buildTask(stageName, input);
  
  // 2. Spawn 子会话
  const session = await sessions_spawn({
    task: task,
    runtime: "subagent",
    mode: "run",
    timeoutSeconds: 1800
  });
  
  // 3. 等待完成并检查输出文件
  const result = await this.waitForCompletion(session.sessionKey);
  return result;
}
```

#### 步骤 7: 执行审阅 (review-orchestrator.js)
```javascript
async review(stageName, input, outputs, projectPath) {
  // 1. 获取对应的 Review Agent
  const agent = this.agents[stageName];
  
  // 2. 执行自动检查
  const autoResults = await agent.execute(input);
  
  // 3. 执行审阅工作流
  const decision = await this.workflow.execute(stageName, autoResults, outputs, projectPath);
  
  return decision; // { decision: 'pass/conditional/reject', notes, fixItems }
}
```

#### 步骤 8: 处理审阅决策 (workflow-orchestrator.js)
```javascript
async handleReviewDecision(stageName, reviewDecision, workflowConfig) {
  switch (reviewDecision.decision) {
    case 'pass':
      // 进入下一阶段
      return { success: true };
    case 'conditional':
      // 进入下一阶段，记录待修复项
      return { success: true };
    case 'reject':
      // 重新执行当前阶段（最多 3 次）
      return await this.executeStage(stageName, workflowConfig);
  }
}
```

---

## 二、审阅 Agent 详细分析

### 2.1 审阅系统架构

```
ReviewOrchestrator (review-orchestrator.js)
    │
    ├── ReviewDesignAgent (review-design.js)      ← Design 阶段审阅
    ├── ReviewCodeAgent (review-code.js)          ← Code 阶段审阅
    │
    └── ReviewWorkflow (review-workflow.js)       ← 审阅工作流
        ├── ReviewDecisionParser (决策解析)
        └── ReviewResultManager (结果管理)
```

**问题**: 
- ❌ **缺少 Roadmapping 阶段审阅 Agent** - roadmapping 阶段只有自审阅，没有独立的 Review Agent
- ❌ **缺少 Detailing 阶段审阅 Agent** - detailing 阶段没有审阅
- ❌ **缺少 Testing 阶段审阅 Agent** - testing 阶段没有审阅

---

### 2.2 ReviewDesignAgent 分析

**文件**: `review-agents/review-design.js`

#### 检查点清单（6 项）

| ID | 检查项 | 类型 | 权重 | 关键 | 检查内容 |
|----|--------|------|------|------|---------|
| D1 | 需求覆盖率 | auto | 0.2 | ✅ | REQUIREMENTS.md → PRD.md 映射 |
| D2 | 文档完整性 | auto | 0.15 | ✅ | PRD+TRD 章节完整 |
| D3 | 无模糊词 | auto | 0.1 | ❌ | 检测"适当的"、"一些"等 |
| D4 | 技术选型合理 | ai | 0.2 | ✅ | 比较表 + 决策依据 |
| D5 | 向后兼容 | auto | 0.15 | ✅ | 增量需求兼容性说明 |
| D6 | 异常处理 | ai | 0.2 | ✅ | 正常 + 失败 + 边界 |

#### 实现分析

**自动检查 (auto)**:
```javascript
// D1: 需求覆盖率
async checkRequirementsCoverage(input) {
  // 1. 提取 REQUIREMENTS.md 中的需求项
  const requirements = this.extractRequirements(requirementsContent);
  
  // 2. 检查每条需求在 PRD 中是否有对应
  for (const req of requirements) {
    const isCovered = prdContent.includes(req.id) || 
                     prdContent.includes(req.description);
  }
  
  // 3. 计算覆盖率
  const rate = covered / requirements.length;
  return rate >= 1.0; // 100% 覆盖
}

// D2: 文档完整性
async checkDocumentCompleteness(input) {
  // 检查 PRD.md 和 TRD.md 的必需章节
  const requiredSections = ['需求概述', '功能需求', '技术选型', ...];
  for (const section of requiredSections) {
    if (!content.includes(section)) {
      missing.push(section);
    }
  }
  return missing.length === 0;
}

// D3: 无模糊词
async checkVagueWords(input) {
  // 检测模糊词
  const vagueWords = ['适当的', '一些', '可能', '大概', '或许'];
  for (const word of vagueWords) {
    if (content.includes(word)) {
      found.push(word);
    }
  }
  return found.length === 0;
}

// D5: 向后兼容
async checkCompatibility(input) {
  // 增量需求检查兼容性说明
  if (scenario === '增量需求') {
    return content.includes('兼容') || content.includes('向后兼容');
  }
  return true;
}
```

**AI 检查 (ai)**:
```javascript
// D4: 技术选型合理 - 调用 AI 检查
// D6: 异常处理 - 调用 AI 检查
// 这些检查点 type: 'ai'，但代码中没有实现 validateCheckpoint 的 AI 调用逻辑
```

#### 问题识别

| 问题 | 严重性 | 说明 |
|------|--------|------|
| ❌ D4/D6 的 AI 检查未实现 | 高 | `validateCheckpoint` 中没有处理 `type: 'ai'` 的逻辑 |
| ❌ 检查粒度粗 | 中 | 只检查"有无"，不检查质量（如需求覆盖只检查是否出现关键词） |
| ❌ 权重未使用 | 中 | `weight` 字段定义了但未在评分中使用 |
| ❌ 缺少质量评估 | 高 | 没有评估需求的覆盖质量（如是否准确映射） |

---

### 2.3 ReviewCodeAgent 分析

**文件**: `review-agents/review-code.js`

#### 检查点清单（8 项）

| ID | 检查项 | 类型 | 权重 | 关键 | 检查内容 |
|----|--------|------|------|------|---------|
| C1 | 需求对齐 | auto | 0.2 | ✅ | 代码实现与 PRD 对齐 |
| C2 | 架构对齐 | auto | 0.15 | ✅ | 代码与 TRD 一致 |
| C3 | 代码质量 | ai | 0.15 | ❌ | 代码规范、复杂度 |
| C4 | 测试覆盖 | auto | 0.15 | ❌ | 单元测试覆盖率 |
| C5 | 安全性 | ai | 0.15 | ✅ | 安全漏洞检测 |
| C6 | 性能 | ai | 0.1 | ❌ | 性能问题检测 |
| C7 | 可维护性 | ai | 0.05 | ❌ | 代码可读性 |
| C8 | 文档完整 | auto | 0.05 | ❌ | 注释、README |

#### 实现分析

**自动检查 (auto)**:
```javascript
// C1: 需求对齐
async checkRequirementsAlignment(input) {
  // 1. 读取 PRD.md 中的功能列表
  // 2. 检查代码中是否有对应实现
  // 3. 只检查文件/函数名是否包含关键词
}

// C2: 架构对齐
async checkArchitectureAlignment(input) {
  // 1. 读取 TRD.md 中的技术选型
  // 2. 检查 package.json 中的依赖
  // 3. 只检查依赖名称是否匹配
}

// C4: 测试覆盖
async checkTestCoverage(input) {
  // 1. 检查 tests/ 目录是否存在
  // 2. 检查测试文件数量
  // 3. 不检查实际覆盖率数据
}

// C8: 文档完整
async checkDocumentation(input) {
  // 1. 检查 README.md 是否存在
  // 2. 检查代码注释比例
  // 3. 简单字符串匹配
}
```

**AI 检查 (ai)**:
```javascript
// C3/C5/C6/C7 的 AI 检查同样未实现
```

#### 问题识别

| 问题 | 严重性 | 说明 |
|------|--------|------|
| ❌ AI 检查未实现 | 高 | C3/C5/C6/C7 的 AI 检查逻辑缺失 |
| ❌ 检查过于表面 | 高 | 只检查"有无"，不检查质量 |
| ❌ 需求对齐检查弱 | 高 | 只检查关键词，不检查实现逻辑 |
| ❌ 测试覆盖检查假 | 高 | 不检查实际覆盖率数据 |
| ❌ 权重未使用 | 中 | `weight` 字段未使用 |

---

### 2.4 Roadmapping 自审阅分析

**文件**: `bundled-skills/roadmapping/SKILL.md`

#### 检查清单（10 项）

| # | 检查项 | 标准 | 实现方式 |
|---|--------|------|---------|
| 1 | 任务拆分 | 职责单一 | AI 自检 |
| 2 | 工作量评估 | ≤2 人天 | AI 自检 |
| 3 | 收尾项 | 联调 + 演示 | AI 自检 |
| 4 | 任务命名 | 固定格式 | AI 自检 |
| 5 | 描述规范 | 只写"做什么" | AI 自检 |
| 6 | 需求覆盖 | 覆盖 PRD | AI 自检 |
| 7 | 技术对齐 | 与 TRD 一致 | AI 自检 |
| 8 | 代码现状 | 增量需求分析 | AI 自检 |
| 9 | 风险评估 | ≥3 项 | AI 自检 |
| 10 | 不确定性标注 | 标注原因 | AI 自检 |

#### 实现分析

**自审阅流程**（在 SKILL.md 中定义，由 AI 执行）:
```markdown
### 步骤 4：自审阅（关键！）
生成 ROADMAP.md 后，**必须**执行自审阅：

1. 逐项检查 10 项清单
2. 评分：10/10, 8-9/10, <8/10
3. 决策：
   - 10/10 → 直接通过
   - 8-9/10 → 修正后通过
   - <8/10 → 重新生成

### 步骤 5：修正（如需要）
如果评分 <10 分：
1. 记录问题到 SELF-REVIEW.md
2. 修正 ROADMAP.md
3. 重新审阅（最多 3 次）
```

**问题**：
- ✅ **自审阅在 skill 内部** - 不依赖 ReviewOrchestrator
- ❌ **审阅质量依赖 AI** - 没有独立的 Review Agent 验证
- ❌ **检查标准主观** - AI 自己判断是否合规
- ❌ **无法追溯** - 审阅过程不记录到 state.json

---

## 三、问题总结

### 3.1 审阅 Agent 问题

| 问题 | 影响阶段 | 严重性 | 说明 |
|------|---------|--------|------|
| ❌ AI 检查未实现 | Design/Code | 高 | `type: 'ai'` 的检查点没有实现 |
| ❌ 检查粒度粗 | Design/Code | 高 | 只检查"有无"，不检查质量 |
| ❌ 权重未使用 | Design/Code | 中 | `weight` 字段定义了但未使用 |
| ❌ 缺少 Roadmap Agent | Roadmapping | 高 | 只有自审阅，无独立 Review Agent |
| ❌ 缺少 Detailing Agent | Detailing | 中 | 无审阅 |
| ❌ 缺少 Testing Agent | Testing | 中 | 无审阅 |

### 3.2 质量检查问题

#### Design 阶段
```
当前检查：
✅ D1: 需求覆盖率 - 检查关键词是否出现
✅ D2: 文档完整性 - 检查章节标题
✅ D3: 无模糊词 - 检查模糊词列表
❌ D4: 技术选型合理 - AI 检查未实现
✅ D5: 向后兼容 - 检查"兼容"关键词
❌ D6: 异常处理 - AI 检查未实现

问题：
- 只检查"有无"，不检查"质量"
- 例如 D1 只检查 PRD 中是否出现需求关键词，不检查是否准确映射
```

#### Code 阶段
```
当前检查：
✅ C1: 需求对齐 - 检查函数名/文件名
✅ C2: 架构对齐 - 检查依赖名称
❌ C3: 代码质量 - AI 检查未实现
✅ C4: 测试覆盖 - 检查 tests/目录
❌ C5: 安全性 - AI 检查未实现
❌ C6: 性能 - AI 检查未实现
❌ C7: 可维护性 - AI 检查未实现
✅ C8: 文档完整 - 检查 README.md

问题：
- C4 检查假：只检查目录存在，不检查实际覆盖率
- C1 检查弱：只检查关键词，不检查实现逻辑
```

#### Roadmapping 阶段
```
当前检查：
✅ 10 项自审阅清单（在 skill 内部）

问题：
- 自审阅在 skill 内部，不经过 ReviewOrchestrator
- 审阅质量完全依赖 AI 的自觉性
- 没有独立的 Review Agent 验证
- 审阅过程不记录到 state.json
```

---

## 四、改进建议

### 4.1 短期改进（1 周）

1. **实现 AI 检查逻辑**
   - 在 `validateCheckpoint` 中添加 `type: 'ai'` 的处理
   - 调用 AI 工具执行质量检查

2. **增强检查粒度**
   - D1: 从关键词匹配升级为语义映射
   - C1: 从文件名匹配升级为功能点对齐
   - C4: 从目录检查升级为实际覆盖率数据

3. **使用权重评分**
   - 实现加权评分算法
   - 根据总分决定审阅结论

### 4.2 中期改进（1 个月）

1. **新增 Review Agent**
   - ReviewRoadmapAgent - roadmapping 阶段独立审阅
   - ReviewDetailingAgent - detailing 阶段审阅
   - ReviewTestingAgent - testing 阶段审阅

2. **审阅过程追溯**
   - 审阅结果记录到 state.json
   - 生成审阅报告（SELF-REVIEW.md）

3. **质量检查增强**
   - 引入代码静态分析工具
   - 引入测试覆盖率工具
   - 引入安全扫描工具

### 4.3 长期改进（3 个月）

1. **机器学习优化**
   - 基于历史数据训练审阅模型
   - 自动识别常见问题模式

2. **审阅标准库**
   - 建立各阶段的审阅标准库
   - 支持自定义审阅规则

3. **审阅可视化**
   - 审阅结果可视化展示
   - 质量趋势分析

---

## 五、结论

### 5.1 当前状态

**审阅系统架构完整，但实现不充分**：

- ✅ 架构设计合理（ReviewOrchestrator + Review Agents）
- ❌ AI 检查未实现（type: 'ai' 的检查点）
- ❌ 检查粒度粗（只检查"有无"，不检查"质量"）
- ❌ 阶段覆盖不全（缺少 Roadmap/Detailing/Testing Agent）

### 5.2 风险评估

| 风险 | 可能性 | 影响 | 应对措施 |
|------|--------|------|---------|
| 低质量产出通过审阅 | 高 | 高 | 实现 AI 检查，增强检查粒度 |
| 审阅结果不可信 | 高 | 中 | 记录审阅过程到 state.json |
| 问题遗漏到生产 | 中 | 高 | 新增 Review Agent，引入工具检查 |

### 5.3 建议行动

1. **立即** - 实现 AI 检查逻辑
2. **本周** - 增强检查粒度
3. **本月** - 新增 Review Agent
4. **下季度** - 引入工具检查 + 机器学习

---

*分析报告 by openclaw-ouyp*  
**版本**: v1.0 | **日期**: 2026-04-02 | **状态**: 完成 ✅
