# Designing 环节执行流程图

> **版本**: v3.1.14  
> **最后更新**: 2026-04-07  
> **说明**: Designing 阶段完整执行流程，包含所有 v3.1.x 修复

---

## 流程图概览

```
┌─────────────────────────────────────────────────────────────────┐
│                    Designing 阶段执行流程                        │
└─────────────────────────────────────────────────────────────────┘

  输入：REQUIREMENTS.md
         ↓
  ┌────────────────────────────────────────────────────────────────┐
  │  1. 初始化审阅 Agent (ReviewDesignAgentV2)                     │
  │     - 加载 config.yaml 配置                                     │
  │     - 确认 reviewAgent.version: v2.0                           │
  │     - 加载检查清单（FG/TG + D1-D7）                            │
  └────────────────────────────────────────────────────────────────┘
         ↓
  ┌────────────────────────────────────────────────────────────────┐
  │  2. 执行 Freshness Gate (强门禁)                               │
  │     v3.1.12 修复：支持 7-64 位短哈希                            │
  └────────────────────────────────────────────────────────────────┘
         ↓
  ┌────────────────────────────────────────────────────────────────┐
  │  3. 执行 Traceability Gate (强门禁)                            │
  │     v3.1.13 修复：要求标题 + 证据关键词                         │
  └────────────────────────────────────────────────────────────────┘
         ↓
  ┌────────────────────────────────────────────────────────────────┐
  │  4. 执行质量检查 (D1-D7)                                       │
  │     v3.1.12 修复：D7 结构化标记                                 │
  │     v3.1.12 标记：AI 检查为 mock                                │
  └────────────────────────────────────────────────────────────────┘
         ↓
  ┌────────────────────────────────────────────────────────────────┐
  │  5. 计算综合评分                                                │
  │     - Gate 失败 → 直接驳回                                     │
  │     - Gate 通过 → 计算质量分                                   │
  └────────────────────────────────────────────────────────────────┘
         ↓
  ┌────────────────────────────────────────────────────────────────┐
  │  6. 输出审阅报告                                                │
  │     - 通过/条件通过/驳回                                        │
  │     - 失败项列表 + 修复建议                                     │
  └────────────────────────────────────────────────────────────────┘
```

---

## 详细流程

### 1. 初始化审阅 Agent

```javascript
// workflow-orchestrator.js L20, L155
const ReviewDesignAgentV2 = require('./review-agents/review-design-v2');
const agent = new ReviewDesignAgentV2(this.config);

// config.yaml
reviewAgent:
  version: v2.0
```

**检查清单加载**：
```javascript
// review-design-v2.js L45-128
loadCheckpoints() {
  return [
    // 🔒 强门禁（前置检查）
    { id: 'FG', name: 'Freshness Gate', critical: true },
    { id: 'TG', name: 'Traceability Gate', critical: true },
    // ✅ 质量检查（D1-D7）
    { id: 'D1', name: '需求理解准确性', type: 'ai' },
    { id: 'D2', name: '文档完整性', type: 'ai' },
    { id: 'D3', name: '无模糊词', type: 'auto' },
    { id: 'D4', name: '技术选型合理', type: 'ai' },
    { id: 'D5', name: '向后兼容', type: 'ai' },
    { id: 'D6', name: '异常处理', type: 'ai' },
    { id: 'D7', name: '验收标准可测试性', type: 'auto' }
  ];
}
```

---

### 2. Freshness Gate (强门禁)

**v3.1.12 修复前**：
```javascript
// ❌ 强制 64 位
const match1 = content.match(/> \*\*对齐版本\*\*: REQUIREMENTS v([0-9.]+) \(([a-f0-9]{64})\)/);
```

**v3.1.12 修复后**：
```javascript
// ✅ 支持 7-64 位
const match1 = content.match(/> \*\*对齐版本\*\*: REQUIREMENTS v([0-9.]+) \(([a-f0-9]{7,64})\)/i);

// ✅ 对比用 startsWith
const prdHashMatch = prdAlignment.hash && 
  requirementsActualHash.toLowerCase().startsWith(prdAlignment.hash.toLowerCase());
```

**流程**：
```
1. 计算 REQUIREMENTS.md 实际 SHA256 哈希
   ↓
2. 提取 PRD.md 声明的哈希（支持 7-64 位）
   ↓
3. 提取 TRD.md 声明的哈希（支持 7-64 位）
   ↓
4. 对比：requirementsActualHash.startsWith(declaredHash)
   ↓
5. 判断：
   ├─ PRD 哈希匹配 && TRD 哈希匹配 → ✅ 通过
   └─ 任一不匹配 → ❌ 驳回（提示更新为前 7-64 位）
```

**支持的声明格式**：
```markdown
✅ > **对齐版本**: REQUIREMENTS v3.1.12 (9f02132d0cf5)
✅ > **对齐版本**: REQUIREMENTS v3.1.12 (9f02132d0cf5db3a614aa260cfa2be16efc6232d0e3ca58c3fa401cf0dd0fcc8)
✅ | 对齐版本 | REQUIREMENTS v3.1.12 |
   | 对齐哈希 | 9f02132d0cf5 |
❌ > **对齐版本**: REQUIREMENTS v3.1.12  ← 无哈希
❌ > **对齐版本**: REQUIREMENTS v3.1.12 (9f0213)  ← 少于 7 位
```

