# 详细设计文档（DETAIL）- ClawDevFlow v3.1.6

> **版本**: v3.1.6  
> **日期**: 2026-04-02  
> **状态**: 审查通过 ✅

---

## 文档元数据

| 字段 | 值 |
|------|-----|
| **DETAIL 版本** | v3.1.6 |
| **DETAIL 哈希** | `sha256:待计算` |
| **对齐 REQUIREMENTS 版本** | v3.1.6 |
| **对齐 REQUIREMENTS 哈希** | `sha256:f0e44912d5778703c30ce7921ceb25a81a454672` |
| **对齐 PRD 版本** | v3.1.6 |
| **对齐 PRD 哈希** | `sha256:待计算` |
| **对齐 TRD 版本** | v3.1.6 |
| **对齐 TRD 哈希** | `sha256:待计算` |
| **需求追溯矩阵** | 完整 |
| **覆盖率** | 100% |

---

## 1. 设计概述

### 1.1 设计目标

本详细设计文档针对 REQ-012（ROADMAPPING 环节优化 v3.1.6）提供文件级详细设计，包含：
1. **R4 规则优化实现** - 检测关键词 → 检查缓解措施 → 判定结果
2. **SELF-REVIEW.md 生成逻辑优化** - Critical 失败时生成，通过时不生成
3. **12 项检查清单实现** - R0-R4 + 1-5, 7-8

### 1.2 设计范围

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `bundled-skills/roadmapping/SKILL.md` | 编辑 | 更新 R4 规则和 SELF-REVIEW.md 生成逻辑 |
| `adapters/opencode.js` | 编辑 | 更新 roadmapping 任务描述 |
| `02_roadmapping/ROADMAP.md` | 生成 | v3.1.6 版本（验证输出） |

### 1.3 约束条件

- **不生成额外文件** - 仅修改 SKILL.md 和 opencode.js
- **保持与现有流程一致** - 遵循 clawdevflow 完整流程
- **向后兼容** - 不影响现有功能

---

## 2. 需求追溯矩阵

| 需求 ID | REQUIREMENTS.md 章节 | PRD 章节 | TRD 章节 | DETAIL 章节 | DETAIL 行号 | 实现状态 |
|---------|---------------------|---------|---------|------------|-----------|---------|
| REQ-001 | L13-43 | 2.2 | 1.1-1.2 | 3.1 | 50-70 | ✅ 已映射 |
| REQ-002 | L46-76 | 3.1-3.2 | 2.1-2.2 | 3.2 | 75-95 | ✅ 已映射 |
| REQ-003 | L79-152 | 7.1-7.5 | 7.1-7.7 | 3.3 | 100-150 | ✅ 已映射 |
| REQ-004 | L155-182 | 9.1-9.6 | 9.1-9.4 | 3.4 | 155-180 | ✅ 已映射 |
| REQ-005 | L185-268 | 12.1-12.7 | 8.1-8.4 | 3.5 | 185-220 | ✅ 已映射 |
| REQ-006 | L271-375 | 10.1-10.5 | 10.1-10.6 | 3.6 | 225-270 | ✅ 已映射 |
| REQ-007 | L378-420 | 13.1-13.5 | 10.2.1-10.2.6 | 3.7 | 275-320 | ✅ 已映射 |
| REQ-008 | L423-470 | 13.6 | 10.2.1-10.2.6 | 3.8 | 325-350 | ✅ 已映射 |
| REQ-009 | L473-530 | 14.1-14.6 | 11.1-11.7 | 3.9 | 355-400 | ✅ 已映射 |
| REQ-010 | L580-630 | 15.1-15.6 | 12.1-12.7 | 3.10 | 405-450 | ✅ 已映射 |
| REQ-011 | L630-700 | 16.1-16.7 | 13.1-13.5 | 3.11 | 455-500 | ✅ 已映射 |
| REQ-012 | L700-770 | 17.1-17.7 | 14.1-14.6 | **4-7** | **505-700** | ✅ 已映射 |

### 2.1 覆盖率统计

- **需求总数**: 12
- **已映射需求**: 12
- **覆盖率**: 100%
- **未映射需求**: 无

---

## 3. 架构设计（继承 v3.1.5）

### 3.1 12 项检查清单架构

```
┌─────────────────────────────────────────────────────────────┐
│              自审阅 Agent（12 项检查）                        │
├─────────────────────────────────────────────────────────────┤
│  Critical 项（一票否决）：                                   │
│  ├─ R0: Freshness 对齐检查                                   │
│  ├─ R1: Traceability 需求引用                                │
│  ├─ R2: MVP 可交付性                                         │
│  └─ R3: 依赖与风险                                           │
├─────────────────────────────────────────────────────────────┤
│  Non-Critical 项（允许条件通过）：                            │
│  ├─ R4: 范围膨胀风险（v3.1.6 优化）                           │
│  ├─ 1: 任务拆分                                              │
│  ├─ 2: 工作量评估                                            │
│  ├─ 3: 收尾项                                                │
│  ├─ 4: 任务命名                                              │
│  ├─ 5: 描述规范                                              │
│  ├─ 7: 技术对齐                                              │
│  └─ 8: 代码现状（增量）                                      │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 评分决策流程

```
生成 ROADMAP.md 初稿
        ↓
