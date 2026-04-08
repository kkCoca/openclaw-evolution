# 端到端整改完成报告（designing → roadmapping → detailing）

> **版本**: v1.0  
> **日期**: 2026-04-08  
> **状态**: 已完成 ✅

---

## 📋 整改目标

实现 designing→roadmapping→detailing 端到端连通：
- ✅ **designing**: 人工确认 + approved 快照写入
- ✅ **roadmapping**: 自动审阅 + 自动返工闭环
- ✅ **detailing**: 自动审阅（最小规则）+ 自动返工闭环

---

## 🔧 改动清单

### 1. review-orchestrator.js（审阅模式分流）

**文件**: `projects/clawdevflow/04_coding/src/review-orchestrator/review-orchestrator.js`

**改动内容**：
- 导入 `ReviewRoadmapAgentV1`
- 初始化时注册 roadmapping agent
- `review()` 方法增加审阅模式分流：
  - `roadmapping/detailing` → 自动审阅（`executeAutoReview`）
  - `designing/coding` → 人工确认（原有逻辑）
- 新增 `executeAutoReview()` 方法：
  - roadmapping: 使用 ReviewRoadmapAgentV1，读取 ROADMAP.md 注入 `roadmapContent`
  - detailing: 最小规则检查（文件存在 + 非空 + 关键章节关键词）

**代码行数**: +150 行

---

### 2. workflow-orchestrator.js（核心改动）

**文件**: `projects/clawdevflow/04_coding/src/cdf-orchestrator/workflow-orchestrator.js`

**改动内容**：

#### 2.1 导入依赖
```javascript
const fs = require('fs');
const crypto = require('crypto');
const { validateRoadmappingEntry } = require('../utils/validate-roadmapping-entry');
```

#### 2.2 executeStage 方法
- **Roadmapping 入口门禁（第一处）**：
  ```javascript
  if (stageName === 'roadmapping') {
    const validation = validateRoadmappingEntry(this.stateManager, this.stateManager.state);
    if (!validation.ok) {
      return { success: false, error: validation.reason };
    }
  }
  ```

- **自动返工循环（roadmapping/detailing）**：
  ```javascript
  const autoRetryStages = ['roadmapping', 'detailing'];
  if (autoRetryStages.includes(stageName)) {
    while (retryCount < maxRetries) {
      // 执行阶段 → 审阅 → 处理决策
      if (decision === 'pass') {
        // 清理重试痕迹
        return { success: true };
      } else if (decision === 'reject') {
        // 写回 regenerateHint + retryCount++
        if (retryCount >= maxRetries) {
          return { success: false, error: '超过最大重试次数' };
        }
        // 继续循环
      }
    }
  }
  ```

#### 2.3 prepareStageInput 方法
- 为 roadmapping/detailing 注入 `attempt` + `regenerateHint`：
  ```javascript
  case Stage.ROADMAPPING:
    input.attempt = (roadmappingStage.retryCount || 0) + 1;
    input.regenerateHint = this.stateManager.state.stages.roadmapping.lastRegenerateHint || '';
    break;
  ```

#### 2.4 handleReviewDecision 方法
- designing pass 时写入 approved 快照：
  ```javascript
  if (stageName === 'designing') {
    await this.writeDesigningApprovedSnapshot(workflowConfig.projectPath);
  }
  ```

#### 2.5 新增 writeDesigningApprovedSnapshot 方法
```javascript
async writeDesigningApprovedSnapshot(projectPath) {
  // 读取 REQUIREMENTS.md, PRD.md, TRD.md
  // 计算 sha256 哈希
  // 写入 state.stages.designing.approved
}
```

**代码行数**: +250 行

---

### 3. stage-executor.js（传递 regenerateHint）

**文件**: `projects/clawdevflow/04_coding/src/cdf-orchestrator/stage-executor.js`

**改动内容**：
- `executeRoadmapping()`: 传递 `attempt` + `regenerateHint` 给 adapter
- `executeDetailing()`: 传递 `attempt` + `regenerateHint` 给 adapter

**代码示例**：
```javascript
const result = await this.aiAdapter.execute('roadmapping', {
  projectPath,
  designingPath,
  outputDir: roadmappingPath,
  attempt: input.attempt || 1,
  regenerateHint: input.regenerateHint || ''  // ← 新增
});
```

**代码行数**: +10 行

---

### 4. state-manager.js（添加必要字段）

**文件**: `projects/clawdevflow/04_coding/src/cdf-orchestrator/state-manager.js`

**改动内容**：

#### 4.1 createInitialState 方法
- 所有阶段添加 `stageStatus` 字段（用于入口门禁校验）
- roadmapping/detailing 添加：
  - `lastRegenerateHint: ''`
  - `lastBlockingIssues: []`
  - `lastAutoReviewReport: null`
- designing 添加：
  - `stageStatus: 'pending'`
  - `approved: null`

#### 4.2 updateStage 方法
- 同步更新 `stageStatus`：
  ```javascript
  const statusMap = {
    [StageStatus.PENDING]: 'pending',
    [StageStatus.RUNNING]: 'running',
    [StageStatus.REVIEWING]: 'reviewing',
    [StageStatus.PASSED]: 'passed',
    // ...
  };
  this.state.stages[stageName].stageStatus = statusMap[status] || status;
  ```

**代码行数**: +40 行

---

## 🧪 验收用例

