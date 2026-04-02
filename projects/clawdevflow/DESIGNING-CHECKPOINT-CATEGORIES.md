# DESIGNING 阶段检查点分类说明

**日期**: 2026-04-02  
**版本**: v1.0

---

## 一、检查点分类总览

### 按必须满足程度分类

```
┌─────────────────────────────────────────────────────────────────┐
│  红线项（必须 100% 满足）- Critical                              │
│  ❌ 任何一项不满足 → 直接驳回（reject）                          │
│  - D1: 需求覆盖率 100%                                          │
│  - D2: 文档完整性                                               │
│  - D4: 技术选型合理                                             │
│  - D6: 异常处理                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  质量项（建议满足）- Quality                                     │
│  ⚠️ 不满足时条件通过（conditional），记录待修复项                │
│  - D5: 向后兼容（仅增量需求）                                    │
│  - D7: 验收标准可测试性                                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  加分项（可选满足）- Optional                                    │
│  ✅ 不满足不影响通过，但建议改进                                 │
│  - D3: 无模糊词                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、详细分类说明

### 2.1 红线项（必须 100% 满足）

**特点**: 
- ❌ 任何一项不满足 → **直接驳回（reject）**
- 🔴 不允许妥协
- ✅ 必须 100% 通过

| 检查点 | 权重 | 必须原因 | 不满足后果 |
|--------|------|---------|-----------|
| **D1: 需求覆盖率** | 0.2 | 需求是产品基础，遗漏需求=产品失败 | 开发的功能不完整 |
| **D2: 文档完整性** | 0.15 | 文档不完整=无法指导开发 | 开发人员无法实施 |
| **D4: 技术选型合理** | 0.2 | 技术选型错误=架构失败 | 技术债务、返工 |
| **D6: 异常处理** | 0.2 | 无异常处理=系统不稳定 | 生产环境故障 |

#### D1: 需求覆盖率（100% 必须）

**检查内容**:
- REQUIREMENTS.md 中的每条需求在 PRD.md 中都有对应
- 需求语义准确映射（不只是关键词匹配）
- 需求实现完整（有用户故事 + 验收标准）

**必须原因**:
```
如果需求覆盖率 < 100%:
→ 开发的功能不完整
→ 用户期望落空
→ 需要返工补充需求
→ 浪费开发资源
```

**审阅决策**:
```javascript
if (coverage < 1.0) {
  decision = 'reject';  // 直接驳回
  reason = `需求覆盖率 ${(coverage * 100).toFixed(2)}%，必须 100%`;
  fixItems = uncoveredRequirements;
}
```

**示例**:
```
✅ 通过：10/10 条需求都有准确映射
❌ 驳回：9/10 条需求有映射（覆盖率 90%，不满足 100%）
```

---

#### D2: 文档完整性（100% 必须）

**检查内容**:
- PRD.md 必需章节：产品概述、功能需求、非功能需求、验收标准
- TRD.md 必需章节：技术架构、数据库设计、接口设计、安全设计
- 章节内容不能为空

**必须原因**:
```
如果文档不完整:
→ 开发人员缺少必要信息
→ 无法准确评估工作量
→ 实施过程频繁询问
→ 延期风险高
```

**必需章节清单**:
```javascript
const requiredSections = {
  'PRD.md': [
    '# 产品概述',      // 必须：说明产品定位
    '# 功能需求',      // 必须：说明做什么
    '# 非功能需求',    // 必须：说明性能/安全等
    '# 验收标准'       // 必须：说明如何验证
  ],
  'TRD.md': [
    '# 技术架构',      // 必须：说明技术选型
    '# 数据库设计',    // 必须：说明数据模型
    '# 接口设计',      // 必须：说明 API 设计
    '# 安全设计'       // 必须：说明安全措施
  ]
};
```

**审阅决策**:
```javascript
if (missingSections.length > 0) {
  decision = 'reject';  // 直接驳回
  reason = `缺失关键章节：${missingSections.join(', ')}`;
  fixItems = missingSections.map(s => ({ type: 'add_section', section: s }));
}
```

**示例**:
```
✅ 通过：PRD.md 和 TRD.md 所有必需章节都存在且内容充实
❌ 驳回：TRD.md 缺少"# 安全设计"章节
```

---

#### D4: 技术选型合理（100% 必须）

**检查内容**:
- 有多个候选技术比较（比较表）
- 有明确的决策依据（选择理由）
- AI 评估技术选型合理性（性能、成本、可维护性）

**必须原因**:
```
如果技术选型不合理:
→ 可能选择错误的技术栈
→ 后期发现性能瓶颈
→ 团队学习成本高
→ 技术债务累积
```

**检查标准**:
```javascript
// 必须满足以下条件：
const passed = 
  hasComparisonTable &&    // 有比较表
  hasDecisionRationale &&  // 有决策依据
  aiEvaluation.score >= 7; // AI 评估分数 >= 7/10
