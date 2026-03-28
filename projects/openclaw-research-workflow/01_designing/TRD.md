# 技术需求文档（TRD）

## 文档信息

| 字段 | 值 |
|------|-----|
| 版本 | v1.1.0 |
| 日期 | 2026-03-26 |
| 状态 | 待评审 |
| 作者 | openclaw-ouyp |

---

## 1. 技术架构

### 1.1 系统架构

```
┌─────────────────────────────────────┐
│  openclaw-ouyp (审阅者)              │
│  • 需求整理                         │
│  • 任务分配                         │
│  • 验收验证                         │
│  • Git 管理                         │
│  • 部署上线                         │
└─────────────────────────────────────┘
              ↓ sessions_spawn
┌─────────────────────────────────────┐
│  流程引擎 Skill (编排者)             │
│  • 自动调用 skills                   │
│  • 流程监督                         │
│  • 生成审查报告                     │
└─────────────────────────────────────┘
              ↓ 调用
┌─────────────────────────────────────┐
│  OpenCode (执行者)                  │
│  • designing → PRD + TRD            │
│  • roadmapping → ROADMAP            │
│  • detailing → DETAIL               │
│  • coding → 代码 + 测试             │
│  • reviewing → 验收报告             │
└─────────────────────────────────────┘
```

### 1.2 调用关系

| 阶段 | 流程引擎动作 | OpenCode 执行 |
|------|-------------|--------------|
| designing | 调用 designing skill | 执行需求分析和架构设计 |
| roadmapping | 调用 roadmapping skill | 执行开发计划制定 |
| detailing | 调用 detailing skill | 执行文件级设计 |
| coding | 调用 coding skill | 执行代码实现 + 测试 + 文档 |
| reviewing | 调用 reviewing skill | 执行验收验证 |

---

## 2. 修改方案

### 2.1 workflow.md 修改

**修改位置**：每个阶段的"执行步骤"部分

**修改前**：
```markdown
### 阶段 1: designing

调用 designing skill：
- **输入**: 用户需求
- **输出**: `01_designing/PRD.md` + `01_designing/TRD.md`
```

**修改后**：
```markdown
### 阶段 1: designing

**调用 OpenCode 执行 designing skill**：
- **输入**: 用户需求
- **输出**: `01_designing/PRD.md` + `01_designing/TRD.md`
- **检查点**: 文档完整性
- **触发条件**: 用户确认需求后

**执行步骤**:
1. 流程引擎将用户需求传递给 OpenCode
2. OpenCode 执行 designing skill 分析需求类型
3. OpenCode 执行 designing skill 与用户确认模式
4. OpenCode 执行 designing skill 询问需求细节
5. OpenCode 执行 designing skill 输出 PRD.md + TRD.md
6. 流程引擎验证文档完整性
```

### 2.2 README.md 修改

**新增章节**：在"工作流程"章节后增加"工作原理"章节

**内容**：
```markdown
## 工作原理

### 三方协作架构

流程引擎 Skill 采用三方协作架构：

1. **openclaw-ouyp（审阅者）**：负责任务分配和验收验证
2. **流程引擎（编排者）**：负责流程监督和 skill 调用
3. **OpenCode（执行者）**：负责具体研发任务执行

### 调用流程

```
用户需求 → openclaw-ouyp → sessions_spawn → 流程引擎 → 调用 → OpenCode → 执行 skill → 输出
```

### 阶段调用说明

| 阶段 | 流程引擎动作 | OpenCode 执行 |
|------|-------------|--------------|
| designing | 调用 designing skill | 执行需求分析和架构设计 |
| roadmapping | 调用 roadmapping skill | 执行开发计划制定 |
| detailing | 调用 detailing skill | 执行文件级设计 |
| coding | 调用 coding skill | 执行代码实现 + 测试 + 文档 |
| reviewing | 调用 reviewing skill | 执行验收验证 |
```

---

