# Designing → Roadmapping 环节处理流程

> **版本**: v1.0  
> **日期**: 2026-04-08  
> **作者**: openclaw-ouyp

---

## 流程总览

```
REQUIREMENTS.md (openclaw-ouyp 提供)
       ↓
┌─────────────────────────────────────────────────────────────┐
│                    DESIGNING 阶段                            │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                 │
│  │ 生成    │ →  │ 审阅    │ →  │ 确认    │                 │
│  │ PRD/TRD │    │ Auto    │    │ 两次    │                 │
│  └─────────┘    └─────────┘    └─────────┘                 │
└─────────────────────────────────────────────────────────────┘
       ↓ (入口门禁校验)
┌─────────────────────────────────────────────────────────────┐
│                   ROADMAPPING 阶段                           │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                 │
│  │ 生成    │ →  │ 审阅    │ →  │ 重试    │                 │
│  │ ROADMAP │    │ Auto    │    │ 闭环    │                 │
│  └─────────┘    └─────────┘    └─────────┘                 │
└─────────────────────────────────────────────────────────────┘
       ↓
ROADMAP.md (可交付成果)
```

---

## 1. Designing 阶段

### 1.1 输入

| 输入项 | 来源 | 说明 |
|--------|------|------|
| `REQUIREMENTS.md` | openclaw-ouyp | 原始需求说明（追加式） |
| `config.yaml` | 配置文件 | AI 工具配置（opencode/claude-code/custom） |
| `state.json` | 状态管理器 | 断点续传（如有） |

### 1.2 流程步骤

#### 步骤 1: 断点检查

```javascript
// workflow-orchestrator.js:90-95
if (stageStatus === 'prd_confirm_pending' || stageStatus === 'trd_confirm_pending') {
  // 等待用户确认中，跳过生成
  return { success: true, completed: false, reason: 'WAITING_CONFIRMATION' };
}

if (stageStatus === 'passed') {
  // 已完成，跳过
  return { success: true, completed: true };
}
```

**状态检查表**：

| stageStatus | 含义 | 动作 |
|-------------|------|------|
| `auto_reviewing` | 自动审阅中 | 继续生成 |
| `prd_confirm_pending` | 等待 PRD 确认 | 跳过生成，等待用户 |
| `trd_confirm_pending` | 等待 TRD 确认 | 跳过生成，等待用户 |
| `passed` | 已完成 | 跳过 |
| `blocked` | 已阻断 | 跳过，等待用户介入 |

---

#### 步骤 2: 生成 PRD/TRD

```javascript
// workflow-orchestrator.js:930-945
const input = await this.prepareStageInput('designing', workflow);
const result = await this.callAITool('designing', input, 'opencode');

// 从文件系统读取真实内容
const prdPath = path.join(projectPath, '01_designing/PRD.md');
const trdPath = path.join(projectPath, '01_designing/TRD.md');
state.stages.designing.lastPrdContent = fs.readFileSync(prdPath, 'utf8');
state.stages.designing.lastTrdContent = fs.readFileSync(trdPath, 'utf8');
```

**生成内容**：
- `01_designing/PRD.md` - 产品需求文档
- `01_designing/TRD.md` - 技术设计文档

---

#### 步骤 3: 自动审阅（Design Agent V2）

```javascript
// workflow-orchestrator.js:960-970
const reviewResult = await this.executeDesignReviewV2(input);
const agent = new ReviewDesignAgentV2(this.config);
const decisionResult = agent.makeDecision(reviewResult, policy);
```

**审阅检查点（D1-D7）**：

| 检查点 | 类型 | 说明 | 关键性 |
|--------|------|------|--------|
| D1 | Auto | 文档元数据完整 | Critical |
| D2 | Auto | 需求追溯矩阵 | Critical |
| D3 | Auto | PRD 结构完整 | Critical |
| D4 | Auto | TRD 结构完整 | Critical |
| D5 | AI | 需求覆盖度 | Critical |
| D6 | AI | 技术可行性 | Non-Critical |
| D7 | AI | 风险评估 | Non-Critical |

**决策规则**：

```
Critical 项失败 → BLOCK（重试）
Non-Critical 项失败 → CLARIFY（需澄清）
全部通过 → PASS（进入 PRD 确认）
```

