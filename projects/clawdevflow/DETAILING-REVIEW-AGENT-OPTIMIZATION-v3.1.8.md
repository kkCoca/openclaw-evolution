# DETAILING 审阅 Agent 优化方案 v3.1.8（整合用户建议）

**日期**: 2026-04-02 17:39  
**版本**: v3.1.8（整合用户建议）  
**场景**: designing→roadmapping→**detailing（带审阅 Agent）**→coding→reviewing

---

## 一、审阅 Agent 核心职责

**核心职责**: 把"计划/需求"真正落成**可实现、可测试、可回滚**的工程规格

**否则后果**: coding 阶段"看起来实现了，但验收/边界/回滚全是空"

---

## 二、输入/输出明确（用户建议 1）

### 2.1 输入（必须读取）

| 文件 | 位置 | 用途 | 关键性 |
|------|------|------|--------|
| **REQUIREMENTS.md** | 项目根目录 | 最新需求 source of truth，Freshness 判断 | **critical** |
| **PRD.md** | 01_designing/ | 产品需求，功能边界 | **critical** |
| **TRD.md** | 01_designing/ | 技术设计，技术选型 | **critical** |
| **ROADMAP.md** | 02_roadmapping/ | 开发计划，任务分解 | **critical** |
| **DETAIL.md** | 03_detailing/ | 被审阅对象 | **critical** |

**输入读取流程**:
```javascript
function readInputs() {
  return {
    requirements: fs.readFileSync('REQUIREMENTS.md', 'utf8'),
    prd: fs.readFileSync('01_designing/PRD.md', 'utf8'),
    trd: fs.readFileSync('01_designing/TRD.md', 'utf8'),
    roadmap: fs.readFileSync('02_roadmapping/ROADMAP.md', 'utf8'),
    detail: fs.readFileSync('03_detailing/DETAIL.md', 'utf8')
  };
}
```

**为什么必须读 REQUIREMENTS.md**:
- ✅ **Freshness 判断** - 确保 DETAIL 基于最新需求版本
- ✅ **需求追溯** - 直接追溯到需求源头，不依赖 PRD 中转
- ✅ **版本对齐** - 检查 DETAIL 版本与 REQUIREMENTS 版本一致

---

### 2.2 输出（必须生成）

| 输出项 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| **审阅结论** | 字符串 | pass / conditional / reject / clarify | `pass` |
| **失败项列表** | 数组 | 明确到"DETAIL.md 缺哪一节 / 哪条需求没覆盖" | `['缺少第 3 章接口设计', 'REQ-004 未映射']` |
| **修复建议** | 数组 | 下一步怎么改 DETAIL（最好能指出示例） | `['补充第 3 章接口设计，参考 TRD.md 第 5 章']` |

**输出格式**:
```json
{
  "decision": "reject",
  "score": "5/8",
  "failedItems": [
    {
      "checkpoint": "D0 章节完整性",
      "reason": "缺少第 3 章接口设计",
      "location": "DETAIL.md L1"
    },
    {
      "checkpoint": "D1 需求可追溯",
      "reason": "REQ-004, REQ-005 未映射到详细设计",
      "location": "DETAIL.md L1-1175"
    }
  ],
  "fixSuggestions": [
    {
      "item": "D0 章节完整性",
      "suggestion": "补充第 3 章接口设计，包含 API 路径/方法/参数/返回值/错误码",
      "example": "参考 TRD.md 第 5 章接口设计"
    },
    {
      "item": "D1 需求可追溯",
      "suggestion": "在 DETAIL.md 中显式引用 REQ-004 和 REQ-005，描述详细设计映射",
      "example": "## 4.2 REQ-004 详细设计 - 密码重置功能"
    }
  ]
}
```

---

## 三、强门禁（Hard Gates）（用户建议 2）

### 3.1 Hard Gate 1: 防止上游变了 DETAIL 还在写旧版本