## 3. 文件修改清单

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| workflow.md | 编辑 | 每个阶段增加"调用 OpenCode 执行"说明 |
| README.md | 编辑 | 增加"工作原理"章节 |

---

## 4. 技术约束

### 4.1 保留原始需求

- ✅ 独立完整：一个包包含所有依赖 skills
- ✅ 零感知安装：用户只需安装 1 个 skill
- ✅ 流程标准化：所有场景都走完整研发流程
- ✅ 易于分享：支持多种安装方式

### 4.2 文档规范

- 保持与现有文档风格一致
- 使用 Markdown 格式
- 图表使用 ASCII art 或 Mermaid

---

## 5. 验收标准

### 5.1 功能验收

- [ ] workflow.md 每个阶段明确"调用 OpenCode 执行 XXX skill"
- [ ] README.md 增加"工作原理"章节
- [ ] 三方协作架构图清晰展示

### 5.2 质量验收

- [ ] 文档语言简洁清晰
- [ ] 结构层次分明
- [ ] 与 AGENTS.md 保持一致

### 5.3 回归验收

- [ ] 原始需求仍然满足
- [ ] 不影响现有功能
- [ ] 所有研发过程文档完整

---

## 6. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0.0 | 2026-03-26 | 初始版本（原始需求） |
| v1.0.1 | 2026-03-26 | BUG-001 修复（目录结构问题） |
| v1.1.0 | 2026-03-26 | FEATURE-001：增加 OpenCode 调用说明 |
| **v2.0.0** | **2026-03-28** | **FEATURE-002：审阅驱动 + 会话隔离 + 工具无关** |
## 7. v2.0.0 技术设计（2026-03-28）

### 7.1 架构设计

#### 7.1.1 新架构

```
┌─────────────────────────────────────────────────────────────┐
│                    流程引擎 (纯编排器)                        │
│                                                             │
│  输入层：                                                    │
│  - 解析任务（场景类型 + REQUIREMENTS.md）                     │
│  - 加载配置（config.yaml）                                   │
│                                                             │
│  编排层：                                                    │
│  - 状态机管理（StateManager）                               │
│  - 子会话调度（sessions_spawn）                             │
│  - 审阅协议执行（REVIEW-PROTOCOL.md）                        │
│                                                             │
│  适配层：                                                    │
│  - AI 工具抽象（ai-tool-adapter.js）                        │
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
```

#### 7.1.2 状态机设计

```javascript
const StageStatus = {
  PENDING: 'pending',           // 待执行
  RUNNING: 'running',           // 执行中
  REVIEWING: 'reviewing',       // 待审阅
  PASSED: 'passed',             // 通过
  CONDITIONAL_PASSED: 'conditional_passed', // 条件通过
  REJECTED: 'rejected',         // 驳回
  TERMINATED: 'terminated'      // 终止
};
```

### 7.2 文件修改清单

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `workflow.md` | 重写 | 实现状态机 + 子会话编排逻辑 |
| `config.yaml` | 新建 | 配置文件模板 |
| `state-manager.js` | 新建 | 状态持久化管理器 |
| `REVIEW-PROTOCOL.md` | 新建 | 各阶段审阅协议 |
| `SKILL.md` | 更新 | 使用说明更新到 v2.0 |
| `PRD.md` | 追加 | v2.0.0 增量需求章节 |
| `TRD.md` | 追加 | v2.0.0 技术设计章节 |

### 7.3 核心模块设计

#### 7.3.1 StateManager 类

```javascript
class StateManager {
  // 初始化新流程状态
  init(workflowId, task, scenario, projectPath)
  
  // 加载现有状态（断点续传）
  load()
  
  // 保存状态到文件
  save()
  
  // 更新阶段状态
  updateStage(stageName, status, updates)
  
  // 记录审阅结论
  recordReviewDecision(stageName, decision, notes)
  
  // 处理审阅结论
  handleReviewDecision(stageName, decision)
  
  // 获取下一阶段
  getNextStage()
  
  // 检查流程是否完成/终止
  isCompleted()
  isTerminated()
  
  // 获取状态摘要
  getSummary()
  
  // 日志记录
  log(event, details)
}
```

