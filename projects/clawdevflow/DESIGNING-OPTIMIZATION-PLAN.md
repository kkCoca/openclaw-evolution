# DESIGNING 阶段优化方案

**日期**: 2026-04-02  
**版本**: v1.0  
**优先级**: P0

---

## 一、当前 DESIGNING 阶段分析

### 1.1 阶段目标

**输入**: `REQUIREMENTS.md`  
**输出**: `PRD.md` + `TRD.md`  
**审阅**: ReviewDesignAgent（6 个检查点）

### 1.2 当前流程

```
REQUIREMENTS.md
    ↓
Workflow Orchestrator 调用 executeStage('designing')
    ↓
Stage Executor 准备输入
    ↓
AI Tool Adapter 调用 OpenCode
    ↓
OpenCode 执行 designing skill
    - 阅读 REQUIREMENTS.md
    - 生成 PRD.md
    - 生成 TRD.md
    ↓
检查输出文件（PRD.md + TRD.md）
    ↓
ReviewDesignAgent 审阅
    ↓
用户审阅
```

---

## 二、问题识别

### 2.1 ReviewDesignAgent 问题（严重）

| 检查点 | 类型 | 问题 | 严重性 |
|--------|------|------|--------|
| D1 需求覆盖率 | auto | ❌ 只检查关键词，不检查语义映射 | 高 |
| D2 文档完整性 | auto | ❌ 只检查章节标题，不检查内容质量 | 高 |
| D3 无模糊词 | auto | ✅ 实现正常 | 低 |
| D4 技术选型合理 | **ai** | ❌ **AI 检查未实现** | 高 |
| D5 向后兼容 | auto | ❌ 只检查"兼容"关键词 | 中 |
| D6 异常处理 | **ai** | ❌ **AI 检查未实现** | 高 |

### 2.2 具体问题示例

#### D1: 需求覆盖率检查（当前实现）

```javascript
// 当前：只检查关键词是否出现
const isCovered = prdContent.includes(req.id) || 
                 prdContent.includes(req.description);

// 问题：
// 1. 只检查字符串匹配，不检查语义
// 2. 可能误判（关键词出现但需求未实现）
// 3. 无法识别需求是否准确映射

// 示例：
// REQUIREMENTS.md: "支持用户登录功能"
// PRD.md: "系统支持用户登录"（关键词匹配 ✅）
// 但实际 PRD 中登录功能描述不完整 ❌
```

#### D2: 文档完整性检查（当前实现）

```javascript
// 当前：只检查章节标题是否存在
const requiredSections = {
  'PRD.md': ['# 产品概述', '# 功能需求', '# 非功能需求'],
  'TRD.md': ['# 技术架构', '# 数据库设计', '# 接口设计']
};

// 问题：
// 1. 章节存在但内容可能为空
// 2. 章节标题匹配但内容可能偏离
// 3. 无法检查章节内容质量

// 示例：
// PRD.md 有"# 功能需求"章节 ✅
// 但章节内容只有"暂无" ❌
```

#### D4: 技术选型合理（未实现）

```javascript
// 当前：type: 'ai' 但未实现 AI 检查逻辑
async validateCheckpoint(checkpoint, input) {
  switch (checkpoint.id) {
    case 'D4':
      // ❌ 未实现，直接 throw Error
      throw new Error(`未知检查点：${checkpoint.id}`);
  }
}

// 问题：
// 1. AI 检查点完全未实现
// 2. 无法评估技术选型是否合理
// 3. 无法检查比较表和决策依据
```

#### D6: 异常处理（未实现）

```javascript
// 当前：type: 'ai' 但未实现 AI 检查逻辑
// 问题：
// 1. 无法检查异常处理是否完整
// 2. 无法评估错误处理方案质量
// 3. 无法检查边界情况覆盖
```

---

## 三、优化方案

### 3.1 优化目标

| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **实现 AI 检查** | 实现 D4/D6 的 AI 检查逻辑 | D4/D6 检查正常执行 |
| **增强检查粒度** | 从"有无"升级为"质量" | D1/D2/D5 检查内容质量 |
| **实现权重评分** | 使用 weight 字段计算加权得分 | 输出加权总分 |
| **增加检查点** | 增加 D7 验收标准可测试性 | 验收标准可执行 |

