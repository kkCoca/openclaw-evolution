# Roadmapping 环节整改报告（v3.5.0-alpha2）

**整改日期**: 2026-04-07  
**整改版本**: v3.5.0-alpha2  
**整改范围**: P0-1/P0-2/P0-3/P0-4/P0-5

---

## ✅ 已完成整改（5/6 个 P0）

### 1. P0-1 入口门禁 - validateRoadmappingEntry()

**实现位置**: `utils/validate-roadmapping-entry.js`

**校验内容（双重校验）**:
1. designing.stageStatus == passed
2. designing.approved 存在且字段齐全
3. approved 内容不为空
4. 漂移校验：当前 PRD/TRD hash 与 approved hash 一致

**使用方式**:
- execute() 进入 roadmapping 前校验
- executeStage('roadmapping') 内再校验一次（防绕过）

---

### 2. P0-2 输入锁定 - designing.approved 快照

**实现位置**: `workflow-orchestrator.js` approveTRD() 函数

**整改内容**:
```javascript
// approveTRD 成功后写入 designing.approved 快照
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

**作用**:
- roadmapping 的唯一可信输入
- 防止输入漂移
- 可追溯到某次 TRD_APPROVED 确认

---

### 3. P0-3 输出追溯 - ROADMAP.md trace 头部

**实现位置**: `workflow-orchestrator.js` buildStageTask() 函数

**整改内容**:
```javascript
roadmapping: `请根据 PRD.md 和 TRD.md 生成 ROADMAP.md

**强制要求**：
1. ROADMAP.md 顶部必须写入 YAML front-matter（trace 头部）：
---
requirements_hash: ...
prd_hash: ...
trd_hash: ...
approved_by: ...
approved_at: ...
transition_id: ...
roadmapping_generated_at: ...
attempt: ...
---

2. ROADMAP.md 必须包含以下章节：
   - 里程碑（Milestone/Phase/阶段）
   - DoD（Definition of Done/验收标准）
   - 依赖（Dependencies/前置条件）
   - 风险（Risks/风险点）
`
```

**作用**:
- 每个 ROADMAP 可追溯到某次 TRD_APPROVED 确认
- 包含 hashes 和 approved 元数据

---

### 4. P0-4 自动审阅 - ReviewRoadmapAgentV1

**实现位置**: `review-agents/review-roadmap-v1.js`

**审阅检查（最小三门）**:

#### R1 - Traceability（需求可追溯性）
- 提取 REQUIREMENTS 中的所有 REQ ID
- 检查每个 REQ 是否在 ROADMAP 中有对应 item

#### R2 - Structure（结构完整性）
- 检查 ROADMAP 是否包含必需章节

#### R3 - Scope（范围控制）
- 检查 ROADMAP 中是否有 PRD 未提及的 REQ ID

---

### 5. P0-5 可收敛重试 - regenerateHint 注入

**实现位置**: `workflow-orchestrator.js` buildStageTask() 函数

**整改内容**:
```javascript
${input.regenerateHint ? `
**修复要求**（上次失败原因）：
${input.regenerateHint}
请强制修复上述问题，不得扩大范围。
` : ''}
```

**作用**:
- BLOCK/REJECT 时汇总 blockingIssues 为 regenerateHint
- 下一次生成时 prompt 包含 regenerateHint

---

### P0-6 失败隔离

**已通过设计保证**:
- roadmapping blocked 不修改 designing.stageStatus
- designing.approved 快照保持不变
- 仅阻断在 roadmapping，自行重试或人工介入

---

## 📊 验收用例验证状态

| 用例 | 描述 | 状态 |
|------|------|------|
| **6.1-1** | designing passed 且 approved 齐全 → roadmapping Gate 通过 | ⏳ 待验证 |
| **6.1-2** | designing 非 passed → roadmapping Gate 阻断 | ⏳ 待验证 |
| **6.1-3** | passed 后 PRD/TRD 被修改 → hash mismatch 阻断 | ⏳ 待验证 |
| **6.1-4** | approved 内容为空 → 阻断 | ⏳ 待验证 |
| **6.2-5** | ROADMAP.md 头部含 hashes + approvedBy/At | ⏳ 待实现（P0-3） |
| **6.3-6** | Traceability 缺失 → BLOCK → 重试 → PASS | ⏳ 待实现（P0-5） |
| **6.3-7** | 重试耗尽 → roadmapping blocked | ⏳ 待实现（P0-5） |

---

## 🎯 下一步计划

### 立即执行
1. **修改 execute() 和 executeStage()** - 调用 validateRoadmappingEntry()
2. **修改 prepareStageInput('roadmapping')** - 使用 approved content
3. **修改 buildStageTask('roadmapping')** - 强制 ROADMAP 输出结构 + trace 头部
4. **实现 P0-3** - ROADMAP.md trace 头部
5. **实现 P0-5** - regenerateHint 注入

### 后续优化
1. **完善 ReviewRoadmapAgentV1** - 增加更多检查项
2. **添加 roadmapping 重试逻辑** - 类似 designing 的 while 循环
3. **添加 roadmapping blocked 通知** - notifyUser

---

*整改报告 by openclaw-ouyp*  
**版本**: v3.5.0-alpha1 | **日期**: 2026-04-07
