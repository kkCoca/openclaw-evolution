# DETAILING 环节审阅 Agent 缺失问题分析与优化方案

**日期**: 2026-04-02 17:34  
**版本**: v3.1.7（问题分析）  
**场景**: designing→roadmapping→**detailing**→coding→reviewing

---

## 一、问题发现

### 1.1 当前 DETAILING 环节流程

```
PRD.md + TRD.md + ROADMAP.md
    ↓
[环节 1] 读取 config.yaml 配置
    ↓
[环节 2] 调用 AI 工具执行 detailing skill
    ↓
[环节 3] 阅读 PRD.md、TRD.md、ROADMAP.md
    ↓
[环节 4] 生成文件级详细设计
    ↓
[环节 5] 写入 DETAIL.md
    ↓
进入 CODING 阶段
```

**问题**: **没有审阅环节！**

---

### 1.2 与 ROADMAPPING 环节对比

| 环节 | ROADMAPPING | DETAILING | 差异 |
|------|-------------|-----------|------|
| **审阅机制** | ✅ 自审阅 Agent（12 项检查清单） | ❌ 无审阅 Agent | ❌ 缺失 |
| **检查清单** | ✅ 12 项（R0-R4 + 1-5, 7-8） | ❌ 无 | ❌ 缺失 |
| **评分决策** | ✅ 10/10 通过，8-9/10 修正，<8/10 重做 | ❌ 无 | ❌ 缺失 |
| **修正机制** | ✅ 自动修正（最多 3 次） | ❌ 无 | ❌ 缺失 |
| **审阅报告** | ✅ SELF-REVIEW.md（可选） | ❌ 无 | ❌ 缺失 |
| **生成时间** | ~49 秒 | ~23 秒 | ⚠️ DETAILING 快但无质量保证 |

---

## 二、问题分析

### 2.1 缺失的审阅环节

**当前 DETAILING 环节**:
```
[环节 4] 生成文件级详细设计
    ↓
[环节 5] 写入 DETAIL.md
    ↓
进入 CODING 阶段
```

**应该有的 DETAILING 环节**:
```
[环节 4] 生成文件级详细设计
    ↓
[环节 5] 自审阅（检查清单）
    ↓
[环节 6] 评分决策
    ↓
[环节 7] 修正（如需要）
    ↓
[环节 8] 写入 DETAIL.md
    ↓
进入 CODING 阶段
```

---

### 2.2 风险与影响

| 风险 | 说明 | 影响 |
|------|------|------|
| **质量风险** | DETAIL.md 可能遗漏关键设计细节 | 高 |
| **一致性风险** | DETAIL.md 可能与 PRD/TRD/ROADMAP 不一致 | 高 |
| **可追溯风险** | 需求可能未完全映射到详细设计 | 中 |
| **返工风险** | CODING 阶段发现设计问题，需要返工 | 高 |
| **文档质量风险** | DETAIL.md 可能缺少章节或内容不完整 | 中 |

---

### 2.3 为什么 ROADMAPPING 有审阅而 DETAILING 没有？

**历史原因**:
1. ROADMAPPING 环节在 v3.1.5 进行了审阅 Agent 优化（REQ-011）
2. DETAILING 环节一直保持原始设计，未增加审阅机制
3. 当时认为 DETAILING 环节简单（~23 秒），不需要审阅

**现状**:
- ROADMAPPING 有 12 项检查清单，审阅得分 95-100%
- DETAILING 无审阅，质量无法保证
- **不符合"审阅驱动"的设计理念**

---

## 三、优化方案

### 3.1 新增 DETAILING 审阅 Agent

**审阅 Agent 定位**: 内置于 detailing skill 的质量保证机制

**审阅目标**:
1. ✅ **设计完整性** - DETAIL.md 包含所有必需章节
2. ✅ **需求可追溯** - 所有需求都映射到详细设计
3. ✅ **技术一致性** - 与 TRD.md 技术选型一致
4. ✅ **计划对齐** - 与 ROADMAP.md 开发计划一致
5. ✅ **设计质量** - 模块/接口/数据结构设计清晰

---

### 3.2 检查清单设计（建议 8 项）

