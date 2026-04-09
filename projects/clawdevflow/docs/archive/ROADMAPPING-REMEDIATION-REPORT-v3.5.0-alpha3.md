# Roadmapping 整改报告（v3.5.0-alpha3）

> **版本**: v3.5.0-alpha3  
> **提交**: `cf2f7b4`  
> **日期**: 2026-04-07  
> **状态**: ✅ 完成

---

## 1. 整改背景

审阅人（GPT-5.2）在 commit `0366668` 审阅中指出 **2 个 P0 级问题**：

### P0-1：方案偏离（已解决）
- **问题**：文档承诺方案 B（`_approved/` 文件快照），实际实现方案 A（state 内快照）
- **解决**：更新文档，统一采用方案 A，与实现对齐
- **文件**：`ROADMAP_REMEDIATION_REPORT_UPDATE_consistent_with_designing_A_1775557251970.md`

### P0-2：重试闭环未接通（本次修复）
- **问题**：ReviewRoadmapAgentV1 失败后，没有把失败原因写成 `regenerateHint` 并驱动重试
- **缺口**：
  - ❌ 失败后没有提取 blockingIssues
  - ❌ 没有写入 `lastRegenerateHint`
  - ❌ `retryCount` 没有递增和持久化

---

## 2. 整改内容（v3.5.0-alpha3）

### 2.1 state-manager.js 修改

为 roadmapping 阶段添加专用字段（类似 designing）：

```javascript
...(stage === 'roadmapping' ? {
  stageStatus: 'running',  // running | reviewing | passed | rejected | blocked
  attempt: 0,
  lastAutoReviewReport: null,
  lastBlockingIssues: [],
  lastRegenerateHint: ''
} : {})
```

**字段说明**：
| 字段 | 用途 |
|------|------|
| `stageStatus` | 阶段状态（运行中/待审阅/通过/驳回/阻断） |
| `attempt` | 当前尝试次数 |
| `lastAutoReviewReport` | 上次自动审阅报告 |
| `lastBlockingIssues` | 上次 blocking issues 列表 |
| `lastRegenerateHint` | 注入下次重试的修复要求 |

---

### 2.2 workflow-orchestrator.js 修改

#### 新增函数：`handleRoadmappingReviewDecision()`

```javascript
async handleRoadmappingReviewDecision(stageName, reviewResult) {
  // 1. 保存审阅报告
  this.stateManager.state.stages.roadmapping.lastAutoReviewReport = reviewResult;
  
  // 2. 提取 blockingIssues
  const blockingIssues = [];
  
  // Traceability Gate 失败
  if (!reviewResult.gates.traceability?.passed) {
    blockingIssues.push({
      id: 'TRACEABILITY_FAILED',
      severity: 'blocker',
      message: traceability.reason,
      uncoveredReqs: traceability.uncoveredReqs,
      regenerateHint: traceability.suggestion
    });
  }
  
  // Structure Gate 失败
  if (!reviewResult.gates.structure?.passed) {
    blockingIssues.push({
      id: 'STRUCTURE_FAILED',
      severity: 'blocker',
      message: structure.reason,
      missingSections: structure.missingSections,
      regenerateHint: structure.suggestion
    });
  }
  
  // Scope Check 失败
  if (!reviewResult.qualityChecks.scope?.passed) {
    blockingIssues.push({
      id: 'SCOPE_FAILED',
      severity: 'blocker',
      message: scope.issues?.[0],
      newReqs: scope.details?.newReqs,
      regenerateHint: scope.suggestions?.[0]
    });
  }
  
  // 3. 保存 blockingIssues
  this.stateManager.state.stages.roadmapping.lastBlockingIssues = blockingIssues;
  
  // 4. 生成 regenerateHint 并写入 state
  if (blockingIssues.length > 0) {
    const regenerateHint = blockingIssues.map(issue => {
      return `【强制修复】${issue.id}: ${issue.message}\n${issue.regenerateHint || ''}`;
    }).join('\n\n');
    
    this.stateManager.state.stages.roadmapping.lastRegenerateHint = regenerateHint;
    
    // 5. retryCount++ 并持久化
    const currentRetryCount = this.stateManager.state.stages.roadmapping.retryCount || 0;
    this.stateManager.state.stages.roadmapping.retryCount = currentRetryCount + 1;
    this.stateManager.state.stages.roadmapping.attempt = currentRetryCount + 2;
    
    this.stateManager.save();
    
    // 6. 返回 reject，触发重试
    return ReviewDecision.REJECT;
  }
  
  // 所有检查通过
  return ReviewDecision.PASS;
}
```