执行 12 项检查
        ↓
检查 Critical 项（R0-R3）
        ↓
    ┌───┴───┐
    ↓       ↓
  全部通过  任一失败
    ↓       ↓
检查     驳回重做
Non-Critical  (最多 3 次)
    ↓
┌───┴───┐
↓       ↓
全部   有失败
通过    ↓
    ↓   修正后输出
直接输出  (conditional)
        ↓
    检查 SELF-REVIEW.md 生成条件
        ↓
    ┌───┴───┐
    ↓       ↓
Critical 失败  Critical 通过
    ↓       ↓
生成     不生成
```

---

## 4. R4 规则优化详细设计（REQ-012 核心）

### 4.1 问题描述

**v3.1.5 问题**：
- 检测到"可选/未来"关键词即判定为 warning
- 未考虑已有缓解措施的场景
- 导致误报（如"可选功能：XXX（Phase 2 实现）"已标注缓解措施）

**v3.1.6 优化目标**：
- 检测到关键词时，检查是否有缓解措施
- 有缓解措施 → 通过（不误报）
- 无缓解措施 → warning（真实风险）

### 4.2 算法设计

#### 4.2.1 关键词检测

**范围膨胀关键词**：
```javascript
const scopeCreepKeywords = [
  // 中文
  '可能', '或许', '大概', '也许',
  '可选', ' optionally',
  '未来', '将来', '后续', '以后',
  // 英文
  'maybe', 'perhaps', 'possibly',
  'optional', 'future', 'later'
];
```

**缓解措施关键词**：
```javascript
const mitigationKeywords = [
  // 缓解措施
  '缓解', '应对', '措施', '方案',
  '规避', '减轻', '缓解措施',
  // 明确标注
  'MVP 不包含', 'Phase 2', 'Phase 3',
  '后续版本', 'V2', 'V3', 'V4',
  '已标注', '已规划', '已计划',
  '不在此范围', '超出范围',
  // 英文
  'mitigation', 'workaround',
  'phase 2', 'phase 3', 'future version',
  'not in scope', 'out of scope',
  'planned', 'scheduled'
];
```

#### 4.2.2 检查逻辑

```javascript
/**
 * R4: 范围膨胀风险检查（v3.1.6 优化版）
 * 
 * @param {string} roadmapContent - ROADMAP.md 内容
 * @returns {object} 检查结果
 */
function checkScopeCreep(roadmapContent) {
  const lines = roadmapContent.split('\n');
  const warnings = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();
    
    // 步骤 1: 检测范围膨胀关键词
    const hasScopeCreep = scopeCreepKeywords.some(kw => 
      lineLower.includes(kw.toLowerCase())
    );
    
    if (hasScopeCreep) {
      // 步骤 2: 检查缓解措施（前后 3 行上下文）
      const contextStart = Math.max(0, i - 3);
      const contextEnd = Math.min(lines.length, i + 4); // +4 因为 slice 不包含结束索引
      const context = lines.slice(contextStart, contextEnd).join(' ');
      const contextLower = context.toLowerCase();
      
      const hasMitigation = mitigationKeywords.some(kw => 
        contextLower.includes(kw.toLowerCase())
      );
      
      // 步骤 3: 判定结果
      if (!hasMitigation) {
        // 无缓解措施 → warning（真实风险）
        warnings.push({
          line: i + 1,
          content: line.trim(),
          reason: '检测到范围膨胀关键词，无缓解措施',
          suggestion: '建议添加缓解措施或明确标注为后续版本'
        });
      }
      // 有缓解措施 → 通过，不记录 warning
    }
  }
  
  return {
    rule: 'R4',
    name: '范围膨胀风险',
    critical: false,  // non-critical 项
    pass: true,  // non-critical 项始终 pass
    warning: warnings.length > 0,
    warnings: warnings,
    details: {
      totalLines: lines.length,
      warningsCount: warnings.length
    }
  };
}
```

#### 4.2.3 示例场景

**场景 1: 误报场景（已有缓解措施）→ 通过**
```markdown
可选功能：用户头像上传（后续版本实现）
缓解措施：MVP 版本不包含此功能，已标注为 Phase 2
```
- 检测到"可选"、"后续版本"
- 检测到"缓解措施"、"MVP 版本不包含"、"Phase 2"
- **判定**: 通过 ✅（不误报）

**场景 2: 真实风险场景（无缓解措施）→ warning**
```markdown
可能需要在未来考虑性能优化
```
- 检测到"可能"、"未来"
- 未检测到缓解措施
- **判定**: warning ⚠️（真实风险）

**场景 3: 正常场景（无关键词）→ 通过**
```markdown
第一阶段实现用户登录功能
```
- 未检测到范围膨胀关键词
- **判定**: 通过 ✅

### 4.3 数据结构

#### 4.3.1 R4 检查结果对象

```javascript
{
  rule: 'R4',
  name: '范围膨胀风险',
  critical: false,
  pass: true,
  warning: true,  // 有未缓解的关键词时为 true
  warnings: [
    {
      line: 45,
      content: '可能需要在未来考虑性能优化',
      reason: '检测到范围膨胀关键词，无缓解措施',
      suggestion: '建议添加缓解措施或明确标注为后续版本'
    }
  ],
  details: {
    totalLines: 120,
    warningsCount: 1
  }
}
```

#### 4.3.2 评分影响

```javascript
// R4 是 non-critical 项，不影响通过/失败决策
// 仅影响最终评分（扣分项）