---

#### 步骤 4: PRD 确认（第一次确认）

**用户收到审阅请求**：

```markdown
## Designing 阶段审阅请求

### 阶段产出
- PRD.md (v1.0.0)
- TRD.md (v1.0.0)

### 自动审阅结果
- D1 文档元数据 ✅
- D2 需求追溯 ✅
- D3 PRD 结构 ✅
- D4 TRD 结构 ✅
- D5 需求覆盖 ✅
- D6 技术可行 ⚠️
- D7 风险评估 ⚠️

### 审阅结论
⚠️ 条件通过（Non-Critical 项 2 个失败）

### 请确认
1. 是否通过 PRD 审阅？
2. 是否需要补充技术可行性分析？
```

**用户确认动作**：
```bash
# 用户回复确认
approvePRD({
  userId: 'openclaw-ouyp',
  requirementsHash: 'sha256:xxx',
  prdHash: 'sha256:yyy',
  notes: 'PRD 确认通过，技术可行性后续补充'
})
```

**状态流转**：
```
auto_reviewing → prd_confirm_pending → trd_confirm_pending
```

---

#### 步骤 5: TRD 确认（第二次确认）

**用户收到审阅请求**：

```markdown
## TRD 确认请求

### 当前状态
- PRD 已确认 ✅
- TRD 待确认 ⏳

### TRD 关键内容
- 系统架构：微服务架构
- 数据库：PostgreSQL
- 接口：RESTful API
- 安全：JWT + OAuth2

### 请确认
1. TRD 技术选型是否合理？
2. 是否进入 Roadmapping 阶段？
```

**用户确认动作**：
```bash
approveTRD({
  userId: 'openclaw-ouyp',
  requirementsHash: 'sha256:xxx',
  prdHash: 'sha256:yyy',
  trdHash: 'sha256:zzz',
  notes: 'TRD 确认通过，进入 Roadmapping'
})
```

**状态流转**：
```
trd_confirm_pending → passed
```

---

#### 步骤 6: 写入 Approved 快照

```javascript
// workflow-orchestrator.js:830-845
this.stateManager.state.stages.designing.approved = {
  requirementsHash: payload.requirementsHash,
  prdHash: payload.prdHash,
  trdHash: payload.trdHash,
  requirementsContent: state.requirementsContent,
  prdContent: state.stages.designing.lastPrdContent,
  trdContent: state.stages.designing.lastTrdContent,
  approvedBy: payload.userId,
  approvedAt: new Date().toISOString(),
  transitionId: `TRD_APPROVED_${Date.now()}`
};
```

**关键说明**：
- ✅ 方案 A：使用 state 快照（`state.stages.designing.approved`）
- ✅ Roadmapping 的唯一可信输入
- ✅ 包含完整内容 + 哈希 + 审批元数据

---

### 1.3 输出

| 输出项 | 位置 | 说明 |
|--------|------|------|
| `PRD.md` | `01_designing/PRD.md` | 产品需求文档（追加式） |
| `TRD.md` | `01_designing/TRD.md` | 技术设计文档（追加式） |
| `approved` 快照 | `state.json` | Roadmapping 的输入 |
| `stageStatus` | `state.json` | `passed` |

---

### 1.4 状态流转图

```
[开始]
  ↓
auto_reviewing ──→ [自动审阅] ──→ 失败 → [重试/阻断]
  ↓ 通过
prd_confirm_pending ──→ [等待 PRD 确认] ──→ 用户确认
  ↓
trd_confirm_pending ──→ [等待 TRD 确认] ──→ 用户确认
  ↓
passed ──→ [写入 approved 快照] ──→ [进入 Roadmapping]
```

---

## 2. Roadmapping 入口门禁

### 2.1 门禁检查（两处）

#### 检查点 1: Designing 完成后

```javascript
// workflow-orchestrator.js:100-115
const { validateRoadmappingEntry } = require('./utils/validate-roadmapping-entry');
const validation = validateRoadmappingEntry(this.stateManager, this.stateManager.state);

if (!validation.ok) {
  // 阻断并通知用户
  this.stateManager.updateStage('roadmapping', 'blocked', {
    reason: validation.reason,
    details: validation.details
  });
  break;
}
```