**问题**: REQUIREMENTS.md 已更新到 v3.1.8，但 DETAIL.md 还在基于 v3.1.5 编写

**检查规则**:
```javascript
function checkFreshness(inputs) {
  // 1. 提取 REQUIREMENTS.md 版本
  const requirementsVersion = extractVersion(inputs.requirements);
  // 'v3.1.8'
  
  // 2. 提取 DETAIL.md 引用的版本
  const detailReferencedVersion = extractReferencedVersion(inputs.detail);
  // 'v3.1.5' 或 '未明确引用'
  
  // 3. 检查是否一致
  if (requirementsVersion !== detailReferencedVersion) {
    return {
      passed: false,
      expected: requirementsVersion,
      found: detailReferencedVersion || '未明确引用'
    };
  }
  
  return { passed: true };
}
```

**示例**:
```markdown
✅ 正确：
# 详细设计文档（DETAIL）

## 文档元数据

| 字段 | 值 |
|------|-----|
| 对齐 REQUIREMENTS 版本 | v3.1.8 |
| 对齐 REQUIREMENTS 哈希 | sha256:xxx |

❌ 错误：
# 详细设计文档（DETAIL）

（无版本引用，或引用 v3.1.5）
```

**关键性**: **critical**（一票否决）

---

### 3.2 Hard Gate 2: 每条需求在 DETAIL 必须有"可定位映射"

**问题**: DETAIL.md 说"实现了 REQ-001"，但没说在哪一章、哪一节实现的

**检查规则**:
```javascript
function checkTraceability(inputs) {
  // 1. 从 REQUIREMENTS 抽取所有需求 ID
  const requirementIds = extractRequirementIds(inputs.requirements);
  // ['REQ-001', 'REQ-002', ..., 'REQ-012']
  
  // 2. 在 DETAIL 全文查找这些 ID，并记录位置
  const mappings = [];
  const missingIds = [];
  
  for (const reqId of requirementIds) {
    const locations = findLocations(inputs.detail, reqId);
    // ['L245-280', 'L560-590']
    
    if (locations.length === 0) {
      missingIds.push(reqId);
    } else {
      mappings.push({
        requirement: reqId,
        locations: locations
      });
    }
  }
  
  return {
    passed: missingIds.length === 0,
    mappings: mappings,
    missing: missingIds
  };
}
```

**示例**:
```markdown
✅ 正确（可定位映射）：
## 4.1 REQ-001 详细设计 - 用户登录功能（L245-280）

### 模块设计
用户认证模块 - login() 函数（L250-260）

### 接口设计
POST /api/auth/login（L265-275）

## 4.2 REQ-002 详细设计 - 用户注册功能（L560-590）
...

❌ 错误（不可定位）：
## 4. 详细设计

### 用户认证
（没说对应哪个 REQ，位置不明确）
```

**关键性**: **critical**（一票否决）

---

### 3.3 Hard Gate 3: DETAIL 的验收必须可测试

**问题**: DETAIL.md 说"验收标准：用户能够登录"，但没说怎么测试

**检查规则**:
```javascript
function checkTestability(inputs) {
  // 1. 提取 DETAIL.md 中的所有验收标准
  const acceptanceCriteria = extractAcceptanceCriteria(inputs.detail);
  
  // 2. 检查每个验收标准是否可测试
  const untestableCriteria = [];
  
  for (const criterion of acceptanceCriteria) {
    // 检查是否包含 Given/When/Then 格式
    const hasGWT = /Given.*When.*Then/i.test(criterion);
    
    // 检查是否包含量化指标
    const hasMetrics = /\d+/.test(criterion);
    
    // 检查是否包含明确的操作和预期结果
    const hasClearAction = /(点击 | 输入 | 提交 | 返回 | 显示)/i.test(criterion);
    
    if (!hasGWT && !hasMetrics && !hasClearAction) {
      untestableCriteria.push(criterion);
    }
  }
  
  return {
    passed: untestableCriteria.length === 0,
    untestable: untestableCriteria
  };
}
```

