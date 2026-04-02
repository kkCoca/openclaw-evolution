# ROADMAPPING 审阅 Agent 规则评估 v3.1.5

**日期**: 2026-04-02 16:41  
**版本**: v3.1.5（新规则评估）  
**类型**: 审阅规则对比评估

---

## 一、新规则总览

### 1.1 审阅目标

| 目标 | 说明 | 对应规则 |
|------|------|---------|
| **Freshness** | 对齐最新需求 | R0 |
| **Traceability** | 能追溯到 PRD/需求 | R1 |
| **Deliverability** | 具备可交付性 | R2, R3, R4 |

### 1.2 新规则清单

| ID | 检查点 | 类型 | 关键性 | 现状 |
|----|--------|------|--------|------|
| R0 | Freshness 对齐 | auto | critical | ❌ 缺失 |
| R1 | Traceability（需求引用） | auto | critical | ⚠️ 部分覆盖（检查点 6） |
| R2 | MVP 可交付性 | auto | critical | ❌ 缺失 |
| R3 | 依赖与风险 | auto | critical | ⚠️ 部分覆盖（检查点 9） |
| R4 | 范围膨胀风险 | auto | non-critical | ❌ 缺失 |

---

## 二、现有 10 项检查清单对比

### 2.1 现有检查点

| ID | 检查点 | 类型 | 关键性 | 覆盖新规则 |
|----|--------|------|--------|----------|
| 1 | 任务拆分 | auto | normal | - |
| 2 | 工作量评估 | auto | normal | - |
| 3 | 收尾项 | auto | normal | - |
| 4 | 任务命名 | auto | normal | - |
| 5 | 描述规范 | auto | normal | - |
| 6 | 需求覆盖 | auto | normal | ⚠️ R1（部分） |
| 7 | 技术对齐 | auto | normal | - |
| 8 | 代码现状 | auto | normal | - |
| 9 | 风险评估 | auto | normal | ⚠️ R3（部分） |
| 10 | 不确定性标注 | auto | normal | ⚠️ R4（部分） |

### 2.2 覆盖分析

| 新规则 | 现有检查点 | 覆盖度 | 差距 |
|--------|-----------|--------|------|
| R0 Freshness | 无 | 0% | ❌ 完全缺失 |
| R1 Traceability | 检查点 6（需求覆盖） | 50% | ⚠️ 只检查覆盖，不检查显式引用 |
| R2 MVP 可交付性 | 无 | 0% | ❌ 完全缺失 |
| R3 依赖与风险 | 检查点 9（风险评估） | 50% | ⚠️ 只检查风险数量，不检查依赖 |
| R4 范围膨胀 | 检查点 10（不确定性标注） | 30% | ⚠️ 只标注不确定性，不检测范围膨胀 |

---

## 三、新规则详细评估

### 3.1 R0: Freshness 对齐

**规则**: ROADMAP.md 必须包含 `alignedTo + requirementsHash`，并且与 REQUIREMENTS 最新一致

**验证方法**:
```javascript
function checkFreshness(roadmapContent, requirementsMeta) {
  // 1. 检查是否包含 alignedTo 字段
  const hasAlignedTo = roadmapContent.includes('alignedTo') || 
                       roadmapContent.includes('对齐需求版本');
  
  // 2. 检查是否包含 requirementsHash 字段
  const hasRequirementsHash = roadmapContent.includes('requirementsHash') || 
                              roadmapContent.includes('需求哈希');
  
  // 3. 提取 ROADMAP 中的版本/哈希
  const roadmapVersion = extractVersion(roadmapContent);
  const roadmapHash = extractHash(roadmapContent);
  
  // 4. 比对是否一致
  const versionMatch = roadmapVersion === requirementsMeta.version;
  const hashMatch = roadmapHash === requirementsMeta.hash;
  
  return {
    passed: hasAlignedTo && hasRequirementsHash && versionMatch && hashMatch,
    expected: {
      version: requirementsMeta.version,
      hash: requirementsMeta.hash
    },
    found: {
      version: roadmapVersion || '缺失',
      hash: roadmapHash || '缺失'
    }
  };
}
```

**示例**:
```markdown
✅ 正确：
## 文档元数据

| 字段 | 值 |
|------|-----|
| alignedTo | v3.1.4 |
| requirementsHash | sha256:f0e44912... |

❌ 错误：
（无 alignedTo 和 requirementsHash 字段）
```

**评估**: ✅ **强烈建议添加**
- **优势**: 根治"文档不更新到最新"的问题
- **实现难度**: 低（只需检查字段存在性和一致性）
- **关键性**: critical（必须在 roadmapping 环节拦截）

---

### 3.2 R1: Traceability（需求引用）