#### 检查点 2: ExecuteStage 内（防绕过）

```javascript
// executeStage('roadmapping') 内部再次校验
const validation = validateRoadmappingEntry(this.stateManager, state);
if (!validation.ok) {
  throw new Error(`Roadmapping 入口门禁失败：${validation.reason}`);
}
```

---

### 2.2 门禁检查项

| 检查项 | 说明 | 验证方式 |
|--------|------|---------|
| Designing 已完成 | `stageStatus === 'passed'` | 状态检查 |
| Approved 快照存在 | `approved` 对象完整 | 字段检查 |
| 哈希一致性 | `requirementsHash/prdHash/trdHash` 匹配 | 哈希比对 |
| 内容完整性 | `requirementsContent/prdContent/trdContent` 非空 | 内容检查 |

---

## 3. Roadmapping 阶段

### 3.1 输入

| 输入项 | 来源 | 说明 |
|--------|------|------|
| `approved.requirementsContent` | Designing 输出 | REQUIREMENTS 完整内容 |
| `approved.prdContent` | Designing 输出 | PRD 完整内容 |
| `approved.trdContent` | Designing 输出 | TRD 完整内容 |
| `approved.requirementsHash` | Designing 输出 | REQUIREMENTS 哈希 |
| `approved.prdHash` | Designing 输出 | PRD 哈希 |
| `approved.trdHash` | Designing 输出 | TRD 哈希 |

**关键原则**：
- ✅ 只读输入（不得修改 approved 内容）
- ✅ 唯一可信来源（不得从其他地方读取）
- ✅ 哈希绑定（防止内容漂移）

---

### 3.2 流程步骤

#### 步骤 1: 生成 ROADMAP.md

```javascript
// workflow-orchestrator.js:executeStage()
const input = await this.prepareStageInput('roadmapping', workflow);
// input 包含 approved.*Content 和 approved.*Hash

const result = await this.callAITool('roadmapping', input, 'opencode');
```

**生成内容**：
- `02_roadmapping/ROADMAP.md` - 开发计划文档

**Prompt 强制要求**：
```yaml
# ROADMAP.md 头部必须包含
alignedTo: v3.1.0
requirementsHash: sha256:xxx
prdHash: sha256:yyy
trdHash: sha256:zzz
attempt: 1
```

---

#### 步骤 2: 自动审阅（ReviewRoadmapAgentV1）

```javascript
// workflow-orchestrator.js:1091-1120
async executeRoadmapReviewV1(input) {
  // 待办建议 #1：空内容判空
  const roadmapContent = fs.readFileSync(roadmapPath, 'utf8');
  if (!roadmapContent || roadmapContent.trim().length === 0) {
    return { error: 'ROADMAP.md 文件存在但内容为空' };
  }
  input.roadmapContent = roadmapContent;
  
  const agent = new ReviewRoadmapAgentV1(this.config);
  const report = await agent.executeReview(input);
  return report;
}
```

**审阅检查点（最小三门）**：

| 检查点 | 类型 | 说明 | 关键性 |
|--------|------|------|--------|
| R1 Traceability | Auto | REQ 全覆盖 | Critical |
| R2 Structure | Auto | 里程碑/DoD/依赖/风险 | Critical |
| R3 Scope | AI | 禁止引入 PRD 未定义需求 | Critical |

**R1: Traceability 检查**：
```javascript
// review-roadmap-v1.js:100-130
// 待办建议 #2：增强需求提取规则，兼容 5 种格式
const reqPatterns = [
  /### (REQ-\d+):/g,           // ### REQ-001: 需求描述
  /## (REQ-\d+):/g,            // ## REQ-001: 需求描述
  /### (REQ-\d+)\s/g,          // ### REQ-001 需求描述（无冒号）
  /## (REQ-\d+)\s/g,           // ## REQ-001 需求描述（无冒号）
  /REQ-\d+/g                   // 任意位置的 REQ-001（兜底）
];

// 检查每个 REQ 是否在 ROADMAP 中有对应 item
const uncoveredReqs = reqIds.filter(reqId => !roadmapContent.includes(reqId));
if (uncoveredReqs.length > 0) {
  return { passed: false, uncoveredReqs };
}
```