**示例**:
```markdown
✅ 正确（可测试）：
### 验收标准

**REQ-001 用户登录**:
- Given 用户已注册账号
- When 用户输入正确的用户名和密码，点击"登录"按钮
- Then 系统返回有效的 JWT Token，状态码 200
- Then 用户跳转到首页，显示"欢迎，{用户名}"

**性能指标**:
- 登录 API 响应时间 < 500ms（P95）
- 并发支持 >= 1000 QPS

❌ 错误（不可测试）：
### 验收标准

**REQ-001 用户登录**:
- 用户能够登录
- 系统应该返回 Token
- 性能要好
```

**关键性**: **critical**（一票否决）

---

## 四、更新后的检查清单

### 4.1 Critical 项（4 项 Hard Gates + 1 项章节完整性）

| ID | 检查点 | 关键性 | 标准 | 验证方法 |
|----|--------|--------|------|---------|
| **HG1** | **Freshness 对齐** | **critical** | DETAIL 版本与 REQUIREMENTS 一致 | 检查版本引用 |
| **HG2** | **需求可追溯（可定位）** | **critical** | 每条需求都有章节 + 行号映射 | 查找 REQ-XXX + 位置 |
| **HG3** | **验收可测试** | **critical** | 验收标准包含 Given/When/Then 或量化指标 | 检查验收标准格式 |
| **D0** | **章节完整性** | **critical** | 包含概述/模块/接口/数据结构/代码结构/验收标准 | 检查章节标题 |
| **D2** | **技术一致性** | **critical** | 与 TRD.md 技术选型一致 | 对比技术栈 |

### 4.2 Normal 项（3 项）

| ID | 检查点 | 关键性 | 标准 | 验证方法 |
|----|--------|--------|------|---------|
| D3 | 计划对齐 | normal | 与 ROADMAP.md 开发计划一致 | 对比任务列表 |
| D4 | 模块设计清晰 | normal | 每个模块职责清晰、接口明确 | 检查模块描述 |
| D5 | 接口设计完整 | normal | API 路径/方法/参数/返回值/错误码完整 | 检查接口定义 |
| D6 | 数据结构合理 | normal | 数据库表结构/字段类型/索引/关系完整 | 检查表结构定义 |
| D7 | 代码结构规范 | normal | 目录结构/文件组织/命名规范清晰 | 检查目录结构 |

**总计**: 10 项检查（5 项 critical + 5 项 normal）

---

## 五、评分决策规则更新

**评分计算**:
```javascript
function calculateScore(checkpoints) {
  const passedCount = checkpoints.filter(c => c.passed).length;
  return passedCount; // 0-10
}
```

**决策规则**:
```javascript
function makeDecision(score, criticalResults) {
  const criticalFailed = criticalResults.filter(r => !r.passed).length;
  
  if (criticalFailed > 0) {
    return {
      decision: 'reject',
      reason: `Critical 项失败：${criticalFailed}项`,
      failedItems: criticalResults.filter(r => !r.passed)
    };
  }
  
  if (score === 10) {
    return {
      decision: 'pass',
      reason: '所有检查项通过',
      score: `${score}/10`
    };
  } else if (score >= 8) {
    return {
      decision: 'conditional',
      reason: 'Non-Critical 项部分失败',
      score: `${score}/10`,
      failedItems: checkpoints.filter(c => !c.passed)
    };
  } else {
    return {
      decision: 'reject',
      reason: '得分低于 8/10',
      score: `${score}/10`,
      failedItems: checkpoints.filter(c => !c.passed)
    };
  }
}
```

**决策矩阵**:
| Critical 项 | Normal 项 | 得分 | 决策 |
|-----------|---------|------|------|
| 全部通过 | 全部通过 | 10/10 | ✅ **pass** |
| 全部通过 | 1-2 项失败 | 8-9/10 | ⚠️ **conditional** |
| 全部通过 | 3 项 + 失败 | <8/10 | ❌ **reject** |
| 部分失败 | 任意 | 任意 | ❌ **reject** |