```

**审阅决策**:
```javascript
if (!passed) {
  decision = 'reject';  // 直接驳回
  reason = '技术选型不合理';
  fixItems = [
    '添加技术选型比较表（至少 2 个候选技术）',
    '补充决策依据（性能、成本、可维护性等维度）',
    '说明技术选型如何满足项目需求'
  ];
}
```

**示例**:
```
✅ 通过：
| 技术 | 性能 | 成本 | 可维护性 | 团队熟悉度 |
|------|------|------|---------|-----------|
| MySQL | 8 | 9 | 8 | 9 |
| MongoDB | 7 | 8 | 7 | 6 |
决策：选择 MySQL，因为团队熟悉度高，成本更低

❌ 驳回：
技术选型：使用 MySQL
（无比较、无决策依据）
```

---

#### D6: 异常处理（100% 必须）

**检查内容**:
- 正常流程处理
- 失败处理（错误码、重试机制）
- 边界情况（超时、并发、数据异常）
- 降级方案
- 监控告警

**必须原因**:
```
如果异常处理不完整:
→ 生产环境故障无法恢复
→ 用户体验差（错误提示）
→ 问题难以定位（无日志）
→ 系统雪崩风险
```

**检查标准**:
```javascript
// 必须覆盖以下方面：
const requiredCoverage = {
  normalFlow: true,      // 正常流程
  failureHandling: true, // 失败处理
  edgeCases: true,       // 边界情况
  retryMechanism: true,  // 重试机制
  degradation: true,     // 降级方案
  monitoring: true       // 监控告警
};

const passed = Object.values(requiredCoverage).every(v => v === true);
```

**审阅决策**:
```javascript
if (!passed) {
  decision = 'reject';  // 直接驳回
  reason = '异常处理不完整';
  fixItems = [];
  if (!requiredCoverage.failureHandling) fixItems.push('补充失败处理方案');
  if (!requiredCoverage.edgeCases) fixItems.push('补充边界情况处理');
  if (!requiredCoverage.retryMechanism) fixItems.push('补充重试机制');
  if (!requiredCoverage.degradation) fixItems.push('补充降级方案');
  if (!requiredCoverage.monitoring) fixItems.push('补充监控告警');
}
```

**示例**:
```
✅ 通过：
- 正常流程：用户登录成功，返回 Token
- 失败处理：密码错误返回 401，锁定账户
- 边界情况：并发登录、超时处理
- 重试机制：数据库连接失败重试 3 次
- 降级方案：缓存降级
- 监控告警：登录失败率 > 10% 告警

❌ 驳回：
- 只有正常流程描述
- 无失败处理
- 无边界情况
```

---

### 2.2 质量项（建议满足）

**特点**:
- ⚠️ 不满足时**条件通过（conditional）**
- 📝 记录待修复项，后续版本修复
- 💡 影响质量但不阻碍开发

| 检查点 | 权重 | 建议原因 | 不满足处理 |
|--------|------|---------|-----------|
| **D5: 向后兼容** | 0.15 | 增量需求重要，全新功能不适用 | 条件通过，记录待修复 |
| **D7: 验收标准可测试** | 0.1 | 影响测试效率，但可后期补充 | 条件通过，记录待修复 |

#### D5: 向后兼容（仅增量需求必须）

**检查内容**:
- 增量需求必须有兼容性说明
- 兼容性影响分析
- 数据迁移方案（如需要）
- API 版本控制（如需要）
- 回滚方案

**条件原因**:
```
如果是增量需求但无兼容性说明:
→ 可能破坏现有功能
→ 但可以在测试阶段发现和修复
→ 不阻碍开发启动
```

**审阅决策**:
```javascript
if (isIncremental && !hasCompatibility) {
  decision = 'conditional';  // 条件通过
  reason = '增量需求缺少兼容性说明';
  fixItems = [
    '补充兼容性影响分析',
    '补充数据迁移方案（如需要）',
    '补充回滚方案'
  ];
  // 记录到待修复项，不影响进入下一阶段
}
```

**示例**:
```
✅ 通过（全新功能）:
不涉及兼容性问题

✅ 条件通过（增量需求，无兼容说明）:
- 通过，但需修复
- 待修复项：补充兼容性影响分析