**R2: Structure 检查**：
```javascript
// review-roadmap-v1.js:140-170
const requiredSections = [
  { id: 'milestone', keywords: ['里程碑', 'Milestone', 'Phase', '阶段'] },
  { id: 'dod', keywords: ['DoD', 'Definition of Done', '验收标准', '交付标准'] },
  { id: 'dependencies', keywords: ['依赖', 'Dependencies', '前置条件'] },
  { id: 'risks', keywords: ['风险', 'Risks', '风险点'] }
];

const missingSections = requiredSections.filter(s => 
  !s.keywords.some(keyword => roadmapContent.includes(keyword))
);
if (missingSections.length > 0) {
  return { passed: false, missingSections };
}
```

**R3: Scope 检查**：
```javascript
// review-roadmap-v1.js:180-210
const prdReqIds = new Set();  // 从 PRD 提取 REQ ID
const roadmapReqIds = new Set();  // 从 ROADMAP 提取 REQ ID
const newReqs = [...roadmapReqIds].filter(id => !prdReqIds.has(id));

if (newReqs.length > 0) {
  return { passed: false, newReqs };  // 引入了 PRD 未定义的新需求
}
```

---

#### 步骤 3: 处理审阅结果

```javascript
// workflow-orchestrator.js:handleRoadmappingReviewDecision()
async handleRoadmappingReviewDecision(stageName, reviewResult) {
  const blockingIssues = [];
  
  // Traceability Gate 失败
  if (!reviewResult.gates.traceability?.passed) {
    blockingIssues.push({
      id: 'TRACEABILITY_FAILED',
      severity: 'blocker',
      message: reviewResult.gates.traceability.reason,
      regenerateHint: reviewResult.gates.traceability.suggestion
    });
  }
  
  // Structure Gate 失败
  if (!reviewResult.gates.structure?.passed) {
    blockingIssues.push({
      id: 'STRUCTURE_FAILED',
      severity: 'blocker',
      regenerateHint: reviewResult.gates.structure.suggestion
    });
  }
  
  // Scope Check 失败
  if (!reviewResult.qualityChecks.scope?.passed) {
    blockingIssues.push({
      id: 'SCOPE_CREEP',
      severity: 'blocker',
      regenerateHint: reviewResult.qualityChecks.scope.suggestions[0]
    });
  }
  
  if (blockingIssues.length > 0) {
    // 失败：写回 lastRegenerateHint，retryCount++
    this.stateManager.state.stages.roadmapping.lastRegenerateHint = 
      this.generateRegenerateHint(blockingIssues);
    this.stateManager.state.stages.roadmapping.retryCount++;
    return ReviewDecision.REJECT;
  } else {
    // 待办建议 #3：PASS 时清理重试痕迹
    this.stateManager.state.stages.roadmapping.lastRegenerateHint = null;
    this.stateManager.state.stages.roadmapping.retryCount = 0;
    this.stateManager.state.stages.roadmapping.attempt = 1;
    return ReviewDecision.PASS;
  }
}
```

---

#### 步骤 4: 可收敛重试闭环

```
生成 ROADMAP.md
  ↓
自动审阅（R1/R2/R3）
  ↓
审阅通过？─── 否 → 生成 blockingIssues
  ↓                    ↓
 是                  写回 lastRegenerateHint
  ↓                    ↓
清理重试痕迹          retryCount++
  ↓                    ↓
PASS                下一轮注入 hint
                      ↓
                    重新生成
```

**重试限制**：
- 最大重试次数：`maxRetries`（默认 3 次）
- 达到限制后：升级到 `blocked`，通知用户介入

---

### 3.3 输出

| 输出项 | 位置 | 说明 |
|--------|------|------|
| `ROADMAP.md` | `02_roadmapping/ROADMAP.md` | 开发计划文档（追加式） |
| `stageStatus` | `state.json` | `passed` |
| `retryCount` | `state.json` | 重置为 0 |
| `attempt` | `state.json` | 重置为 1 |

---

## 4. 关键代码位置

### 4.1 Workflow Orchestrator