| ID | 检查点 | 关键性 | 标准 |
|----|--------|--------|------|
| **D0** | **章节完整性** | **critical** | 包含概述/模块/接口/数据结构/代码结构/验收标准 |
| **D1** | **需求可追溯** | **critical** | 所有 REQ-XXX 都映射到详细设计 |
| **D2** | **技术一致性** | **critical** | 与 TRD.md 技术选型一致 |
| **D3** | **计划对齐** | **critical** | 与 ROADMAP.md 开发计划一致 |
| D4 | 模块设计清晰 | normal | 每个模块职责清晰、接口明确 |
| D5 | 接口设计完整 | normal | API 路径/方法/参数/返回值/错误码完整 |
| D6 | 数据结构合理 | normal | 数据库表结构/字段类型/索引/关系完整 |
| D7 | 代码结构规范 | normal | 目录结构/文件组织/命名规范清晰 |

**评分决策规则**:
- **Critical 项（D0-D3）**: 一票否决，任一失败→驳回重做
- **Normal 项（D4-D7）**: 1-2 项失败→条件通过，3 项 + 失败→驳回

---

### 3.3 审阅流程设计

```
生成 DETAIL.md 初稿
    ↓
[步骤 1] 执行 8 项检查清单
    ↓
[步骤 2] 计算得分（0-8）
    ↓
[步骤 3] 评分决策
    ├─ 8/8 + Critical 全部通过 → pass
    ├─ 6-7/8 + Critical 全部通过 → conditional
    └─ <6/8 或 Critical 失败 → reject
    ↓
[步骤 4] 修正（如需要，最多 3 次）
    ↓
[步骤 5] 写入 DETAIL.md
```

---

### 3.4 检查点详细设计

#### D0: 章节完整性（Critical）

**检查内容**: DETAIL.md 是否包含所有必需章节？

**验证方法**:
```javascript
function checkChapterCompleteness(detailContent) {
  const requiredChapters = [
    '概述',
    '模块设计',
    '接口设计',
    '数据结构设计',
    '代码结构说明',
    '验收标准'
  ];
  
  for (const chapter of requiredChapters) {
    if (!detailContent.includes(chapter)) {
      return { passed: false, missing: chapter };
    }
  }
  
  return { passed: true };
}
```

**示例**:
```markdown
✅ 正确：
# 详细设计文档（DETAIL）

## 1. 概述
## 2. 模块设计
## 3. 接口设计
## 4. 数据结构设计
## 5. 代码结构说明
## 6. 验收标准

❌ 错误：
# 详细设计文档（DETAIL）

## 1. 概述
## 2. 模块设计
（缺少接口设计、数据结构设计等章节）
```

---

#### D1: 需求可追溯（Critical）

**检查内容**: 所有 REQ-XXX 都映射到详细设计？

**验证方法**:
```javascript
function checkRequirementTraceability(detailContent, requirementsContent) {
  // 1. 从 REQUIREMENTS 抽取所有需求 ID
  const requirementIds = extractRequirementIds(requirementsContent);
  // ['REQ-001', 'REQ-002', ..., 'REQ-012']
  
  // 2. 在 DETAIL 全文查找这些 ID
  const coveredIds = [];
  const missingIds = [];
  
  for (const reqId of requirementIds) {
    if (detailContent.includes(reqId)) {
      coveredIds.push(reqId);
    } else {
      missingIds.push(reqId);
    }
  }
  
  return {
    passed: missingIds.length === 0,
    coverage: coveredIds.length / requirementIds.length,
    covered: coveredIds,
    missing: missingIds
  };
}
```

**示例**:
```markdown
✅ 正确（覆盖率 100%）：
DETAIL.md 中包含：REQ-001, REQ-002, ..., REQ-012

❌ 错误（覆盖率不足）：
DETAIL.md 中包含：REQ-001, REQ-002, REQ-003
缺失：REQ-004, REQ-005, ..., REQ-012
```

---

#### D2: 技术一致性（Critical）

**检查内容**: 与 TRD.md 技术选型一致？