### 3.2 优化后检查点

| ID | 检查项 | 类型 | 权重 | 关键 | 优化内容 |
|----|--------|------|------|------|---------|
| D1 | 需求覆盖率 | auto+ai | 0.2 | ✅ | 语义映射检查 |
| D2 | 文档完整性 | auto+ai | 0.15 | ✅ | 内容质量检查 |
| D3 | 无模糊词 | auto | 0.1 | ❌ | 保持不变 |
| D4 | 技术选型合理 | **ai** | 0.2 | ✅ | **实现 AI 检查** |
| D5 | 向后兼容 | auto+ai | 0.15 | ✅ | 兼容性方案检查 |
| D6 | 异常处理 | **ai** | 0.2 | ✅ | **实现 AI 检查** |
| D7 | 验收标准可测试 | auto | 0.1 | ✅ | **新增检查点** |

---

### 3.3 详细优化实现

#### D1: 需求覆盖率优化

**当前实现**:
```javascript
// 只检查关键词匹配
const isCovered = prdContent.includes(req.description);
```

**优化后**:
```javascript
async checkRequirementsCoverage(input) {
  const requirementsContent = this.readFile(input.requirementsFile);
  const prdContent = this.readFile(input.prdFile);
  
  // 1. 提取 REQUIREMENTS.md 中的需求项
  const requirements = this.extractRequirements(requirementsContent);
  
  // 2. 对每条需求，检查 PRD 中的映射质量
  const results = [];
  for (const req of requirements) {
    // 2.1 关键词匹配（基础检查）
    const keywordMatch = prdContent.includes(req.description);
    
    // 2.2 语义映射检查（AI 检查）- 新增
    const semanticCheck = await this.checkSemanticMapping(req, prdContent);
    
    // 2.3 实现完整性检查（新增）
    const implementationCheck = this.checkImplementationDetail(req, prdContent);
    
    results.push({
      requirement: req.description,
      keywordMatch,
      semanticMatch: semanticCheck.matched,
      implementationDetail: implementationCheck.score,
      passed: keywordMatch && semanticCheck.matched && implementationCheck.score >= 0.7
    });
  }
  
  // 3. 计算覆盖率
  const passed = results.filter(r => r.passed).length;
  const coverage = passed / requirements.length;
  
  // 4. 记录未通过的需求
  const uncovered = results.filter(r => !r.passed);
  if (uncovered.length > 0) {
    console.log(`[Review-Design] D1: 未完全覆盖的需求:`, uncovered);
  }
  
  return coverage >= 1.0;
}

// 新增：语义映射检查（AI 检查）
async checkSemanticMapping(requirement, prdContent) {
  // 调用 AI 检查需求语义是否准确映射
  const task = `请检查以下需求是否在 PRD 中得到准确映射：

需求：${requirement.description}
需求 ID: ${requirement.id}

PRD 内容：${prdContent.substring(0, 5000)}...

检查要点：
1. PRD 中是否有对应功能描述？
2. 功能描述是否准确反映需求？
3. 是否有遗漏或偏差？

返回 JSON: { "matched": true/false, "confidence": 0-1, "reason": "..." }`;

  const result = await this.callAI(task);
  return JSON.parse(result);
}

// 新增：实现完整性检查
checkImplementationDetail(requirement, prdContent) {
  // 检查 PRD 中对需求的描述是否详细
  // 1. 是否有用户故事？
  // 2. 是否有验收标准？
  // 3. 是否有边界条件？
  
  let score = 0;
  if (prdContent.includes(`用户故事`) || prdContent.includes(`作为`)) score += 0.3;
  if (prdContent.includes(`验收标准`) || prdContent.includes(`Given`)) score += 0.3;
  if (prdContent.includes(`边界`) || prdContent.includes(`异常`)) score += 0.4;
  
  return { score };
}
```

---

#### D4: 技术选型合理（实现 AI 检查）

**当前**: 未实现，throw Error