function calculateScore(reviewResults) {
  const criticalItems = ['R0', 'R1', 'R2', 'R3'];
  const nonCriticalItems = ['R4', '1', '2', '3', '4', '5', '7', '8'];
  
  // 检查 critical 项（一票否决）
  const criticalFailed = criticalItems.filter(item => !reviewResults[item].pass);
  
  if (criticalFailed.length > 0) {
    return { score: 0, decision: 'reject', reason: 'critical 项失败' };
  }
  
  // 检查 non-critical 项
  const nonCriticalFailed = nonCriticalItems.filter(item => !reviewResults[item].pass);
  const nonCriticalWarnings = nonCriticalItems.filter(item => 
    reviewResults[item].warning === true
  );
  
  // 计算评分（失败扣 0.5 分，warning 扣 0.25 分）
  const score = 10 - (nonCriticalFailed.length * 0.5) - (nonCriticalWarnings.length * 0.25);
  
  if (nonCriticalFailed.length === 0 && nonCriticalWarnings.length === 0) {
    return { score: 10, decision: 'pass' };
  } else if (score >= 8) {
    return { score: Math.max(score, 8), decision: 'conditional' };
  } else {
    return { score: score, decision: 'reject' };
  }
}
```

---

## 5. SELF-REVIEW.md 生成逻辑优化详细设计（REQ-012 核心）

### 5.1 问题描述

**v3.1.5 问题**：
- 无论检查结果如何，都生成 SELF-REVIEW.md
- 增加额外文件，不符合"不生成额外文件"原则
- 文件冗余，增加管理成本

**v3.1.6 优化目标**：
- Critical 项全部通过 → 不生成 SELF-REVIEW.md
- Critical 项任一失败 → 生成 SELF-REVIEW.md（记录失败原因用于调试）
- 简化输出，符合原则

### 5.2 生成决策逻辑

#### 5.2.1 决策流程

```javascript
/**
 * SELF-REVIEW.md 生成决策（v3.1.6 优化版）
 * 
 * @param {object} reviewResults - 审阅结果对象
 * @returns {object} 生成决策
 */
function shouldGenerateSelfReview(reviewResults) {
  const criticalItems = ['R0', 'R1', 'R2', 'R3'];
  const criticalFailed = criticalItems.filter(item => !reviewResults[item].pass);
  
  const shouldGenerate = criticalFailed.length > 0;
  
  return {
    shouldGenerate: shouldGenerate,
    reason: shouldGenerate 
      ? `Critical 项失败：${criticalFailed.join(', ')}`
      : '所有 Critical 项通过',
    criticalFailed: criticalFailed,
    reviewResults: reviewResults
  };
}
```

#### 5.2.2 决策矩阵

| 场景 | Critical 项（R0-R3） | Non-Critical 项（R4 + 1-5, 7-8） | 生成 SELF-REVIEW.md | 说明 |
|------|---------------------|---------------------------------|---------------------|------|
| 全部通过 | ✅ 全部通过 | ✅ 全部通过 | ❌ 不生成 | 理想场景 |
| 小问题 | ✅ 全部通过 | ⚠️ 1-2 项失败/warning | ❌ 不生成 | 修正后直接输出 |
| Critical 失败 | ❌ 任一失败 | - | ✅ 生成 | 记录失败原因用于调试 |

### 5.3 文件内容设计（仅 Critical 失败时生成）

#### 5.3.1 文件结构

```markdown
# 自审阅报告 - {项目名称}

## 审阅元数据
- **审阅时间**: {ISO 时间戳}
- **审阅对象**: ROADMAP.md
- **审阅版本**: v3.1.6
- **工作流 ID**: {workflowId}

## Critical 项失败原因

| 规则 | 检查点 | 失败原因 | 修正建议 |
|------|--------|---------|---------|
| R0 | Freshness | 缺少 alignedTo 字段 | 添加 alignedTo: v3.1.6 |
| R1 | Traceability | 需求覆盖率 83%（缺少 REQ-012） | 在任务描述中引用 REQ-012 |
| ... | ... | ... | ... |

## Non-Critical 项警告（如有）

| 规则 | 检查点 | 警告内容 | 建议 |
|------|--------|---------|------|
| R4 | 范围膨胀风险 | 第 45 行检测到"可能"关键词 | 添加缓解措施 |

## 修正建议

1. **优先级 1（Critical）**:
   - 添加 alignedTo 字段到文档元数据
   - 在任务描述中显式引用所有需求 ID
   
2. **优先级 2（Non-Critical）**:
   - 为范围膨胀关键词添加缓解措施