**规则**: ROADMAP 必须显式引用需求 ID（例如 REQ-001 或 R1）

**实现策略**:

#### 策略 A: 每个任务必须出现 REQ 标记（推荐）

```javascript
function checkTraceability_StrategyA(roadmapContent) {
  const tasks = extractTasks(roadmapContent);
  
  for (const task of tasks) {
    // 检查任务描述是否包含 REQ 标记
    const hasReqMarker = /REQ-\d+|R\d+/.test(task.description);
    if (!hasReqMarker) {
      return {
        passed: false,
        missing: task.name
      };
    }
  }
  
  return { passed: true };
}
```

**示例**:
```markdown
✅ 正确（每个任务都有 REQ 标记）：
| 【用户认证】(后端) 实现 JWT 登录接口 | REQ-001 | 1.5 人天 |
| 【用户注册】(后端) 实现注册 API | REQ-002 | 1 人天 |

❌ 错误（任务无 REQ 标记）：
| 【用户认证】(后端) 实现 JWT 登录接口 | 1.5 人天 |
```

#### 策略 B: 需求覆盖率 100%（MVP 建议）

```javascript
function checkTraceability_StrategyB(roadmapContent, requirementsContent) {
  // 1. 从 REQUIREMENTS 抽取所有需求 ID
  const requirementIds = extractRequirementIds(requirementsContent);
  // ['REQ-001', 'REQ-002', ..., 'REQ-010']
  
  // 2. 在 ROADMAP 全文查找这些 ID
  const coveredIds = [];
  const missingIds = [];
  
  for (const reqId of requirementIds) {
    if (roadmapContent.includes(reqId)) {
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
ROADMAP 中包含：REQ-001, REQ-002, REQ-003, ..., REQ-010

❌ 错误（覆盖率不足）：
ROADMAP 中包含：REQ-001, REQ-002, REQ-003
缺失：REQ-004, REQ-005, ..., REQ-010
```

**评估**: ✅ **强烈建议添加**
- **策略 A 优势**: 每个任务都可追溯，质量更高
- **策略 B 优势**: 实现简单，适合 MVP
- **建议**: 先实现策略 B（覆盖率 100%），后续升级到策略 A

---

### 3.3 R2: MVP 可交付性

**规则**: 必须存在一个明确的"MVP/Phase 1/里程碑 1"段落，并且该段落有：
- scope（做什么）
- exit criteria / 验收点（怎么验收）
- 预计工作量（哪怕粗略）

**验证方法**:
```javascript
function checkMVPDeliverability(roadmapContent) {
  // 1. 检查是否存在 MVP/Phase 1/里程碑 1 段落
  const mvpKeywords = ['MVP', 'Phase 1', '里程碑 1', '第一阶段', '首期'];
  const hasMVPSection = mvpKeywords.some(k => roadmapContent.includes(k));
  
  if (!hasMVPSection) {
    return {
      passed: false,
      reason: '缺少 MVP/Phase 1/里程碑 1 段落'
    };
  }
  
  // 2. 提取 MVP 段落
  const mvpSection = extractMVPSection(roadmapContent);
  
  // 3. 检查是否包含 scope
  const hasScope = /scope|范围|做什么/i.test(mvpSection);
  
  // 4. 检查是否包含 exit criteria/验收点
  const hasExitCriteria = /exit criteria|验收|验收点|完成标准/i.test(mvpSection);
  
  // 5. 检查是否包含预计工作量
  const hasWorkload = /工作量|人天|人周|预计/i.test(mvpSection);
  
  return {
    passed: hasScope && hasExitCriteria && hasWorkload,
    missing: {
      scope: !hasScope,
      exitCriteria: !hasExitCriteria,
      workload: !hasWorkload
    }
  };
}
```

**示例**:
```markdown
✅ 正确：
## MVP / Phase 1 / 里程碑 1

### Scope（范围）
- 实现用户登录功能（REQ-001）
- 实现用户注册功能（REQ-002）

### Exit Criteria（验收点）
- 用户可以成功登录
- 用户可以成功注册
- 所有单元测试通过

### 预计工作量
- 后端：3 人天
- 前端：2 人天
- 测试：1 人天
- 合计：6 人天

❌ 错误：
（无 MVP/Phase 1/里程碑 1 段落）

❌ 错误：
## MVP / Phase 1
- 实现用户登录和注册
（缺少验收点和工作量）
```

**评估**: ✅ **强烈建议添加**
- **优势**: 确保 ROADMAP 具备可交付性，不是空泛计划
- **实现难度**: 中（需要结构检查）
- **关键性**: critical（MVP 是交付的核心）

---

### 3.4 R3: 依赖与风险