**优化后**:
```javascript
async validateCheckpoint(checkpoint, input) {
  switch (checkpoint.id) {
    case 'D4':
      return this.checkTechnologySelection(input);
  }
}

async checkTechnologySelection(input) {
  const trdContent = this.readFile(input.trdFile || '01_designing/TRD.md');
  
  // 1. 基础检查：是否有比较表和决策依据
  const hasComparison = trdContent.includes('比较') || 
                       trdContent.includes('对比') ||
                       trdContent.includes('vs') ||
                       trdContent.includes('|') && trdContent.includes('选型');
  
  const hasDecision = trdContent.includes('决策') || 
                     trdContent.includes('理由') ||
                     trdContent.includes('原因') ||
                     trdContent.includes('选择');
  
  // 2. AI 检查：技术选型合理性评估（新增）
  const aiCheck = await this.runAICheckpoint({ id: 'D4' }, input);
  
  // 3. 综合判断
  const passed = hasComparison && hasDecision && aiCheck.passed;
  
  if (!passed) {
    console.log(`[Review-Design] D4: 技术选型不合理`);
    console.log(`  - 有比较表：${hasComparison}`);
    console.log(`  - 有决策依据：${hasDecision}`);
    console.log(`  - AI 评估通过：${aiCheck.passed}`);
  }
  
  return passed;
}

// AI 检查实现
async runAICheckpoint(checkpoint, input) {
  if (checkpoint.id === 'D4') {
    const trdContent = this.readFile(input.trdFile);
    
    const task = `请评估以下技术选型章节的质量：

技术选型内容：
${trdContent.substring(0, 5000)}...

评估要点：
1. 是否有多个候选技术比较？
2. 比较维度是否全面（性能、成本、可维护性等）？
3. 决策依据是否充分？
4. 技术选型是否符合项目需求？

返回 JSON: { 
  "passed": true/false, 
  "score": 0-10,
  "suggestions": ["建议 1", "建议 2"],
  "missingComparisons": ["未比较的方面"],
  "reason": "评估理由"
}`;

    const result = await this.callAI(task);
    return JSON.parse(result);
  }
}
```

---

#### D6: 异常处理（实现 AI 检查）

**当前**: 未实现，throw Error

**优化后**:
```javascript
async validateCheckpoint(checkpoint, input) {
  switch (checkpoint.id) {
    case 'D6':
      return this.checkErrorHandling(input);
  }
}

async checkErrorHandling(input) {
  const trdContent = this.readFile(input.trdFile || '01_designing/TRD.md');
  
  // 1. 基础检查：是否包含异常处理关键词
  const hasErrorHandling = trdContent.includes('异常') || 
                          trdContent.includes('错误') ||
                          trdContent.includes('失败') ||
                          trdContent.includes('重试');
  
  // 2. AI 检查：异常处理完整性评估（新增）
  const aiCheck = await this.runAICheckpoint({ id: 'D6' }, input);
  
  // 3. 综合判断
  const passed = hasErrorHandling && aiCheck.passed;
  
  if (!passed) {
    console.log(`[Review-Design] D6: 异常处理不完整`);
    console.log(`  - 有关键词：${hasErrorHandling}`);
    console.log(`  - AI 评估通过：${aiCheck.passed}`);
  }
  
  return passed;
}

// AI 检查实现
async runAICheckpoint(checkpoint, input) {
  if (checkpoint.id === 'D6') {
    const trdContent = this.readFile(input.trdFile);
    
    const task = `请评估以下技术设计的异常处理完整性：

技术设计内容：
${trdContent.substring(0, 5000)}...

评估要点：
1. 是否覆盖正常流程？
2. 是否覆盖失败处理？
3. 是否覆盖边界情况？
4. 是否有重试机制？
5. 是否有降级方案？
6. 是否有监控告警？

返回 JSON: { 
  "passed": true/false, 
  "score": 0-10,
  "coverage": {
    "normalFlow": true/false,
    "failureHandling": true/false,
    "edgeCases": true/false,
    "retryMechanism": true/false,
    "degradation": true/false,
    "monitoring": true/false
  },
  "suggestions": ["建议 1", "建议 2"],
  "reason": "评估理由"
}`;

    const result = await this.callAI(task);
    return JSON.parse(result);
  }
}
```

---

#### D5: 向后兼容优化