**验证方法**:
```javascript
function checkTechnicalAlignment(detailContent, trdContent) {
  // 1. 提取 TRD.md 中的技术选型
  const trdTechStack = extractTechStack(trdContent);
  
  // 2. 提取 DETAIL.md 中的技术选型
  const detailTechStack = extractTechStack(detailContent);
  
  // 3. 检查是否一致
  for (const tech of detailTechStack) {
    if (!trdTechStack.includes(tech)) {
      return { passed: false, conflict: tech };
    }
  }
  
  return { passed: true };
}
```

**示例**:
```markdown
✅ 正确：
TRD.md 技术选型：
- 数据库：MySQL
- 后端：Node.js + Express
- 前端：React

DETAIL.md 任务：
- 使用 MySQL 设计数据库表
- 基于 Node.js + Express 实现后端 API
- 使用 React 开发前端页面

❌ 错误：
DETAIL.md 任务：
- 使用 MongoDB 设计数据库（与 TRD 冲突）
```

---

#### D3: 计划对齐（Critical）

**检查内容**: 与 ROADMAP.md 开发计划一致？

**验证方法**:
```javascript
function checkPlanAlignment(detailContent, roadmapContent) {
  // 1. 提取 ROADMAP.md 中的任务列表
  const roadmapTasks = extractTasks(roadmapContent);
  
  // 2. 检查 DETAIL.md 是否有对应的设计
  const alignedTasks = [];
  const missingTasks = [];
  
  for (const task of roadmapTasks) {
    if (detailContent.includes(task.name) || detailContent.includes(task.description)) {
      alignedTasks.push(task);
    } else {
      missingTasks.push(task);
    }
  }
  
  return {
    passed: missingTasks.length === 0,
    aligned: alignedTasks,
    missing: missingTasks
  };
}
```

**示例**:
```markdown
✅ 正确：
ROADMAP.md 任务：
- 【用户认证】(后端) 实现 JWT 登录接口
- 【用户认证】(前端) 登录页面开发

DETAIL.md 设计：
- 用户认证模块设计（对应 JWT 登录接口）
- 登录页面组件设计（对应登录页面开发）

❌ 错误：
DETAIL.md 设计：
- 用户认证模块设计
（缺少登录页面组件设计，与 ROADMAP 不一致）
```

---

#### D4-D7: Normal 项检查

**D4: 模块设计清晰**:
- 每个模块职责单一
- 模块间接口明确
- 依赖关系清晰

**D5: 接口设计完整**:
- API 路径完整
- 方法（GET/POST/PUT/DELETE）明确
- 参数/返回值定义清晰
- 错误码完整

**D6: 数据结构合理**:
- 数据库表结构完整
- 字段类型定义准确
- 索引设计合理
- 表关系明确

**D7: 代码结构规范**:
- 目录结构清晰
- 文件组织合理
- 命名规范一致

---

### 3.5 评分决策规则

**评分计算**:
```javascript
function calculateScore(checkpoints) {
  const passedCount = checkpoints.filter(c => c.passed).length;
  return passedCount; // 0-8
}
```

**决策规则**:
```javascript
function makeDecision(score, criticalResults) {
  const criticalFailed = criticalResults.filter(r => !r.passed).length;
  
  if (criticalFailed > 0) {
    return 'reject'; // Critical 项失败→驳回
  }
  
  if (score === 8) {
    return 'pass'; // 8/8→通过
  } else if (score >= 6) {
    return 'conditional'; // 6-7/8→条件通过
  } else {
    return 'reject'; // <6/8→驳回
  }
}
```

**决策矩阵**:
| Critical 项 | Normal 项 | 得分 | 决策 |
|-----------|---------|------|------|
| 全部通过 | 全部通过 | 8/8 | ✅ **pass** |
| 全部通过 | 1-2 项失败 | 6-7/8 | ⚠️ **conditional** |
| 全部通过 | 3 项 + 失败 | <6/8 | ❌ **reject** |
| 部分失败 | 任意 | 任意 | ❌ **reject** |

---

### 3.6 修正机制

**修正流程**:
```
评分 6-7/8（conditional）或<6/8（reject）
    ↓
识别未通过项
    ↓
生成修正建议
    ↓
修正 DETAIL.md
    ↓
重新自审阅（最多 3 次）
    ↓
评分 8/8 → 写入文件
```