## 审阅结论

- **Critical 项**: {X}/4 通过
- **Non-Critical 项**: {Y}/8 通过
- **总分**: {score}/10
- **决策**: ❌ 驳回（需修正后重新审阅）

---
*此报告由 Roadmap Self-Review Agent 自动生成*
*生成时间：{timestamp}*
```

#### 5.3.2 生成函数

```javascript
/**
 * 生成 SELF-REVIEW.md（仅 Critical 失败时调用）
 * 
 * @param {string} projectPath - 项目路径
 * @param {object} reviewResults - 审阅结果
 * @param {object} decision - 审阅决策
 */
async function generateSelfReview(projectPath, reviewResults, decision) {
  const criticalItems = ['R0', 'R1', 'R2', 'R3'];
  const criticalFailed = criticalItems.filter(item => !reviewResults[item].pass);
  
  // 只在 Critical 项失败时生成
  if (criticalFailed.length === 0) {
    return;  // 不生成
  }
  
  const selfReviewContent = buildSelfReviewContent(reviewResults, decision);
  const selfReviewPath = path.join(projectPath, '02_roadmapping', 'SELF-REVIEW.md');
  
  await fs.writeFile(selfReviewPath, selfReviewContent, 'utf8');
  
  console.log(`SELF-REVIEW.md 已生成：${selfReviewPath}`);
}
```

### 5.4 数据结构

#### 5.4.1 生成决策对象

```javascript
{
  shouldGenerate: false,  // Critical 全部通过 → false
  reason: '所有 Critical 项通过',
  criticalFailed: [],
  reviewResults: {
    R0: { pass: true, ... },
    R1: { pass: true, ... },
    R2: { pass: true, ... },
    R3: { pass: true, ... },
    R4: { pass: true, warning: false, ... },
    // ...
  }
}
```

#### 5.4.2 文件输出决策

```javascript
// roadmapping 阶段输出
const output = {
  roadmapFile: '02_roadmapping/ROADMAP.md',  // 始终生成
  selfReviewFile: '02_roadmapping/SELF-REVIEW.md'  // 条件生成
};

// 写入文件
await fs.writeFile(output.roadmapFile, roadmapContent, 'utf8');