---

### 3. Traceability Gate (强门禁)

**v3.1.13 修复前**：
```javascript
// ❌ 任意位置出现就算映射
if (line.includes(`[${requirementId}]`)) {
  return { section, line, content };
}
```

**v3.1.13 修复后**：
```javascript
// ✅ 要求标题或列表项
const patterns = [
  /^#{1,6}.*\[REQ-001\]/,           // 标题 + 方括号
  /^#{1,6}\s*REQ-001[：:]/,         // 标题 + 冒号
  /^[-*]\s*(?:\*\*)?\[REQ-001\]/,   // 列表项 + 方括号
  /^#{1,6}.*\bREQ-001\b/            // 标题 + 词边界
];

// ✅ 证据关键词验证
const evidenceKeywords = [
  /功能 (描述 | 说明 | 设计)/i,
  /验收 (标准 | 条件)/i,
  /Given|When|Then|前置条件 | 触发条件 | 预期结果/i
];

const hasEvidence = evidenceKeywords.some(regex => regex.test(sectionContent));
if (hasEvidence) {
  return { section, line, content };  // ← 只有有证据才算映射
}
```

**流程**：
```
1. 提取 REQUIREMENTS.md 中的所有需求（支持 REQ-001 / REQ-ABC-001）
   ↓
2. 对每条需求，在 PRD.md 中查找映射：
   ├─ 匹配模式 1：标题 + 方括号 (### 功能 [REQ-001])
   ├─ 匹配模式 2：标题 + 冒号 (### REQ-001: 功能)
   ├─ 匹配模式 3：列表项 + 方括号 (- **[REQ-001]**)
   └─ 匹配模式 4：标题 + 词边界 (### 功能 REQ-001)
   ↓
3. 验证章节内容是否包含证据关键词：
   ├─ 功能描述/说明/设计
   ├─ 验收标准/条件
   ├─ Given/When/Then
   └─ 字段/数据/流程/接口/UI
   ↓
4. 判断：
   ├─ 找到映射 && 有证据 → ✅ 已映射
   ├─ 找到映射但无证据 → ⚠️ 跳过（记录 warning）
   └─ 未找到映射 → ❌ 未映射
   ↓
5. 计算可追溯率：
   ├─ 100% 映射 → ✅ 通过
   └─ <100% 映射 → ❌ 驳回（列出未映射需求）
```

**命中示例**：
```markdown
✅ ### 2.1 用户注册功能 [REQ-001]
   功能描述：用户可以通过邮箱注册账号
   验收标准：Given 用户未注册...

❌ | REQ-001 | 2.1 | ✅ 已映射 |  ← 追溯表，无证据关键词
❌ 参见 REQ-001  ← 引用，不是标题
```

---

### 4. 质量检查 (D1-D7)

#### D1-D6: AI 检查（v3.1.12 标记为 mock）

```javascript
// v3.1.12 明确标记
async callAI(prompt) {
  console.warn('[Review-Design v2] ⚠️ AI 调用未实现');
  return {
    score: 80,
    passed: true,
    suggestions: ['⚠️ AI 检查未实现，建议人工审阅确认'],
    isMock: true
  };
}
```

**当前状态**：
- ✅ D1 需求理解准确性 → mock（固定 80 分）
- ✅ D2 文档完整性 → mock（固定 80 分）
- ✅ D3 无模糊词 → 自动检查（真实生效）
- ✅ D4 技术选型合理 → mock（固定 80 分）
- ✅ D5 向后兼容 → mock（固定 80 分）
- ✅ D6 异常处理 → mock（固定 80 分）

#### D7: 验收标准可测试性（v3.1.12 修复）

**v3.1.12 修复前**：
```javascript
// ❌ 单字误判
const hasWhen = /When|当 | 触发条件/i.test(sectionContent);
// "当用户打开页面时..." 会误判
```

**v3.1.12 修复后**：
```javascript
// ✅ 结构化标记
const hasGiven = /Given\s*[:：]|假设\s*[:：]|前置条件\s*[:：]|【前置条件】|\*\*前置条件\*\*/i.test(sectionContent);
const hasWhen = /When\s*[:：]|触发条件\s*[:：]|【触发条件】|\*\*触发条件\*\*/i.test(sectionContent);
const hasThen = /Then\s*[:：]|预期结果\s*[:：]|【预期结果】|\*\*预期结果\*\*/i.test(sectionContent);

// 宽松模式（降级）
const hasGivenLoose = hasGiven || /^Given\b|^假设\b|^前置条件\b/im.test(sectionContent);
```