| 功能 | 文件 | 行号 |
|------|------|------|
| Designing 执行 | `workflow-orchestrator.js` | 890-1050 |
| Roadmapping 入口门禁 | `workflow-orchestrator.js` | 100-115 |
| Roadmapping 审阅 | `workflow-orchestrator.js` | 1091-1130 |
| 重试处理 | `workflow-orchestrator.js` | 1140-1200 |

### 4.2 Review Agents

| 功能 | 文件 | 说明 |
|------|------|------|
| Design 审阅 | `review-design-v2.js` | D1-D7 检查点 |
| Roadmap 审阅 | `review-roadmap-v1.js` | R1-R3 检查点 |

### 4.3 Utils

| 功能 | 文件 | 说明 |
|------|------|------|
| 入口门禁校验 | `validate-roadmapping-entry.js` | 两处门禁检查 |
| Policy 验证 | `designing-policy-validator.js` | Designing 策略验证 |

---

## 5. 测试覆盖

### 5.1 Designing 测试

| 测试用例 | 验证点 | 状态 |
|---------|--------|------|
| PRD 确认流程 | 状态流转正确 | ✅ |
| TRD 确认流程 | 状态流转正确 | ✅ |
| Approved 快照 | 内容完整 | ✅ |
| 断点续传 | 恢复后不重复生成 | ✅ |

### 5.2 Roadmapping 测试

| 测试用例 | 验证点 | 状态 |
|---------|--------|------|
| 缺结构章节 → reject | R2 检查 | ✅ |
| 引入 PRD 未定义 REQ → reject | R3 检查 | ✅ |
| 完整 ROADMAP → pass | 所有检查 | ✅ |
| 空内容判空 | 待办建议 #1 | ✅ |
| 需求提取规则增强 | 待办建议 #2 | ✅ |

**测试文件**：`test/test-roadmapping-integration.js`（5/5 通过）

---

## 6. 常见问题

### Q1: Designing 阶段卡住怎么办？

**检查状态**：
```bash
cat state.json | jq '.stages.designing.stageStatus'
```

**可能状态**：
- `prd_confirm_pending` → 等待 PRD 确认
- `trd_confirm_pending` → 等待 TRD 确认
- `blocked` → 重试耗尽，需要用户介入

**解决方案**：
- 等待确认 → 调用 `approvePRD()` 或 `approveTRD()`
- 已阻断 → 手动修复后重置状态

---

### Q2: Roadmapping 重试耗尽怎么办？

**检查日志**：
```bash
cat state.json | jq '.stages.roadmapping'
```

**可能原因**：
- R1 失败：REQUIREMENTS 格式不兼容
- R2 失败：ROADMAP 缺少必需章节
- R3 失败：引入了 PRD 未定义的需求

**解决方案**：
1. 查看 `lastBlockingIssues` 了解失败原因
2. 手动修复 ROADMAP.md
3. 重置 `retryCount=0` 并继续

---

### Q3: 如何验证入口门禁？

**手动触发检查**：
```javascript
const { validateRoadmappingEntry } = require('./utils/validate-roadmapping-entry');
const validation = validateRoadmappingEntry(stateManager, state);
console.log(validation);
```

**期望输出**：
```json
{
  "ok": true,
  "details": {
    "designingPassed": true,
    "approvedExists": true,
    "hashesMatch": true
  }
}
```

---

## 7. 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-04-08 | 初始版本，整理 Designing→Roadmapping 完整流程 |
| v3.5.0 | 2026-04-08 | Roadmapping 待办建议修复（空内容判空/需求提取增强/集成测试） |
| v3.4.0 | 2026-04-07 | Designing Policy 优化完整修复 |

---

## 8. 参考文档

- `AGENTS.md` - 操作手册（流程引擎调用说明）
- `REQUIREMENTS.md` - 需求说明（openclaw-ouyp 提供）
- `01_designing/PRD.md` - 产品需求文档（AI 生成）
- `01_designing/TRD.md` - 技术设计文档（AI 生成）
- `02_roadmapping/ROADMAP.md` - 开发计划（AI 生成）
- `workflow-orchestrator.js` - 流程编排器（核心代码）
- `review-roadmap-v1.js` - Roadmap 审阅 Agent

---

*本文档由 openclaw-ouyp 维护*  
**版本**: v1.0 | **状态**: 稳定 ✅