if (decision.shouldGenerate) {
  await fs.writeFile(output.selfReviewFile, selfReviewContent, 'utf8');
} else {
  console.log('SELF-REVIEW.md 不生成（Critical 全部通过）');
}
```

---

## 6. 12 项检查清单实现详细设计

### 6.1 Critical 项（R0-R3）

#### 6.1.1 R0: Freshness 对齐检查

**检查逻辑**：
```javascript
function checkFreshness(roadmapContent, requirementsVersion, requirementsHash) {
  // 检查 alignedTo 字段
  const alignedToMatch = roadmapContent.match(/alignedTo:\s*(v\d+\.\d+\.\d+)/);
  const hasAlignedTo = alignedToMatch !== null;
  const alignedToVersion = hasAlignedTo ? alignedToMatch[1] : null;
  
  // 检查 requirementsHash 字段
  const hashMatch = roadmapContent.match(/requirementsHash:\s*(sha256:[a-f0-9]{64})/);
  const hasHash = hashMatch !== null;
  const actualHash = hasHash ? hashMatch[1] : null;
  
  // 验证对齐
  const versionAligned = hasAlignedTo && alignedToVersion === requirementsVersion;
  const hashAligned = hasHash && actualHash === requirementsHash;
  
  return {
    rule: 'R0',
    name: 'Freshness 对齐',
    critical: true,
    pass: versionAligned && hashAligned,
    details: {
      alignedTo: {
        expected: requirementsVersion,
        actual: alignedToVersion,
        aligned: versionAligned
      },
      requirementsHash: {
        expected: requirementsHash,
        actual: actualHash,
        aligned: hashAligned
      }
    }
  };
}
```

**验收标准**：
- ✅ ROADMAP.md 包含 `alignedTo: v3.1.6`
- ✅ ROADMAP.md 包含 `requirementsHash: sha256:f0e44912d5778703c30ce7921ceb25a81a454672`
- ✅ 两者必须同时存在且匹配

#### 6.1.2 R1: Traceability 需求引用检查

**检查逻辑**：
```javascript
function checkTraceability(roadmapContent, requirementsContent) {
  // 提取 REQUIREMENTS.md 中的所有需求 ID
  const reqIdRegex = /REQ-\d+/g;
  const requiredIds = [...new Set(requirementsContent.match(reqIdRegex) || [])];
  
  // 检查 ROADMAP.md 中是否引用了每个需求 ID
  const missingRefs = requiredIds.filter(id => !roadmapContent.includes(id));
  const coverage = ((requiredIds.length - missingRefs.length) / requiredIds.length * 100).toFixed(1);
  
  return {
    rule: 'R1',
    name: 'Traceability（需求引用）',
    critical: true,
    pass: missingRefs.length === 0,
    coverage: `${coverage}%`,
    requiredCount: requiredIds.length,
    foundCount: requiredIds.length - missingRefs.length,
    missing: missingRefs,
    details: {
      requiredIds: requiredIds,
      missingRefs: missingRefs
    }
  };
}
```

**验收标准**：
- ✅ 需求覆盖率 100%
- ✅ 所有 REQ-XXX 在 ROADMAP.md 中有显式引用

#### 6.1.3 R2: MVP 可交付性检查

**检查逻辑**：
```javascript
function checkDeliverability(roadmapContent) {
  // 检查 MVP/Phase 1/里程碑 1 段落
  const hasMVP = /MVP|Phase\s*1|里程碑\s*1/i.test(roadmapContent);
  
  // 检查 scope/验收/工作量
  const hasScope = /scope|范围 | 包含 | 不在此范围/i.test(roadmapContent);
  const hasAcceptance = /验收 |acceptance|Given|When|Then/i.test(roadmapContent);
  const hasEffort = /工作量|effort|人天 | 小时/i.test(roadmapContent);
  
  const allPresent = hasMVP && hasScope && hasAcceptance && hasEffort;
  
  return {
    rule: 'R2',
    name: 'MVP 可交付性',
    critical: true,
    pass: allPresent,
    details: {
      mvpSection: hasMVP,
      scope: hasScope,
      acceptance: hasAcceptance,
      effort: hasEffort
    }
  };
}
```

**验收标准**：
- ✅ 存在 MVP/Phase 1/里程碑 1 段落
- ✅ 包含范围说明（scope）
- ✅ 包含验收标准（Given/When/Then）
- ✅ 包含工作量估算（人天）

#### 6.1.4 R3: 依赖与风险检查

**检查逻辑**：
```javascript
function checkDependencies(roadmapContent) {
  // 检查 Dependencies 段落
  const hasDependencies = /Dependencies|依赖/i.test(roadmapContent);
  
  // 检查 Risks 段落
  const hasRisks = /Risks|风险/i.test(roadmapContent);
  
  // 检查风险项数量（至少 3 项）
  const riskItems = roadmapContent.match(/\|[^|]+风险 [^|]+\|/g) || [];
  const hasMinimumRisks = riskItems.length >= 3;
  
  return {
    rule: 'R3',
    name: '依赖与风险',
    critical: true,
    pass: hasDependencies && hasRisks && hasMinimumRisks,
    details: {
      dependenciesSection: hasDependencies,
      risksSection: hasRisks,
      risksCount: riskItems.length,
      minimumRisksMet: hasMinimumRisks
    }
  };
}
```

**验收标准**：
- ✅ 存在 Dependencies 段落
- ✅ 存在 Risks 段落
- ✅ 至少 3 项风险

### 6.2 Non-Critical 项（R4 + 1-5, 7-8）

#### 6.2.1 R4: 范围膨胀风险（v3.1.6 优化）

详见第 4 章 R4 规则优化详细设计。

#### 6.2.2 规则 1: 任务拆分

```javascript
function checkTaskBreakdown(roadmapContent) {
  // 检查任务是否按模块和前后端拆分
  const hasFrontend = /前端 |Frontend/i.test(roadmapContent);
  const hasBackend = /后端 |Backend/i.test(roadmapContent);
  const hasModuleBreakdown = /模块 |Module/i.test(roadmapContent);
  
  // 检查任务描述是否职责单一
  const taskLines = roadmapContent.split('\n').filter(line => 
    /\|.+\|/.test(line) && line.includes('任务')
  );
  
  return {
    rule: '1',
    name: '任务拆分',
    critical: false,
    pass: hasFrontend && hasBackend,
    details: {
      hasFrontend,
      hasBackend,
      hasModuleBreakdown,
      taskCount: taskLines.length
    }
  };
}
```

#### 6.2.3 规则 2: 工作量评估

```javascript
function checkEffortEstimation(roadmapContent) {
  // 提取所有工作量（人天）
  const effortRegex = /(\d+\.?\d*)\s*人天/g;
  const efforts = [...roadmapContent.matchAll(effortRegex)].map(m => parseFloat(m[1]));
  
  // 检查是否有超过 2 人天的任务
  const overLimit = efforts.filter(e => e > 2);
  
  return {
    rule: '2',
    name: '工作量评估',
    critical: false,
    pass: overLimit.length === 0,
    details: {
      totalTasks: efforts.length,
      overLimitTasks: overLimit.length,
      maxEffort: Math.max(...efforts, 0),
      avgEffort: efforts.length > 0 ? (efforts.reduce((a, b) => a + b, 0) / efforts.length).toFixed(2) : 0
    }
  };
}
```

#### 6.2.4 规则 3: 收尾项

```javascript
function checkClosingTasks(roadmapContent) {
  // 检查联调测试
  const hasIntegrationTest = /联调 | 集成测试|Integration/i.test(roadmapContent);
  const hasDemo = /演示|Demo|展示/i.test(roadmapContent);
  
  return {
    rule: '3',
    name: '收尾项',
    critical: false,
    pass: hasIntegrationTest && hasDemo,
    details: {
      hasIntegrationTest,
      hasDemo
    }
  };
}
```

#### 6.2.5 规则 4: 任务命名

```javascript
function checkTaskNaming(roadmapContent) {
  // 检查固定格式：【任务简称】(前端/后端) 任务简述
  const namingPattern = /【[^】]+】\s*\((前端 | 后端)\)/g;
  const matches = roadmapContent.match(namingPattern) || [];
  
  // 检查任务表格中的命名
  const taskTableRows = roadmapContent.split('\n').filter(line => 
    /\|\s*【/.test(line)
  );
  
  return {
    rule: '4',
    name: '任务命名',
    critical: false,
    pass: matches.length > 0,
    details: {
      matchedTasks: matches.length,
      taskTableRows: taskTableRows.length
    }
  };
}
```

#### 6.2.6 规则 5: 描述规范

```javascript
function checkDescriptionStandard(roadmapContent) {
  // 检查是否只描述"做什么"，不涉及"怎么做"
  const howKeywords = ['使用', '采用', '通过', '基于', 'using', 'based on'];
  const whatKeywords = ['实现', '创建', '添加', '支持', '提供', 'implement', 'create'];
  
  const taskLines = roadmapContent.split('\n').filter(line => 
    /\|[^|]+任务 [^|]+\|/.test(line)
  );
  
  let howCount = 0;
  taskLines.forEach(line => {
    howKeywords.forEach(kw => {
      if (line.toLowerCase().includes(kw.toLowerCase())) howCount++;
    });
  });
  
  return {
    rule: '5',
    name: '描述规范',
    critical: false,
    pass: howCount === 0,
    details: {
      howKeywordsFound: howCount,
      taskLinesCount: taskLines.length
    }
  };
}
```

#### 6.2.7 规则 7: 技术对齐

```javascript
function checkTechnicalAlignment(roadmapContent, trdContent) {
  // 提取 TRD.md 中的技术选型
  const techStackRegex = /Node\.js|React|Vue|MySQL|MongoDB|Redis/gi;
  const trdTechs = [...new Set(trdContent.match(techStackRegex) || [])];
  
  // 检查 ROADMAP.md 是否与 TRD 一致
  let conflict = false;
  trdTechs.forEach(tech => {
    // 检查是否有冲突技术
    if (tech.toLowerCase().includes('mysql') && roadmapContent.toLowerCase().includes('mongodb')) {
      conflict = true;
    }
  });
  
  return {
    rule: '7',
    name: '技术对齐',
    critical: false,
    pass: !conflict,
    details: {
      trdTechs: trdTechs,
      conflict: conflict
    }
  };
}
```

#### 6.2.8 规则 8: 代码现状（增量需求）

```javascript
function checkCodeAnalysis(roadmapContent, scenario) {
  // 增量需求必须包含代码现状章节
  if (scenario === '增量需求') {
    const hasCodeAnalysis = /代码现状 |Codebase|现有代码/i.test(roadmapContent);
    
    return {
      rule: '8',
      name: '代码现状（增量）',
      critical: false,
      pass: hasCodeAnalysis,
      details: {
        isIncremental: true,
        hasCodeAnalysis
      }
    };
  }
  
  // 非增量需求不适用此规则
  return {
    rule: '8',
    name: '代码现状（增量）',
    critical: false,
    pass: true,
    notApplicable: true,
    details: {
      isIncremental: false
    }
  };
}
```

---

## 7. 文件修改清单

### 7.1 bundled-skills/roadmapping/SKILL.md

**修改位置**: 步骤 4 自审阅章节

**修改内容**:

#### 修改前（v3.1.5）:
```markdown
### 步骤 4: 自审阅（10 项检查清单）