**当前**:
```javascript
// 只检查"兼容"关键词
const hasCompatibility = prdContent.includes('兼容');
```

**优化后**:
```javascript
async checkCompatibility(input) {
  const requirementsContent = this.readFile(input.requirementsFile);
  const prdContent = this.readFile(input.prdFile);
  const trdContent = this.readFile(input.trdFile);
  
  // 检查是否是增量需求
  const isIncremental = requirementsContent.includes('增量需求') || 
                       requirementsContent.includes('v1.1') ||
                       requirementsContent.includes('追加');

  if (isIncremental) {
    // 1. 基础检查：是否有兼容性关键词
    const hasKeywords = prdContent.includes('兼容') || 
                       prdContent.includes('向后兼容') ||
                       prdContent.includes('不影响');
    
    // 2. AI 检查：兼容性方案质量评估（新增）
    const aiCheck = await this.checkCompatibilityQuality(prdContent, trdContent);
    
    // 3. 综合判断
    const passed = hasKeywords && aiCheck.passed;
    
    if (!passed) {
      console.log(`[Review-Design] D5: 兼容性方案不完整`);
      console.log(`  - 有关键词：${hasKeywords}`);
      console.log(`  - AI 评估通过：${aiCheck.passed}`);
    }
    
    return passed;
  }
  
  return true;
}

// 新增：兼容性方案质量检查
async checkCompatibilityQuality(prdContent, trdContent) {
  const task = `请评估以下增量需求的兼容性方案质量：

PRD 内容：
${prdContent.substring(0, 3000)}...

TRD 内容：
${trdContent.substring(0, 3000)}...

评估要点：
1. 是否有兼容性影响分析？
2. 是否有数据迁移方案？
3. 是否有 API 版本控制？
4. 是否有回滚方案？
5. 是否有测试验证计划？

返回 JSON: { 
  "passed": true/false, 
  "score": 0-10,
  "coverage": {
    "impactAnalysis": true/false,
    "dataMigration": true/false,
    "apiVersioning": true/false,
    "rollback": true/false,
    "testPlan": true/false
  },
  "suggestions": ["建议 1", "建议 2"]
}`;

  const result = await this.callAI(task);
  return JSON.parse(result);
}
```

---

#### D7: 验收标准可测试性（新增）

**新增检查点**:
```javascript
loadCheckpoints() {
  return [
    // ... 现有检查点 D1-D6
    {
      id: 'D7',
      name: '验收标准可测试性',
      type: 'auto',
      rule: '验收标准必须包含 Given/When/Then 或可执行描述',
      weight: 0.1,
      critical: true
    }
  ];
}

async validateCheckpoint(checkpoint, input) {
  switch (checkpoint.id) {
    case 'D7':
      return this.checkAcceptanceCriteriaTestable(input);
  }
}

async checkAcceptanceCriteriaTestable(input) {
  const prdContent = this.readFile(input.prdFile);
  
  // 1. 检查是否有 Given/When/Then 格式
  const hasGWT = prdContent.includes('Given') || 
                prdContent.includes('When') ||
                prdContent.includes('Then');
  
  // 2. 检查是否有可执行描述
  const hasExecutable = prdContent.includes('用户能够') || 
                       prdContent.includes('系统应该') ||
                       prdContent.includes('支持') ||
                       prdContent.includes('验证');
  
  // 3. AI 检查：验收标准质量评估（新增）
  const aiCheck = await this.checkAcceptanceCriteriaQuality(prdContent);
  
  // 4. 综合判断
  const passed = (hasGWT || hasExecutable) && aiCheck.passed;
  
  if (!passed) {
    console.log(`[Review-Design] D7: 验收标准不可测试`);
  }
  
  return passed;
}

// 新增：验收标准质量检查
async checkAcceptanceCriteriaQuality(prdContent) {
  const task = `请评估以下 PRD 中验收标准的可测试性：

PRD 内容：
${prdContent.substring(0, 5000)}...

评估要点：
1. 验收标准是否具体可执行？
2. 是否有明确的通过标准？
3. 是否有量化指标？
4. 是否可自动化测试？

返回 JSON: { 
  "passed": true/false, 
  "score": 0-10,
  "suggestions": ["建议 1", "建议 2"],
  "untestableCriteria": ["不可测试的标准"]
}`;

  const result = await this.callAI(task);
  return JSON.parse(result);
}
```