❌ 驳回（增量需求，有兼容问题）:
- 明确说明会破坏现有 API
- 但无迁移方案
```

---

#### D7: 验收标准可测试性（建议满足）

**检查内容**:
- 验收标准包含 Given/When/Then 格式
- 或者有可执行描述（用户能够、系统应该）
- 有量化指标
- 可自动化测试

**条件原因**:
```
如果验收标准不可测试:
→ 测试用例编写困难
→ 但可以在测试阶段补充
→ 不阻碍开发启动
```

**审阅决策**:
```javascript
if (!isTestable) {
  decision = 'conditional';  // 条件通过
  reason = '验收标准不可测试';
  fixItems = [
    '将验收标准改写为 Given/When/Then 格式',
    '补充量化指标',
    '明确通过标准'
  ];
}
```

**示例**:
```
✅ 通过:
Given 用户已注册
When 用户输入正确的用户名和密码
Then 系统返回有效的 Token

✅ 条件通过:
用户能够登录系统
（可执行但不够具体，建议补充 Given/When/Then）

❌ 驳回（红线项不满足时）:
系统应该好用
（模糊、不可测试）
```

---

### 2.3 加分项（可选满足）

**特点**:
- ✅ 不满足**不影响通过**
- 💡 建议改进，提升质量
- 📊 计入加权得分

| 检查点 | 权重 | 建议原因 | 不满足处理 |
|--------|------|---------|-----------|
| **D3: 无模糊词** | 0.1 | 提升文档质量，但不阻碍开发 | 记录建议，不影响通过 |

#### D3: 无模糊词

**检查内容**:
- 检测"适当的"、"一些"、"可能"、"大概"、"或许"等模糊词
- 检测"用户友好"、"高性能"等无法量化的描述

**可选原因**:
```
如果有模糊词:
→ 文档质量降低
→ 但不影响功能实现
→ 可以在后续迭代中修正
```

**审阅决策**:
```javascript
if (hasVagueWords) {
  decision = 'pass';  // 仍然通过
  reason = '发现模糊词，建议修正';
  suggestions = vagueWords.map(w => `将"${w}"改为具体描述`);
  // 不计入 fixItems，只记录建议
}
```

**示例**:
```
✅ 通过（有模糊词）:
系统应该适当处理异常情况
建议：将"适当"改为具体的处理方式

✅ 通过（无模糊词）:
系统应该在 3 秒内返回响应，失败时返回 500 错误码
```

---

## 三、审阅决策逻辑

### 3.1 决策流程图

```
开始审阅
   │
   ↓
执行所有检查点
   │
   ↓
检查红线项（D1/D2/D4/D6）
   │
   ├─→ 有红线项不满足？
   │       │
   │       YES
   │       ↓
   │   决策：reject（驳回）
   │   记录 fixItems
   │
   │       NO
   │       ↓
   └─→ 检查质量项（D5/D7）
           │
           ↓
       有质量项不满足？
           │
           ├─→ YES
           │       ↓
           │   决策：conditional（条件通过）
           │   记录 fixItems
           │
           │       NO
           │       ↓
           └─→ 检查加分项（D3）
                   │
                   ↓
               有加分项不满足？
                   │
                   ├─→ YES
                   │       ↓
                   │   决策：pass（通过）
                   │   记录 suggestions（非 fixItems）
                   │
                   │       NO
                   │       ↓
                   └─→ 决策：pass（通过）
                       完美通过