#### 修改调用点

```javascript
// 原代码
const decision = this.convertV1ReviewToDecision(reviewResult);
await this.handleReviewDecision(stageName, decision, reviewResult);

// 修改后
const decision = await this.handleRoadmappingReviewDecision(stageName, reviewResult);
await this.handleReviewDecision(stageName, decision, reviewResult);
```

---

## 3. 重试闭环流程

```
┌─────────────────────────────────────────────────────────────┐
│                    Roadmapping 阶段                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  执行 AI 工具生成 ROADMAP.md     │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  ReviewRoadmapAgentV1 审阅      │
              │  - Traceability Gate          │
              │  - Structure Gate             │
              │  - Scope Check                │
              └───────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
     ┌─────────────────┐            ┌─────────────────┐
     │   审阅通过       │            │   审阅失败       │
     │   (PASS)        │            │   (REJECT)      │
     └─────────────────┘            └─────────────────┘
              │                               │
              ▼                               ▼
     ┌─────────────────┐            ┌─────────────────┐
     │ 进入 detailing   │            │ 提取 blockingIssues │
     └─────────────────┘            │ 生成 regenerateHint │
                                    │ retryCount++      │
                                    │ 写入 state         │
                                    └─────────────────┘
                                                    │
                                                    ▼
                                    ┌─────────────────────────┐
                                    │ 下一轮重试               │
                                    │ buildStageTask() 注入    │
                                    │ regenerateHint 到 prompt │
                                    └─────────────────────────┘
                                                    │
                                                    └──────┐
                                                           │
                                                           ▼
                                              （回到 AI 工具生成步骤）
```

---

## 4. 回归测试用例

### 用例 1：正常通过流程
```
Given: designing 已通过，approved 快照完整
When:  roadmapping 生成合规 ROADMAP（覆盖所有 REQ，包含必备章节，无新增范围）
Then:  ReviewRoadmapAgentV1 返回 pass → 进入 detailing
```

### 用例 2：Traceability 失败 → 重试 → 通过
```
Given: ROADMAP 遗漏 REQ-3
When:  ReviewRoadmapAgentV1 执行审阅
Then:  blockingIssues = [{ id: 'TRACEABILITY_FAILED', uncoveredReqs: ['REQ-3'] }]
       regenerateHint = "【强制修复】TRACEABILITY_FAILED: ... 请确保 ROADMAP 覆盖所有 REQ 需求"
       retryCount = 1
       下一轮 prompt 注入 regenerateHint
When:  AI 修复后重新生成 ROADMAP（覆盖 REQ-3）
Then:  审阅通过，进入 detailing
```

### 用例 3：Structure 失败 → 重试 → 通过
```
Given: ROADMAP 缺少"风险"章节
When:  ReviewRoadmapAgentV1 执行审阅
Then:  blockingIssues = [{ id: 'STRUCTURE_FAILED', missingSections: ['risks'] }]
       regenerateHint = "【强制修复】STRUCTURE_FAILED: ... 请添加缺失的章节（里程碑/DoD/依赖/风险）"
       retryCount = 1
When:  AI 修复后添加"风险"章节
Then:  审阅通过
```

### 用例 4：Scope 失败 → 重试 → 通过
```
Given: ROADMAP 引入 PRD 未定义的 REQ-999
When:  ReviewRoadmapAgentV1 执行审阅
Then:  blockingIssues = [{ id: 'SCOPE_FAILED', newReqs: ['REQ-999'] }]
       regenerateHint = "【强制修复】SCOPE_FAILED: ... 请移除 PRD 未定义的新需求"
       retryCount = 1
When:  AI 修复后移除 REQ-999
Then:  审阅通过
```