---

## 六、审阅流程更新

```
读取输入（REQUIREMENTS + PRD + TRD + ROADMAP + DETAIL）
    ↓
[步骤 1] 执行 10 项检查清单
    ├─ HG1 Freshness 对齐
    ├─ HG2 需求可追溯（可定位）
    ├─ HG3 验收可测试
    ├─ D0 章节完整性
    ├─ D2 技术一致性
    ├─ D3 计划对齐
    ├─ D4 模块设计清晰
    ├─ D5 接口设计完整
    ├─ D6 数据结构合理
    └─ D7 代码结构规范
    ↓
[步骤 2] 计算得分（0-10）
    ↓
[步骤 3] 评分决策
    ├─ 10/10 + Critical 全部通过 → pass
    ├─ 8-9/10 + Critical 全部通过 → conditional
    └─ <8/10 或 Critical 失败 → reject
    ↓
[步骤 4] 生成输出
    ├─ 审阅结论（pass/conditional/reject）
    ├─ 失败项列表（明确到章节/行号）
    └─ 修复建议（下一步怎么改）
    ↓
[步骤 5] 修正（如需要，最多 3 次）
    ↓
[步骤 6] 写入 DETAIL-REVIEW.md（可选）
    ↓
进入 CODING 阶段
```

---

## 七、输出示例

### 7.1 pass 场景

```json
{
  "decision": "pass",
  "score": "10/10",
  "reason": "所有检查项通过",
  "failedItems": [],
  "fixSuggestions": []
}
```

### 7.2 conditional 场景

```json
{
  "decision": "conditional",
  "score": "9/10",
  "reason": "Non-Critical 项部分失败",
  "failedItems": [
    {
      "checkpoint": "D5 接口设计完整",
      "reason": "部分 API 缺少错误码定义",
      "location": "DETAIL.md L345-380"
    }
  ],
  "fixSuggestions": [
    {
      "item": "D5 接口设计完整",
      "suggestion": "补充错误码定义，包含 400/401/403/404/500 等常见错误",
      "example": "参考 TRD.md 第 6 章错误码设计"
    }
  ]
}
```

### 7.3 reject 场景（Critical 失败）

```json
{
  "decision": "reject",
  "score": "7/10",
  "reason": "Critical 项失败：2 项",
  "failedItems": [
    {
      "checkpoint": "HG1 Freshness 对齐",
      "reason": "DETAIL.md 引用 REQUIREMENTS v3.1.5，实际最新版本 v3.1.8",
      "location": "DETAIL.md L1",
      "expected": "v3.1.8",
      "found": "v3.1.5"
    },
    {
      "checkpoint": "HG2 需求可追溯（可定位）",
      "reason": "REQ-004, REQ-005, REQ-012 未映射到详细设计",
      "location": "DETAIL.md L1-1175",
      "missing": ["REQ-004", "REQ-005", "REQ-012"]
    }
  ],
  "fixSuggestions": [
    {
      "item": "HG1 Freshness 对齐",
      "suggestion": "更新 DETAIL.md 文档元数据，引用 REQUIREMENTS v3.1.8",
      "example": "## 文档元数据\n\n| 对齐 REQUIREMENTS 版本 | v3.1.8 |"
    },
    {
      "item": "HG2 需求可追溯（可定位）",
      "suggestion": "在 DETAIL.md 中为 REQ-004, REQ-005, REQ-012 添加详细设计章节，明确标注章节号和行号",
      "example": "## 4.4 REQ-004 详细设计 - 密码重置功能（L680-720）"
    }
  ]
}
```

---

## 八、实施建议

### 8.1 优先级排序