**修正示例**:
```
问题：D0 章节完整性失败，缺少"接口设计"章节
修正：补充第 3 章接口设计，包含 API 路径/方法/参数/返回值/错误码

问题：D1 需求可追溯失败，缺失 REQ-004, REQ-005
修正：补充 REQ-004 和 REQ-005 的详细设计映射
```

---

## 四、实施建议

### 4.1 优先级排序

| 优先级 | 检查点 | 理由 | 预计时间 |
|--------|--------|------|---------|
| **P0** | D0 章节完整性 | 基础质量保证 | 1 小时 |
| **P0** | D1 需求可追溯 | 确保需求不遗漏 | 2 小时 |
| **P0** | D2 技术一致性 | 避免技术选型冲突 | 1 小时 |
| **P0** | D3 计划对齐 | 确保与 ROADMAP 一致 | 1 小时 |
| **P1** | D4-D7 Normal 项 | 提升设计质量 | 3 小时 |

### 4.2 实施步骤

**阶段 1: 添加 Critical 规则（P0, 5 小时）**
1. 实现 D0 章节完整性检查
2. 实现 D1 需求可追溯检查
3. 实现 D2 技术一致性检查
4. 实现 D3 计划对齐检查
5. 更新评分决策规则
6. 测试验证

**阶段 2: 添加 Normal 规则（P1, 3 小时）**
1. 实现 D4 模块设计清晰检查
2. 实现 D5 接口设计完整检查
3. 实现 D6 数据结构合理检查
4. 实现 D7 代码结构规范检查
5. 测试验证

**阶段 3: 优化和文档（P2, 2 小时）**
1. 更新 bundled-skills/detailing/SKILL.md
2. 更新 adapters/opencode.js
3. 添加示例文件
4. 更新测试用例

---

## 五、预期效果

### 5.1 与 ROADMAPPING 环节对齐

| 特性 | ROADMAPPING | DETAILING（优化后） | 提升 |
|------|-------------|-------------------|------|
| **审阅机制** | ✅ 自审阅 Agent | ✅ 自审阅 Agent | ✅ 对齐 |
| **检查清单** | ✅ 12 项 | ✅ 8 项 | ✅ 增加 |
| **评分决策** | ✅ 10/10 通过 | ✅ 8/8 通过 | ✅ 对齐 |
| **修正机制** | ✅ 自动修正 | ✅ 自动修正 | ✅ 对齐 |
| **审阅报告** | ✅ SELF-REVIEW.md | ✅ DETAIL-REVIEW.md | ✅ 新增 |
| **生成时间** | ~49 秒 | ~35-40 秒 | ⚠️ 略增但可接受 |

### 5.2 质量提升

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 章节完整性 | 无保证 | 100% 保证 | 显著提升 |
| 需求可追溯 | 无保证 | 100% 覆盖 | 显著提升 |
| 技术一致性 | 无保证 | 100% 一致 | 显著提升 |
| 计划对齐 | 无保证 | 100% 对齐 | 显著提升 |
| 返工风险 | 高 | 低 | 显著降低 |

---

## 六、总结

### 6.1 问题总结

**核心问题**: DETAILING 环节不存在审阅 Agent

**影响**:
- ❌ DETAIL.md 质量无法保证
- ❌ 可能遗漏关键设计细节
- ❌ 可能与 PRD/TRD/ROADMAP 不一致
- ❌ CODING 阶段可能返工
- ❌ 不符合"审阅驱动"设计理念

### 6.2 优化方案总结

**新增审阅 Agent**:
- ✅ 8 项检查清单（4 项 critical + 4 项 normal）
- ✅ 评分决策规则（Critical 一票否决）
- ✅ 自动修正机制（最多 3 次）
- ✅ 审阅报告（DETAIL-REVIEW.md，可选）

**预期效果**:
- ✅ 与 ROADMAPPING 环节审阅机制对齐
- ✅ DETAIL.md 质量显著提升
- ✅ 返工风险显著降低
- ✅ 符合"审阅驱动"设计理念

---

*DETAILING 环节审阅 Agent 缺失问题分析与优化方案 by openclaw-ouyp*  
**版本**: v3.1.7 | **日期**: 2026-04-02 17:34 | **状态**: 待评审