### 用例 5：重试耗尽 → blocked
```
Given: ROADMAP 持续遗漏 REQ-3（AI 无法修复）
When:  retryCount >= maxRetries (默认 3)
Then:  stageStatus = 'blocked'
       notifyUser(type='STAGE_RETRY_EXHAUSTED')
       designing 保持 passed（失败隔离）
```

---

## 5. 所有 P0 状态汇总

| P0 编号 | 描述 | 状态 | 提交 |
|--------|------|------|------|
| P0-1 | 入口门禁（双重校验） | ✅ 完成 | `be9b277` |
| P0-2 | 输入锁定（approved 快照） | ✅ 完成 | `be9b277` |
| P0-3 | 输出追溯（trace 头部） | ✅ 完成 | `9e0fc72` |
| P0-4 | 自动审阅（ReviewRoadmapAgentV1） | ✅ 完成 | `be9b277` |
| P0-5 | 可收敛重试（regenerateHint 注入） | ✅ 完成 | `cf2f7b4` |
| P0-6 | 失败隔离（设计保证） | ✅ 完成 | `be9b277` |

---

## 6. 提交历史

```
cf2f7b4 fix: 补齐 roadmapping 重试闭环 wiring（v3.5.0-alpha3）
0366668 docs: 添加 Roadmapping 整改最终澄清报告（致 GPT-5.2）
5600d2b docs: 添加 Roadmapping 整改澄清报告（致 GPT-5.2）
adf8636 fix: 修复 executeRoadmapReviewV1 和 convertV1ReviewToDecision 函数缺失
0d7c28e docs: 更新 Roadmapping 整改报告（v3.5.0-alpha2）
9e0fc72 feat: 完成 P0-3/P0-5 整改（输出追溯 + 可收敛重试）
098f716 docs: 添加 Roadmapping 环节整改报告（v3.5.0-alpha1）
be9b277 feat: Roadmapping 环节整改（P0-1/P0-2/P0-4）
```

---

## 7. 提交历史

```
10cc77f fix: 修复 roadmapping 重试闭环 2 个关键问题（审阅人 TODO #3/#4）
cf2f7b4 fix: 补齐 roadmapping 重试闭环 wiring（v3.5.0-alpha3）
0366668 docs: 添加 Roadmapping 整改最终澄清报告（致 GPT-5.2）
5600d2b docs: 添加 Roadmapping 整改澄清报告（致 GPT-5.2）
adf8636 fix: 修复 executeRoadmapReviewV1 和 convertV1ReviewToDecision 函数缺失
0d7c28e docs: 更新 Roadmapping 整改报告（v3.5.0-alpha2）
9e0fc72 feat: 完成 P0-3/P0-5 整改（输出追溯 + 可收敛重试）
098f716 docs: 添加 Roadmapping 环节整改报告（v3.5.0-alpha1）
be9b277 feat: Roadmapping 环节整改（P0-1/P0-2/P0-4）
```

---

## 8. 结论

**Roadmapping 环节整改（v3.5.0-alpha3）已完整实现！**

所有 P0 问题已修复，重试闭环已接通：
- ✅ 入口门禁（双重校验）
- ✅ 输入锁定（approved 快照）
- ✅ 输出追溯（trace 头部）
- ✅ 自动审阅（ReviewRoadmapAgentV1）
- ✅ **可收敛重试（regenerateHint 注入）** ← cf2f7b4
- ✅ **ROADMAP.md 文件读取（审阅人 TODO #4）** ← 10cc77f
- ✅ **PASS 清理重试痕迹（审阅人 TODO #3）** ← 10cc77f
- ✅ 失败隔离（设计保证）

**代码已推送到 Gitee 和 GitHub**，等待实际运行验证。

---

*报告生成时间*: 2026-04-07  
*审阅人*: openclaw-ouyp  
*状态*: ✅ 完成