```

### 3.2 决策代码实现

```javascript
async execute(input) {
  const checkpoints = this.loadCheckpoints();
  const results = [];
  
  // 1. 执行所有检查点
  for (const checkpoint of checkpoints) {
    const passed = await this.validateCheckpoint(checkpoint, input);
    results.push({
      id: checkpoint.id,
      name: checkpoint.name,
      passed,
      weight: checkpoint.weight,
      critical: checkpoint.critical
    });
  }
  
  // 2. 检查红线项（critical = true）
  const criticalFailed = results.filter(r => r.critical && !r.passed);
  
  if (criticalFailed.length > 0) {
    // 红线项不满足 → 直接驳回
    return {
      decision: 'reject',
      score: 0,
      reason: `红线项不满足：${criticalFailed.map(r => r.name).join(', ')}`,
      fixItems: criticalFailed.map(r => this.getFixItem(r))
    };
  }
  
  // 3. 检查质量项（D5/D7）
  const qualityFailed = results.filter(r => 
    ['D5', 'D7'].includes(r.id) && !r.passed
  );
  
  if (qualityFailed.length > 0) {
    // 质量项不满足 → 条件通过
    return {
      decision: 'conditional',
      score: this.calculateScore(results),
      reason: `质量项不满足：${qualityFailed.map(r => r.name).join(', ')}`,
      fixItems: qualityFailed.map(r => this.getFixItem(r))
    };
  }
  
  // 4. 检查加分项（D3）
  const optionalFailed = results.filter(r => 
    ['D3'].includes(r.id) && !r.passed
  );
  
  if (optionalFailed.length > 0) {
    // 加分项不满足 → 通过，记录建议
    return {
      decision: 'pass',
      score: this.calculateScore(results),
      reason: '所有关键项通过',
      fixItems: [],
      suggestions: optionalFailed.map(r => this.getSuggestion(r))
    };
  }
  
  // 5. 完美通过
  return {
    decision: 'pass',
    score: 100,
    reason: '所有检查项通过',
    fixItems: [],
    suggestions: []
  };
}
```

---

## 四、权重评分说明

### 4.1 权重分配

| 检查点 | 权重 | 类型 | 说明 |
|--------|------|------|------|
| D1: 需求覆盖率 | 0.20 | 红线 | 最重要，需求是基础 |
| D2: 文档完整性 | 0.15 | 红线 | 文档是开发依据 |
| D3: 无模糊词 | 0.10 | 加分 | 提升质量，非必须 |
| D4: 技术选型 | 0.20 | 红线 | 技术选型决定架构 |
| D5: 向后兼容 | 0.15 | 质量 | 增量需求重要 |
| D6: 异常处理 | 0.20 | 红线 | 系统稳定性保障 |
| D7: 验收标准 | 0.10 | 质量 | 影响测试效率 |
| **总计** | **1.10** | - | - |

### 4.2 评分计算

```javascript
calculateScore(results) {
  const totalScore = results.reduce((sum, r) => {
    return sum + (r.passed ? r.weight : 0);
  }, 0);
  
  const maxScore = results.reduce((sum, r) => sum + r.weight, 0);
  
  return (totalScore / maxScore * 100).toFixed(2);
}
```

### 4.3 评分示例

**示例 1: 完美通过**
```
D1 ✅ (0.20) + D2 ✅ (0.15) + D3 ✅ (0.10) + 
D4 ✅ (0.20) + D5 ✅ (0.15) + D6 ✅ (0.20) + D7 ✅ (0.10)
= 1.10 / 1.10 = 100%
决策：pass
```

**示例 2: 红线项不满足**
```
D1 ❌ (0) + D2 ✅ (0.15) + D3 ✅ (0.10) + 
D4 ✅ (0.20) + D5 ✅ (0.15) + D6 ✅ (0.20) + D7 ✅ (0.10)
= 0.90 / 1.10 = 81.8%
决策：reject（D1 不满足）
```

**示例 3: 质量项不满足**
```
D1 ✅ (0.20) + D2 ✅ (0.15) + D3 ✅ (0.10) + 
D4 ✅ (0.20) + D5 ❌ (0) + D6 ✅ (0.20) + D7 ❌ (0)
= 0.85 / 1.10 = 77.3%
决策：conditional（D5/D7 不满足）
```

**示例 4: 加分项不满足**
```
D1 ✅ (0.20) + D2 ✅ (0.15) + D3 ❌ (0) + 
D4 ✅ (0.20) + D5 ✅ (0.15) + D6 ✅ (0.20) + D7 ✅ (0.10)
= 1.00 / 1.10 = 90.9%
决策：pass（记录建议）
```

---

## 五、总结

### 5.1 分类记忆

```
红线项（必须 100%）：D1 D2 D4 D6  →  不满足 → reject
质量项（建议满足）：D5 D7        →  不满足 → conditional
加分项（可选满足）：D3           →  不满足 → pass + 建议
```

### 5.2 决策速查表

| 场景 | 决策 | 说明 |
|------|------|------|
| D1/D2/D4/D6 任一不满足 | ❌ reject | 红线项，必须修复 |
| D5/D7 不满足 | ⚠️ conditional | 记录待修复项，进入下一阶段 |
| 只有 D3 不满足 | ✅ pass | 记录建议，不影响通过 |
| 全部通过 | ✅ pass | 完美通过 |

### 5.3 优先级排序

```
P0（必须修复）: D1 > D2 > D4 > D6
P1（建议修复）: D5 > D7
P2（可择机修复）: D3
```

---

*检查点分类说明 by openclaw-ouyp*  
**版本**: v1.0 | **日期**: 2026-04-02 | **状态**: 完成 ✅