**规则**: ROADMAP 必须有 Dependencies/Risks 段落（或中文"依赖/风险"）

**验证方法**:
```javascript
function checkDependenciesAndRisks(roadmapContent) {
  // 1. 检查是否包含 Dependencies/Risks 段落
  const dependencyKeywords = ['Dependencies', '依赖', '前置条件'];
  const riskKeywords = ['Risks', '风险', '风险项'];
  
  const hasDependencySection = dependencyKeywords.some(k => roadmapContent.includes(k));
  const hasRiskSection = riskKeywords.some(k => roadmapContent.includes(k));
  
  // 2. 提取依赖和风险列表
  const dependencies = extractDependencies(roadmapContent);
  const risks = extractRisks(roadmapContent);
  
  return {
    passed: hasDependencySection && hasRiskSection && risks.length >= 3,
    missing: {
      dependencySection: !hasDependencySection,
      riskSection: !hasRiskSection,
      risks: risks.length < 3
    },
    found: {
      dependencies: dependencies.length,
      risks: risks.length
    }
  };
}
```

**示例**:
```markdown
✅ 正确：
## 依赖（Dependencies）
- 需要运维团队提供测试环境
- 需要第三方 API 密钥

## 风险（Risks）
| 风险项 | 可能性 | 影响 | 应对措施 |
|--------|--------|------|---------|
| DDG 反爬虫 | 中 | 高 | 添加请求延迟 |
| HTML 结构变更 | 中 | 中 | 使用稳定选择器 |
| 网络超时 | 高 | 低 | 设置超时时间 |

❌ 错误：
（无依赖/风险段落）

❌ 错误：
## 风险
| 风险项 | 可能性 | 影响 |
|--------|--------|------|
| 网络超时 | 高 | 低 |
（只有 1 项风险，需要至少 3 项）
```

**评估**: ✅ **建议添加**
- **优势**: 补充现有检查点 9（只检查风险数量，不检查依赖）
- **实现难度**: 低（结构检查）
- **关键性**: critical（依赖和风险是项目成功的关键）

---

### 3.5 R4: 范围膨胀风险

**规则**: 如果发现大量"可能/可选/未来/后续再说"，给出 warning（不阻断）

**验证方法**:
```javascript
function checkScopeCreep(roadmapContent) {
  // 1. 定义范围膨胀关键词
  const scopeCreepKeywords = [
    '可能', '或许', '大概',
    '可选', '可选择',
    '未来', '将来', '以后',
    '后续再说', '以后再说', '暂不实现',
    'TODO', 'FIXME', 'TBD'
  ];
  
  // 2. 统计出现次数
  let count = 0;
  for (const keyword of scopeCreepKeywords) {
    const regex = new RegExp(keyword, 'g');
    const matches = roadmapContent.match(regex);
    if (matches) {
      count += matches.length;
    }
  }
  
  // 3. 判断是否大量出现
  const isWarning = count >= 5; // 阈值可配置
  
  return {
    passed: !isWarning, // non-critical，不阻断
    warning: isWarning,
    count: count,
    keywords: scopeCreepKeywords
  };
}
```

**示例**:
```markdown
⚠️ Warning（范围膨胀风险）：
- 未来可能支持多语言
- 可选的短信通知功能
- 后续再说的数据分析模块
- 暂不实现的第三方集成
- TODO: 性能优化

（共 5 处范围膨胀关键词，给出 warning）

✅ 正确（无范围膨胀风险）：
- 实现用户登录功能
- 实现用户注册功能
- 实现密码重置功能

（无范围膨胀关键词）
```

**评估**: ⚠️ **建议添加（non-critical）**
- **优势**: 提前预警范围膨胀风险
- **实现难度**: 低（关键词匹配）
- **关键性**: non-critical（只 warning，不阻断）

---

## 四、综合评估

### 4.1 规则对比总表

| 规则 | 关键性 | 现状 | 建议 | 优先级 |
|------|--------|------|------|--------|
| R0 Freshness | critical | ❌ 缺失 | ✅ 添加 | P0 |
| R1 Traceability | critical | ⚠️ 部分覆盖 | ✅ 增强 | P0 |
| R2 MVP 可交付性 | critical | ❌ 缺失 | ✅ 添加 | P0 |
| R3 依赖与风险 | critical | ⚠️ 部分覆盖 | ✅ 增强 | P0 |
| R4 范围膨胀 | non-critical | ❌ 缺失 | ✅ 添加 | P1 |
| 检查点 1-5 | normal | ✅ 已有 | ✅ 保留 | P2 |
| 检查点 7-8 | normal | ✅ 已有 | ✅ 保留 | P2 |
| 检查点 10 | normal | ⚠️ 部分覆盖 | ⚠️ 合并到 R4 | P2 |