### E2E-1: designing pass → approved 快照写入

**测试步骤**：
1. 启动流程：`/sessions_spawn clawdevflow`
2. designing 阶段生成 PRD.md + TRD.md
3. 审阅通过（pass）
4. 检查 state.json

**期望结果**：
```json
{
  "stages": {
    "designing": {
      "stageStatus": "passed",
      "approved": {
        "requirementsHash": "sha256:xxx",
        "prdHash": "sha256:yyy",
        "trdHash": "sha256:zzz",
        "requirementsContent": "...",
        "prdContent": "...",
        "trdContent": "...",
        "approvedBy": "openclaw-ouyp",
        "approvedAt": "2026-04-08T10:00:00Z",
        "transitionId": "DESIGNING_APPROVED_1712548800000"
      }
    }
  }
}
```

**状态**: ✅ 已实现

---

### E2E-2: roadmapping reject → 自动返工

**测试步骤**：
1. designing pass 后进入 roadmapping
2. 首次生成 ROADMAP.md 故意缺结构（让审阅 reject）
3. 检查自动返工是否触发

**期望结果**：
- `retryCount: 0 → 1`
- `lastRegenerateHint` 写入修复建议
- 下一轮生成能看到 hint 注入

**状态**: ✅ 已实现

---

### E2E-3: roadmapping pass → 清理重试痕迹

**测试步骤**：
1. roadmapping 审阅通过
2. 检查 state.json

**期望结果**：
```json
{
  "stages": {
    "roadmapping": {
      "retryCount": 0,
      "lastRegenerateHint": "",
      "stageStatus": "passed"
    }
  }
}
```

**状态**: ✅ 已实现

---

### E2E-4: detailing 空文件 → reject → 自动返工

**测试步骤**：
1. detailing 生成空 DETAIL.md
2. 自动审阅检查（最小规则）
3. 检查是否 reject 并触发返工

**期望结果**：
- 审阅决策：`reject`
- fixItems: `[{ id: 'FILE_EMPTY', description: 'DETAIL.md 文件存在但内容为空' }]`
- retryCount++

**状态**: ✅ 已实现

---

## 📊 代码统计

| 文件 | 改动行数 | 新增功能 |
|------|---------|---------|
| review-orchestrator.js | +150 | 审阅模式分流 + 自动审阅 |
| workflow-orchestrator.js | +250 | 自动返工循环 + approved 快照 + 入口门禁 |
| stage-executor.js | +10 | 传递 regenerateHint |
| state-manager.js | +40 | 添加必要字段 |
| **总计** | **+450 行** | **4 个核心改动** |

---

## 🎯 核心成果

### 1. 审阅模式分流
- ✅ roadmapping/detailing 走自动审阅
- ✅ designing/coding 走人工确认
- ✅ 不再 throw "未知审阅阶段"

### 2. 自动返工闭环
- ✅ while 循环控制重试（非递归）
- ✅ reject → 写回 hint + retryCount++
- ✅ pass → 清理重试痕迹
- ✅ 最大重试次数：3 次

### 3. approved 快照
- ✅ designing pass 时写入
- ✅ 包含：哈希 + 内容 + 审批元数据
- ✅ roadmapping 入口门禁依赖

### 4. 入口门禁
- ✅ 两处校验（executeStage + 内部）
- ✅ 检查项：stageStatus + approved 快照 + 哈希一致性

### 5. regenerateHint 注入
- ✅ prepareStageInput 注入 attempt + hint
- ✅ stage-executor 传递给 adapter
- ✅ AI 工具能看到上次失败原因

---

## 🚀 下一步计划

### 本次不做（避免冗余）
- ❌ coding 自动审阅
- ❌ testing 阶段完整实现
- ❌ reviewing 自动验收
- ❌ deploy 流程

### 下一阶段任务
1. coding 自动审阅（lint/test/build）
2. testing 阶段（Stage enum 对齐）
3. reviewing 自动验收（对照 REQUIREMENTS）
4. deploy（人工发布按钮/灰度）

---

## 📝 Git 提交记录

```bash
commit e95e409
feat: 端到端整改（designing→roadmapping→detailing）

核心改动：
1. review-orchestrator.js - 审阅模式分流
2. workflow-orchestrator.js - 自动返工循环 + approved 快照 + 入口门禁
3. stage-executor.js - 传递 regenerateHint
4. state-manager.js - 添加必要字段

验收用例：
- E2E-1: designing pass → approved 快照写入
- E2E-2: roadmapping reject → 自动返工
- E2E-3: roadmapping pass → 清理重试痕迹
- E2E-4: detailing 空文件 → reject → 自动返工
```

---

## ✅ 整改完成确认

| 改动项 | 状态 | 验收 |
|--------|------|------|
| review-orchestrator 审阅模式分流 | ✅ 完成 | 待测试 |
| workflow-orchestrator 自动返工循环 | ✅ 完成 | 待测试 |
| workflow-orchestrator approved 快照 | ✅ 完成 | 待测试 |
| workflow-orchestrator 入口门禁 | ✅ 完成 | 待测试 |
| stage-executor regenerateHint 传递 | ✅ 完成 | 待测试 |
| state-manager 必要字段 | ✅ 完成 | 待测试 |

---

*整改完成报告 by openclaw-ouyp*  
**版本**: v1.0 | **日期**: 2026-04-08 | **状态**: 已完成 ✅