| 优先级 | 检查点 | 理由 | 预计时间 |
|--------|--------|------|---------|
| **P0** | HG1 Freshness 对齐 | 防止上游变了 DETAIL 还在写旧版本 | 1 小时 |
| **P0** | HG2 需求可追溯（可定位） | 确保每条需求都有明确映射 | 2 小时 |
| **P0** | HG3 验收可测试 | 确保 coding 有明确验收标准 | 2 小时 |
| **P0** | D0 章节完整性 | 基础质量保证 | 1 小时 |
| **P0** | D2 技术一致性 | 避免技术选型冲突 | 1 小时 |
| **P1** | D3-D7 Normal 项 | 提升设计质量 | 4 小时 |

### 8.2 实施步骤

**阶段 1: 添加 Hard Gates（P0, 7 小时）**
1. 实现 HG1 Freshness 对齐检查
2. 实现 HG2 需求可追溯（可定位）检查
3. 实现 HG3 验收可测试检查
4. 实现 D0 章节完整性检查
5. 实现 D2 技术一致性检查
6. 更新评分决策规则
7. 测试验证

**阶段 2: 添加 Normal 规则（P1, 4 小时）**
1. 实现 D3 计划对齐检查
2. 实现 D4 模块设计清晰检查
3. 实现 D5 接口设计完整检查
4. 实现 D6 数据结构合理检查
5. 实现 D7 代码结构规范检查
6. 测试验证

**阶段 3: 优化和文档（P2, 2 小时）**
1. 更新 bundled-skills/detailing/SKILL.md
2. 更新 adapters/opencode.js
3. 添加示例文件
4. 更新测试用例

---

## 九、总结

### 9.1 核心改进

**整合用户建议后**:
1. ✅ **输入/输出明确** - REQUIREMENTS + PRD + TRD + ROADMAP + DETAIL → 审阅结论 + 失败项 + 修复建议
2. ✅ **强门禁（Hard Gates）** - Freshness/可追溯/可测试，3 项 critical 一票否决
3. ✅ **检查清单完善** - 10 项（5 项 critical + 5 项 normal）
4. ✅ **输出格式规范** - JSON 格式，明确到章节/行号

### 9.2 与 ROADMAPPING 审阅 Agent 对比

| 特性 | ROADMAPPING | DETAILING（优化后） | 对齐 |
|------|-------------|-------------------|------|
| **输入** | PRD + TRD | REQUIREMENTS + PRD + TRD + ROADMAP + DETAIL | ✅ **增强** |
| **输出** | 审阅结论 + SELF-REVIEW.md | 审阅结论 + 失败项 + 修复建议 + DETAIL-REVIEW.md | ✅ **增强** |
| **检查清单** | 12 项（R0-R4 + 1-5, 7-8） | 10 项（HG1-3 + D0, D2 + D3-D7） | ✅ **对齐** |
| **Critical 项** | 4 项（R0-R3） | 5 项（HG1-3 + D0 + D2） | ✅ **增强** |
| **评分决策** | Critical 一票否决 | Critical 一票否决 | ✅ **对齐** |
| **修正机制** | 自动修正（最多 3 次） | 自动修正（最多 3 次） | ✅ **对齐** |

### 9.3 预期效果

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 版本对齐 | 无保证 | 100% 对齐（HG1） | 显著提升 |
| 需求可追溯 | 无保证 | 100% 可定位（HG2） | 显著提升 |
| 验收可测试 | 无保证 | 100% 可测试（HG3） | 显著提升 |
| 章节完整性 | 无保证 | 100% 完整（D0） | 显著提升 |
| 技术一致性 | 无保证 | 100% 一致（D2） | 显著提升 |
| 返工风险 | 高 | 低 | 显著降低 |

---

*DETAILING 审阅 Agent 优化方案 v3.1.8（整合用户建议） by openclaw-ouyp*  
**版本**: v3.1.8 | **日期**: 2026-04-02 17:39 | **状态**: 待评审