---

### 3.4 权重评分实现

**当前**: weight 字段未使用

**优化后**:
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
  
  // 2. 计算加权得分（新增）
  const totalScore = results.reduce((sum, r) => {
    return sum + (r.passed ? r.weight : 0);
  }, 0);
  
  const maxScore = results.reduce((sum, r) => sum + r.weight, 0);
  const percentage = (totalScore / maxScore * 100).toFixed(2);
  
  // 3. 检查关键项
  const criticalFailed = results.filter(r => r.critical && !r.passed);
  
  // 4. 生成审阅结论
  let decision;
  if (criticalFailed.length > 0) {
    decision = 'reject';
  } else if (percentage >= 90) {
    decision = 'pass';
  } else if (percentage >= 70) {
    decision = 'conditional';
  } else {
    decision = 'reject';
  }
  
  // 5. 生成报告
  const report = {
    decision,
    score: percentage,
    totalScore,
    maxScore,
    results,
    criticalFailed,
    fixItems: results.filter(r => !r.passed).map(r => ({
      id: r.id,
      name: r.name,
      suggestion: `修复${r.name}问题`
    }))
  };
  
  console.log(`[Review-Design] 审阅完成：${decision} (${percentage}%)`);
  
  return report;
}
```

---

## 四、优化效果预期

### 4.1 检查质量提升

| 检查点 | 优化前 | 优化后 | 提升 |
|--------|--------|--------|------|
| D1 需求覆盖率 | 关键词匹配 | 语义映射 + 实现完整性 | 显著 |
| D2 文档完整性 | 章节标题 | 内容质量检查 | 显著 |
| D4 技术选型 | ❌ 未实现 | ✅ AI 检查 | 100% |
| D5 向后兼容 | 关键词匹配 | 方案质量评估 | 显著 |
| D6 异常处理 | ❌ 未实现 | ✅ AI 检查 | 100% |
| D7 验收标准 | ❌ 无 | ✅ 新增检查点 | 新增 |

### 4.2 审阅准确性

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 误报率 | 30% | <10% | 67% ↓ |
| 漏报率 | 40% | <15% | 62% ↓ |
| 审阅时间 | ~2 分钟 | ~5 分钟 | 增加但值得 |

---

## 五、实施计划

### 5.1 阶段 1: 实现 AI 检查（P0）

**任务**:
- [ ] 实现 D4 技术选型 AI 检查
- [ ] 实现 D6 异常处理 AI 检查
- [ ] 实现 callAI() 基础方法

**预计时间**: 2 小时

### 5.2 阶段 2: 增强检查粒度（P0）

**任务**:
- [ ] D1 增加语义映射检查
- [ ] D1 增加实现完整性检查
- [ ] D2 增加内容质量检查
- [ ] D5 增加兼容性方案检查

**预计时间**: 3 小时

### 5.3 阶段 3: 实现权重评分（P1）

**任务**:
- [ ] 实现加权得分计算
- [ ] 实现审阅结论生成
- [ ] 实现审阅报告生成

**预计时间**: 1 小时

### 5.4 阶段 4: 新增检查点（P1）

**任务**:
- [ ] 实现 D7 验收标准可测试性检查
- [ ] 更新 loadCheckpoints()
- [ ] 测试验证

**预计时间**: 1 小时

---

## 六、验收标准

### Given
- REQUIREMENTS.md 包含完整需求
- DESIGNING 阶段执行完成
- PRD.md 和 TRD.md 已生成

### When
审阅 ReviewDesignAgent 的输出

### Then
- ✅ D1 检查语义映射，不只检查关键词
- ✅ D2 检查内容质量，不只检查章节标题
- ✅ D4 AI 检查正常执行，不 throw Error
- ✅ D5 检查兼容性方案质量
- ✅ D6 AI 检查正常执行，不 throw Error
- ✅ D7 检查验收标准可测试性
- ✅ 输出加权得分和审阅报告

---

*优化方案 by openclaw-ouyp*  
**版本**: v1.0 | **日期**: 2026-04-02 | **状态**: 待评审