**流程**：
```
1. 逐条遍历 REQUIREMENTS.md 中的需求
   ↓
2. 查找 PRD.md 中的映射章节
   ↓
3. 检查章节内容是否包含结构化标记：
   ├─ Given/假设/前置条件 + 冒号/括号
   ├─ When/触发条件 + 冒号/括号
   └─ Then/预期结果 + 冒号/括号
   ↓
4. 宽松模式（如果结构化标记未找到）：
   ├─ 换行 + Given/假设/前置条件
   ├─ 换行 + When/触发条件
   └─ 换行 + Then/预期结果
   ↓
5. 判断：
   ├─ Given && When && Then 都存在 → ✅ 通过
   └─ 任一缺失 → ❌ 失败（记录缺失项）
   ↓
6. 计算通过率：
   ├─ 通过率 >= 80% → ✅ 通过
   └─ 通过率 < 80% → ❌ 失败
```

**通过示例**：
```markdown
✅ 前置条件：用户未注册
   触发条件：填写注册表单
   预期结果：创建账号并发送验证邮件

✅ 【前置条件】用户未登录
   【触发条件】访问受保护资源
   【预期结果】重定向到登录页

❌ 当用户打开页面时，系统应该加载数据  ← 单字"当"，误判
```

---

### 5. 计算综合评分

```javascript
// 1. Gate 检查（一票否决）
if (!freshnessGate.passed || !traceabilityGate.passed) {
  return {
    passed: false,
    score: 0,
    recommendation: 'reject',
    reason: 'Gate 失败'
  };
}

// 2. 质量检查评分
const qualityScores = [D1, D2, D3, D4, D5, D6, D7];
const avgScore = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;

// 3. 综合决策
if (avgScore >= 90) {
  return { passed: true, score: avgScore, recommendation: 'pass' };
} else if (avgScore >= 70) {
  return { passed: true, score: avgScore, recommendation: 'conditional' };
} else {
  return { passed: false, score: avgScore, recommendation: 'reject' };
}
```

---

### 6. 输出审阅报告

**通过**：
```markdown
## 审阅结论：✅ 通过

**综合评分**: 95/100

**Gate 检查**:
- ✅ Freshness Gate: 通过（哈希匹配）
- ✅ Traceability Gate: 通过（13/13 映射）

**质量检查**:
- ✅ D1 需求理解准确性: 80/100
- ✅ D2 文档完整性: 80/100
- ✅ D3 无模糊词: 100/100
- ✅ D4 技术选型合理: 80/100
- ✅ D5 向后兼容: 80/100
- ✅ D6 异常处理: 80/100
- ✅ D7 验收标准可测试性: 100/100

**建议**: 无
```

**驳回**：
```markdown
## 审阅结论：❌ 驳回

**综合评分**: 0/100

**Gate 检查**:
- ❌ Freshness Gate: 失败（哈希不匹配）
  - 实际哈希：9f02132d0cf5db3a614aa260cfa2be16efc6232d0e3ca58c3fa401cf0dd0fcc8
  - PRD 声明：abc123
  - 建议：请更新为前 7-64 位：9f02132d0cf5...

**建议**:
1. 更新 PRD.md 的哈希声明为实际值的前 7-64 位
2. 更新 TRD.md 的哈希声明为实际值的前 7-64 位
3. 重新执行审阅
```

---

## v3.1.x 修复总览

| 版本 | 修复内容 | 影响环节 |
|------|---------|---------|
| v3.1.9 | Freshness Gate 哈希校验 + 需求 ID 正则 + D7 逐条检查 | FG / TG / D7 |
| v3.1.10 | 需求 ID 正则支持 REQUIREMENTS.md 冒号格式 | TG |
| v3.1.11 | 3 个 Blocker 问题（哈希格式/映射匹配/v2 验证） | FG / TG |
| v3.1.12 | 可用性和准确性（短哈希/D7 结构化/AI mock 标记） | FG / D7 |
| v3.1.13 | 误报/漏报问题（version 提取/TG 映射判定） | FG / TG |
| v3.1.14 | 架构统一（删除旧 review-design.js） | 整体 |

---

## 当前真正生效的检查

| 检查项 | 类型 | 状态 | 说明 |
|--------|------|------|------|
| **FG Freshness Gate** | 强门禁 | ✅ 生效 | 支持 7-64 位哈希 + startsWith 对比 |
| **TG Traceability Gate** | 强门禁 | ✅ 生效 | 标题/列表项 + 证据关键词 |
| **D3 模糊词** | 自动检查 | ✅ 生效 | 检测"适当的"/"一些"/"可能" |
| **D7 验收标准** | 逐条检查 | ✅ 生效 | 结构化标记 + 宽松模式 |
| D1/D2/D4/D5/D6 | AI mock | ⚠️ 未实现 | 固定返回 80 分 |

---

## 下一步建议

1. **实现 AI 检查** - 调用真实 AI 工具执行 D1/D2/D4/D5/D6
2. **增加更多证据关键词** - 提高 TG 映射准确性
3. **优化 D7 宽松模式** - 减少误判同时保持灵活性

---

*文档 by openclaw-ouyp*  
**版本**: v3.1.14 | **日期**: 2026-04-07 | **Commit**: 88ea5a4