#### 7.3.2 主流程函数

```javascript
async function executeWorkflow(taskConfig) {
  // 1. 初始化状态
  const stateManager = new StateManager();
  const config = loadConfig('./config.yaml');
  const state = stateManager.init(...);
  
  // 2. 阶段执行循环
  while (true) {
    // 3. 执行当前阶段
    await executeStage(currentStage, config, stateManager);
    
    // 4. 等待用户审阅
    const decision = await waitForUserReview(currentStage);
    
    // 5. 处理审阅结论
    const result = stateManager.handleReviewDecision(currentStage, decision);
    
    // 6. 根据决策继续/回滚/终止
    if (result.action === 'continue') {
      // 进入下一阶段
    } else if (result.action === 'retry') {
      // 重新执行当前阶段（策略 A）
      continue;
    } else if (result.action === 'terminate') {
      // 流程终止
      break;
    }
  }
}
```

### 7.4 配置设计

```yaml
global:
  defaultAITool: opencode

stages:
  designing:
    aiTool: opencode
    requireReview: true
    timeoutSeconds: 1800
    reviewCheckpoints:
      - id: D1
        name: 需求覆盖率 100%
      - id: D2
        name: 无模糊描述
      # ...

review:
  requiredStages: [designing, roadmapping, detailing, coding, reviewing]
  timeoutHours: 24
  decisionOptions: [pass, conditional, reject, clarify, terminate]

rollback:
  strategy: A  # A=当前阶段重做，B=回滚到上阶段，C=完全重启
  maxRetriesPerStage: 3
```

### 7.5 回滚策略（策略 A）

```
驳回 → 检查重试次数 → 未超限 → 重置阶段状态为 PENDING → 重新执行当前阶段
                            ↓
                        超限 → 终止流程
```

### 7.6 日志设计

**日志文件**：`logs/{workflowId}.log`（JSON Lines 格式）

**日志条目**：
```json
{"timestamp":"2026-03-28T10:00:00.000Z","workflowId":"wf-20260328-001","stage":"designing","event":"workflow_started","details":{...}}
{"timestamp":"2026-03-28T10:00:01.000Z","workflowId":"wf-20260328-001","stage":"designing","event":"stage_started","details":{...}}
{"timestamp":"2026-03-28T10:25:00.000Z","workflowId":"wf-20260328-001","stage":"designing","event":"stage_completed","details":{...}}
{"timestamp":"2026-03-28T10:30:00.000Z","workflowId":"wf-20260328-001","stage":"designing","event":"review_decision","details":{"decision":"pass"}}
```

### 7.7 技术约束

- 使用 Node.js 编写（与现有 install.js 一致）
- YAML 配置使用 `js-yaml` 库解析
- 状态文件使用 JSON 格式
- 日志使用 JSON Lines 格式

---

## 8. 附录

### 8.1 相关文档

- AGENTS.md - 操作手册
- REQUIREMENTS.md - 需求说明
- workflow.md - 流程编排逻辑
- README.md - 使用文档
- config.yaml - 配置文件
- REVIEW-PROTOCOL.md - 审阅协议
- state-manager.js - 状态管理器

### 8.2 术语表

| 术语 | 说明 |
|------|------|
| OpenCode | 执行者，负责具体研发任务执行 |
| 流程引擎 | 编排者，负责流程监督和 skill 调用 |
| openclaw-ouyp | 审阅者，负责任务分配和验收验证 |
| 审阅驱动 | 每个阶段必须审阅确认后才继续 |
| 会话隔离 | 每个阶段独立子会话执行 |
| 工具无关 | 可配置 AI 工具 |
| 策略 A | 驳回后重新执行当前阶段 |