### 4.2 建议的检查清单（v3.1.5）

| ID | 检查点 | 类型 | 关键性 | 来源 |
|----|--------|------|--------|------|
| **R0** | **Freshness 对齐** | auto | **critical** | **新增** |
| **R1** | **Traceability（需求引用）** | auto | **critical** | **增强检查点 6** |
| **R2** | **MVP 可交付性** | auto | **critical** | **新增** |
| **R3** | **依赖与风险** | auto | **critical** | **增强检查点 9** |
| R4 | 范围膨胀风险 | auto | non-critical | 新增 |
| 1 | 任务拆分 | auto | normal | 保留 |
| 2 | 工作量评估 | auto | normal | 保留 |
| 3 | 收尾项 | auto | normal | 保留 |
| 4 | 任务命名 | auto | normal | 保留 |
| 5 | 描述规范 | auto | normal | 保留 |
| 7 | 技术对齐 | auto | normal | 保留 |
| 8 | 代码现状 | auto | normal | 保留 |

**总计**: 12 项检查点（4 项 critical + 1 项 non-critical + 7 项 normal）

### 4.3 评分决策规则调整

**现有规则**:
```
10/10 → pass
8-9/10 → conditional
<8/10 → reject
```

**建议规则（v3.1.5）**:
```
所有 critical 项通过 + 总分 >= 90% → pass
所有 critical 项通过 + 总分 70-89% → conditional
任一 critical 项失败 → reject
```

**理由**:
- critical 项（R0-R3）是质量底线，必须全部通过
- normal 项可以有一定容错空间
- non-critical 项（R4）只 warning，不影响决策

---

## 五、实施建议

### 5.1 优先级排序

| 优先级 | 规则 | 理由 | 预计时间 |
|--------|------|------|---------|
| **P0** | R0 Freshness | 根治"文档不更新到最新"的问题 | 1 小时 |
| **P0** | R1 Traceability | 确保需求可追溯 | 2 小时 |
| **P0** | R2 MVP 可交付性 | 确保 ROADMAP 具备可交付性 | 2 小时 |
| **P0** | R3 依赖与风险 | 补充现有检查点 9 | 1 小时 |
| **P1** | R4 范围膨胀 | 提前预警范围膨胀风险 | 1 小时 |
| **P2** | 检查点 1-5, 7-8 | 保留现有检查点 | 0 小时 |

### 5.2 实施步骤

**阶段 1: 添加 critical 规则（P0, 6 小时）**
1. 实现 R0 Freshness 检查
2. 实现 R1 Traceability 检查（策略 B: 覆盖率 100%）
3. 实现 R2 MVP 可交付性检查
4. 实现 R3 依赖与风险检查
5. 更新评分决策规则
6. 测试验证

**阶段 2: 添加 non-critical 规则（P1, 1 小时）**
1. 实现 R4 范围膨胀检查
2. 更新 warning 机制
3. 测试验证

**阶段 3: 优化和文档（P2, 2 小时）**
1. 更新 SKILL.md 文档
2. 更新示例文件
3. 更新测试用例

---

## 六、总结

### 6.1 评估结论

✅ **强烈建议采纳新规则**

**理由**:
1. **R0 Freshness** 是根治"文档不更新到最新"的关键
2. **R1 Traceability** 确保需求可追溯，比现有检查点 6 更严格
3. **R2 MVP 可交付性** 确保 ROADMAP 不是空泛计划
4. **R3 依赖与风险** 补充现有检查点 9 的不足
5. **R4 范围膨胀** 提前预警范围膨胀风险

### 6.2 与现有检查清单的关系

| 关系 | 说明 |
|------|------|
| **替代** | R1 替代检查点 6，R3 替代检查点 9 |
| **增强** | R0/R2 是新增 critical 规则 |
| **补充** | R4 补充检查点 10（不确定性标注） |
| **保留** | 检查点 1-5, 7-8 保留 |

### 6.3 预期效果

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 文档更新及时性 | 低（经常不更新） | 高（R0 强制对齐） | 显著提升 |
| 需求可追溯性 | 中（只检查覆盖） | 高（显式引用） | 显著提升 |
| ROADMAP 可交付性 | 低（空泛计划） | 高（MVP 明确） | 显著提升 |
| 依赖与风险管理 | 中（只检查风险数量） | 高（依赖 + 风险） | 显著提升 |
| 范围膨胀预警 | 无 | 有（R4 warning） | 新增 |

---

*ROADMAPPING 审阅 Agent 规则评估 v3.1.5 by openclaw-ouyp*  
**版本**: v3.1.5 | **日期**: 2026-04-02 16:41 | **状态**: 完成 ✅