生成 ROADMAP.md 初稿后，执行 10 项检查清单：

| # | 检查项 | 标准 |
|---|--------|------|
| 1 | 任务拆分 | 按模块和前后端拆分 |
...
| 6 | 需求覆盖 | 覆盖 PRD.md 中的所有功能 |
...
| 9 | 风险评估 | 至少 3 项风险 |
| 10 | 不确定性标注 | 不确定的任务已标注 |

**评分决策**:
- 10/10: ✅ 通过
- 8-9/10: ⚠️ 条件通过
- <8/10: ❌ 驳回

**SELF-REVIEW.md**: 始终生成
```

#### 修改后（v3.1.6）:
```markdown
### 步骤 4: 自审阅（12 项检查清单）

生成 ROADMAP.md 初稿后，执行 12 项检查清单：

#### Critical 项（一票否决）:

| 规则 | 检查点 | 标准 |
|------|--------|------|
| R0 | Freshness 对齐 | ROADMAP.md 包含 alignedTo + requirementsHash |
| R1 | Traceability | ROADMAP 显式引用需求 ID（覆盖率 100%） |
| R2 | MVP 可交付性 | 必须存在 MVP/Phase 1/里程碑 1 段落 |
| R3 | 依赖与风险 | ROADMAP 必须有 Dependencies/Risks 段落 |

#### Non-Critical 项（允许条件通过）:

| 规则 | 检查点 | 标准 |
|------|--------|------|
| R4 | 范围膨胀风险 | 检测"可能/可选/未来"关键词，检查缓解措施 |
| 1 | 任务拆分 | 按模块和前后端拆分 |
| 2 | 工作量评估 | 单个任务 ≤ 2 人天 |
| 3 | 收尾项 | 联调测试和演示项 |
| 4 | 任务命名 | 固定格式 |
| 5 | 描述规范 | 只描述"做什么" |
| 7 | 技术对齐 | 与 TRD 一致 |
| 8 | 代码现状（增量） | 增量需求必须包含代码现状章节 |

**评分决策**:
- 所有 Critical 项通过 + Non-Critical 项全部通过：✅ 通过（10/10）
- 所有 Critical 项通过 + Non-Critical 项有失败：⚠️ 条件通过（8-9/10）
- 任一 Critical 项失败：❌ 驳回（0/10）

**SELF-REVIEW.md 生成逻辑**（v3.1.6 优化）:
- Critical 项全部通过 → ❌ 不生成 SELF-REVIEW.md
- Critical 项任一失败 → ✅ 生成 SELF-REVIEW.md（记录失败原因）
```

**修改位置**: 步骤 6 写入文件章节

#### 修改前（v3.1.5）:
```markdown
### 步骤 6: 写入文件

1. 写入 ROADMAP.md
2. 写入 SELF-REVIEW.md（始终生成）
```

#### 修改后（v3.1.6）:
```markdown
### 步骤 6: 写入文件

1. 写入 ROADMAP.md（始终生成）
2. 检查 SELF-REVIEW.md 生成条件：
   - Critical 项全部通过 → 不生成 SELF-REVIEW.md
   - Critical 项任一失败 → 生成 SELF-REVIEW.md
```

### 7.2 adapters/opencode.js

**修改位置**: `buildTask` 函数的 roadmapping 任务描述

**修改内容**:

#### 修改前（v3.1.5）:
```javascript
case 'roadmapping':
  return `请执行 roadmapping 阶段：

步骤 4: 自审阅（10 项检查清单）
- 检查任务拆分、工作量评估、收尾项等
- 评分决策：10/10 通过，8-9/10 修正，<8/10 重做

步骤 6: 写入文件
- 写入 ROADMAP.md
- 写入 SELF-REVIEW.md`;
```

#### 修改后（v3.1.6）:
```javascript
case 'roadmapping':
  return `请执行 roadmapping 阶段：

步骤 4: 自审阅（12 项检查清单）

**Critical 项（一票否决）**:
- R0: Freshness 对齐（alignedTo + requirementsHash）
- R1: Traceability（需求引用覆盖率 100%）
- R2: MVP 可交付性（scope/验收/工作量）
- R3: 依赖与风险（Dependencies/Risks 段落）

**Non-Critical 项（允许条件通过）**:
- R4: 范围膨胀风险（检测关键词 → 检查缓解措施 → 判定结果）
- 1: 任务拆分
- 2: 工作量评估（≤ 2 人天）
- 3: 收尾项（联调测试 + 演示）
- 4: 任务命名（固定格式）
- 5: 描述规范（只描述"做什么"）
- 7: 技术对齐（与 TRD 一致）
- 8: 代码现状（增量需求）

**评分决策**:
- Critical 项全部通过 + Non-Critical 项全部通过 → 10/10 通过
- Critical 项全部通过 + Non-Critical 项有失败 → 8-9/10 条件通过
- Critical 项任一失败 → 0/10 驳回（最多 3 次重做机会）

**SELF-REVIEW.md 生成逻辑**（v3.1.6 优化）:
- Critical 项全部通过 → 不生成 SELF-REVIEW.md（符合"不生成额外文件"原则）
- Critical 项任一失败 → 生成 SELF-REVIEW.md（记录失败原因用于调试）

步骤 6: 写入文件
- 写入 ROADMAP.md（始终生成）
- 检查 SELF-REVIEW.md 生成条件（仅 Critical 失败时生成）`;
```

### 7.3 02_roadmapping/ROADMAP.md（验证输出）

**生成条件**: roadmapping 阶段执行完成

**文件内容**: 详见输入文件中的 ROADMAP.md v3.1.6 验证测试

**验证点**:
- ✅ alignedTo: v3.1.6
- ✅ requirementsHash: sha256:f0e44912d5778703c30ce7921ceb25a81a454672
- ✅ 12 项检查清单全部通过
- ✅ Critical 项全部通过 → 不生成 SELF-REVIEW.md

---

## 8. 验收标准验证

### 8.1 验收标准 1: DETAIL.md v3.1.6 包含文件级详细设计

**验证方法**:
```bash
# 检查文件存在
ls -la 03_detailing/DETAIL.md

# 检查版本
grep "v3.1.6" 03_detailing/DETAIL.md

# 检查章节完整性
grep -c "## " 03_detailing/DETAIL.md  # 应 >= 7 个章节
```

**预期结果**:
- ✅ 文件存在
- ✅ 版本为 v3.1.6
- ✅ 包含 7 个主要章节

### 8.2 验收标准 2: 详细设计包含 R4 规则优化实现

**验证方法**:
```bash
# 检查 R4 规则说明
grep -A 20 "R4 规则优化" 03_detailing/DETAIL.md

# 检查关键词检测逻辑
grep "scopeCreepKeywords" 03_detailing/DETAIL.md

# 检查缓解措施检查逻辑
grep "mitigationKeywords" 03_detailing/DETAIL.md

# 检查判定规则
grep "检测关键词 → 检查缓解措施 → 判定结果" 03_detailing/DETAIL.md
```

**预期结果**:
- ✅ 包含关键词检测逻辑
- ✅ 包含缓解措施检查逻辑
- ✅ 包含判定规则说明

### 8.3 验收标准 3: 详细设计包含 SELF-REVIEW.md 生成逻辑优化

**验证方法**:
```bash
# 检查生成决策逻辑
grep -A 10 "SELF-REVIEW.md 生成逻辑" 03_detailing/DETAIL.md

# 检查 Critical 失败时生成
grep "Critical 项任一失败 → 生成" 03_detailing/DETAIL.md

# 检查通过时不生成
grep "Critical 项全部通过 → 不生成" 03_detailing/DETAIL.md
```

**预期结果**:
- ✅ 包含生成决策逻辑
- ✅ 明确 Critical 失败时生成
- ✅ 明确通过时不生成

### 8.4 验收标准 4: 详细设计包含 12 项检查清单实现

**验证方法**:
```bash
# 检查 Critical 项（R0-R3）
grep -c "R[0-3]:" 03_detailing/DETAIL.md  # 应 >= 4

# 检查 Non-Critical 项（R4 + 1-5, 7-8）
grep -E "R4:|规则 [1-5]|规则 [78]:" 03_detailing/DETAIL.md | wc -l  # 应 >= 8

# 检查检查函数实现
grep -c "function check" 03_detailing/DETAIL.md  # 应 >= 12
```

**预期结果**:
- ✅ Critical 项（R0-R3）完整
- ✅ Non-Critical 项（R4 + 1-5, 7-8）完整
- ✅ 12 项检查函数实现完整

### 8.5 验收标准 5: ReviewDesignAgent 审查得分 >= 90%

**验证方法**:
```bash
# 执行 ReviewDesignAgent
node review-agents/review-detail.js 03_detailing/DETAIL.md

# 检查得分
# 预期：>= 90%
```

**预期结果**:
- ✅ 审查得分 >= 90%

### 8.6 验收标准 6: 用户验收通过

**验证方法**:
- 用户审阅 DETAIL.md v3.1.6
- 确认所有验收标准满足
- 签字确认（PRD.md 第 15 章）

**预期结果**:
- ✅ 用户验收通过

---

## 9. 版本历史

| 版本 | 日期 | 变更说明 | Issue ID | 自审阅得分 |
|------|------|---------|----------|-----------|
| v2.0.1 | 2026-03-30 | BUG-002 修复：补充 03_detailing/ | BUG-002 | N/A |
| v3.1.0 | 2026-04-02 | FEATURE-004：DESIGNING 阶段审阅优化 | FEATURE-004 | N/A |
| v3.1.1 | 2026-04-02 | BUG-005 修复：PRD/TRD 文档修复 | BUG-005 | N/A |
| v3.1.2 | 2026-04-02 | BUG-006 修复：PRD/TRD 审查问题修复 | BUG-006 | N/A |
| v3.1.3 | 2026-04-02 | FEATURE-005：DESIGNING 阶段用户确认签字优化 | FEATURE-005 | N/A |
| v3.1.4 | 2026-04-02 | BUG-007 修复：PRD/TRD 描述 AI 工具为 config.yaml 配置 | BUG-007 | N/A |
| v3.1.5 | 2026-04-02 | FEATURE-006：ROADMAPPING 审阅 Agent 规则优化 | FEATURE-006 | N/A |
| **v3.1.6** | **2026-04-02** | **FEATURE-007：ROADMAPPING 环节优化（R4 规则优化 + 不生成 SELF-REVIEW.md）** | **FEATURE-007** | **N/A** |

---

## 10. 附录

### 10.1 术语表

| 术语 | 说明 |
|------|------|
| Critical 项 | 一票否决项（R0-R3），任一失败即驳回 |
| Non-Critical 项 | 允许条件通过项（R4 + 1-5, 7-8），失败扣分但不直接驳回 |
| Freshness | 文档对齐最新需求的程度 |
| Traceability | 需求可追溯性（需求 ID 引用） |
| Deliverability | MVP 可交付性（scope/验收/工作量） |
| Scope Creep | 范围膨胀（无缓解措施的未来/可选功能） |

### 10.2 相关文件

- `REQUIREMENTS.md v3.1.6` - 需求说明
- `PRD.md v3.1.6` - 产品需求文档
- `TRD.md v3.1.6` - 技术设计文档
- `ROADMAP.md v3.1.6` - 开发计划
- `bundled-skills/roadmapping/SKILL.md v3.1.6` - Roadmap Skill
- `adapters/opencode.js v3.1.6` - OpenCode 适配器

---

*DETAIL.md v3.1.6 完成*  
**生成时间**: 2026-04-02  
**审查状态**: 待 ReviewDesignAgent 审查  
**审查目标**: >= 90%
