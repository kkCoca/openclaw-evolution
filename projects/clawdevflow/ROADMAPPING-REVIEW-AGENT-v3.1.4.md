# ROADMAPPING 环节审阅 Agent 详解 v3.1.4（自审阅 Agent）

**日期**: 2026-04-02 16:34  
**版本**: v3.1.4（BUG-007 修复后）  
**类型**: 自审阅 Agent（内置于 roadmapping skill）

---

## 一、审阅 Agent 概述

### 1.1 定位

**Roadmapping 自审阅 Agent** 是内置于 roadmapping skill 的质量保证机制，负责在生成 ROADMAP.md 后自动执行 10 项检查清单，确保开发计划质量。

**特点**:
- ✅ **纯自动化** - 无用户交互，自动执行检查
- ✅ **10 项检查清单** - 全面覆盖开发计划质量
- ✅ **评分决策** - 10/10 通过，8-9/10 修正，<8/10 重做
- ✅ **自动修正** - 评分 8-9/10 时自动修正
- ✅ **审阅透明** - SELF-REVIEW.md 记录审阅过程（可选）

---

### 1.2 审阅流程

```
生成 ROADMAP.md 初稿
    ↓
[步骤 1] 执行 10 项检查清单
    ↓
[步骤 2] 计算得分（0-10）
    ↓
[步骤 3] 评分决策（pass/conditional/reject）
    ↓
[步骤 4] 修正（如需要，最多 3 次）
    ↓
[步骤 5] 写入 ROADMAP.md + SELF-REVIEW.md（可选）
```

---

## 二、10 项检查清单详解

### 2.1 检查清单总览

| ID | 检查点 | 类型 | 权重 | 标准 |
|----|--------|------|------|------|
| 1 | 任务拆分 | auto | 0.10 | 职责单一，按模块和前后端拆分 |
| 2 | 工作量评估 | auto | 0.10 | 单个任务 ≤ 2 人天 |
| 3 | 收尾项 | auto | 0.10 | 联调测试（0.5 人天）+ 演示（0.5 人天） |
| 4 | 任务命名 | auto | 0.10 | 格式：`【任务简称】(前端/后端) 任务简述` |
| 5 | 描述规范 | auto | 0.10 | 只描述"做什么"，不涉及"怎么做" |
| 6 | 需求覆盖 | auto | 0.10 | 覆盖 PRD.md 所有功能 |
| 7 | 技术对齐 | auto | 0.10 | 与 TRD.md 技术选型一致 |
| 8 | 代码现状 | auto | 0.10 | 增量需求分析现有代码 |
| 9 | 风险评估 | auto | 0.10 | ≥3 项风险 |
| 10 | 不确定性标注 | auto | 0.10 | 标注原因和范围估算 |

**总分**: 10/10（100%）

---

### 2.2 检查点 1: 任务拆分

**检查内容**: 任务是否按模块和前后端拆分？

**标准**: 每个任务职责单一

**验证方法**:
```javascript
function checkTaskDecomposition(roadmapContent) {
  // 1. 检查任务是否按模块拆分
  const modules = extractModules(roadmapContent);
  if (modules.length === 0) return false;
  
  // 2. 检查任务是否按前后端拆分
  const frontendTasks = extractTasksByType(roadmapContent, '前端');
  const backendTasks = extractTasksByType(roadmapContent, '后端');
  if (frontendTasks.length === 0 || backendTasks.length === 0) return false;
  
  // 3. 检查任务职责是否单一
  for (const task of allTasks) {
    if (task.description.includes('、') && task.description.split('、').length > 3) {
      return false; // 职责过多
    }
  }
  
  return true;
}
```

**示例**:
```markdown
✅ 正确：
| 【用户认证】(后端) 实现 JWT 登录接口 | 1. 设计登录 API<br>2. 实现 JWT 生成<br>3. 实现密码验证 | 1.5 |
| 【用户认证】(前端) 登录页面开发 | 1. 设计登录表单<br>2. 实现表单验证<br>3. 对接后端 API | 1 |

❌ 错误：
| 【用户认证】实现登录、注册、权限管理、密码重置 | 1. 实现所有功能 | 5 |
```

---

### 2.3 检查点 2: 工作量评估

**检查内容**: 单个任务是否 ≤ 2 人天？

**标准**: 超过 2 人天的任务已拆分

**验证方法**:
```javascript
function checkWorkloadEstimation(roadmapContent) {
  const tasks = extractTasks(roadmapContent);
  
  for (const task of tasks) {
    if (task.workload > 2.0) {
      return false; // 有任务超过 2 人天
    }
  }
  
  return true;
}
```

**示例**:
```markdown
✅ 正确：
| 【用户管理】(后端) 用户 CRUD 接口 | 1.5 人天 |
| 【用户管理】(后端) 权限控制接口 | 1 人天 |

❌ 错误：
| 【用户管理】(后端) 用户管理 | 3 人天 |
```

---

### 2.4 检查点 3: 收尾项

**检查内容**: 是否包含联调测试和演示项？

**标准**: 每个任务都有联调测试（0.5 人天）+ 演示（0.5 人天）

**验证方法**:
```javascript
function checkClosingItems(roadmapContent) {
  // 1. 检查联调测试项
  const integrationTests = extractTasksByName(roadmapContent, '联调测试');
  if (integrationTests.length === 0) return false;
  
  // 2. 检查演示项
  const demos = extractTasksByName(roadmapContent, '演示');
  if (demos.length === 0) return false;
  
  // 3. 检查工作量
  for (const test of integrationTests) {
    if (test.workload < 0.5) return false;
  }
  for (const demo of demos) {
    if (demo.workload < 0.5) return false;
  }
  
  return true;
}
```

**示例**:
```markdown
✅ 正确：
| 【用户认证】(后端) 联调测试 | 1. 后端接口联调<br>2. 功能测试 | 0.5 |
| 【用户认证】(前端) 联调测试 | 1. 前端功能联调<br>2. 交互测试 | 0.5 |
| 【用户认证】演示 | 1. 功能演示准备<br>2. 演示环境验证 | 0.5 |

❌ 错误：
（缺少联调测试或演示项）
```

---

### 2.5 检查点 4: 任务命名

**检查内容**: 是否使用固定格式？

**标准**: `【任务简称】(前端/后端) 任务简述`

**验证方法**:
```javascript
function checkTaskNaming(roadmapContent) {
  const tasks = extractTasks(roadmapContent);
  const namingPattern = /^【.+】\(前端 | 后端\).+$/;
  
  for (const task of tasks) {
    if (!namingPattern.test(task.name)) {
      return false; // 命名格式不正确
    }
  }
  
  return true;
}
```

**示例**:
```markdown
✅ 正确：
| 【辅助审批支持发起节点】(前端) 配置态 - 发起者节点配置支持 |
| 【用户认证】(后端) 实现 JWT 登录接口 |

❌ 错误：
| 前端任务 1 |
| 实现登录功能 (后端) |
| 【用户认证】实现 JWT 登录 |
```

---

### 2.6 检查点 5: 描述规范

**检查内容**: 是否只描述"做什么"，不涉及"怎么做"？

**标准**: 不涉及"怎么做"的技术实现

**验证方法**:
```javascript
function checkDescriptionStandard(roadmapContent) {
  const tasks = extractTasks(roadmapContent);
  const technicalKeywords = ['使用', '调用', '基于', '采用', '实现'];
  
  for (const task of tasks) {
    for (const keyword of technicalKeywords) {
      if (task.description.includes(keyword)) {
        // 检查是否是技术实现描述
        if (isTechnicalImplementation(task.description)) {
          return false; // 涉及"怎么做"
        }
      }
    }
  }
  
  return true;
}
```

**示例**:
```markdown
✅ 正确（只描述"做什么"）：
- 实现用户登录功能
- 支持用户名密码验证
- 返回 JWT Token

❌ 错误（涉及"怎么做"）：
- 使用 JWT 库生成 token
- 调用 bcrypt 加密密码
- 基于 Express 框架实现 API
```

---

### 2.7 检查点 6: 需求覆盖

**检查内容**: 是否覆盖 PRD.md 中的所有功能？

**标准**: 无遗漏

**验证方法**:
```javascript
function checkRequirementCoverage(roadmapContent, prdContent) {
  // 1. 提取 PRD.md 中的所有功能需求
  const requirements = extractRequirements(prdContent);
  
  // 2. 提取 ROADMAP.md 中的所有任务
  const tasks = extractTasks(roadmapContent);
  
  // 3. 检查每条需求是否有对应任务
  for (const req of requirements) {
    let covered = false;
    for (const task of tasks) {
      if (task.description.includes(req.id) || task.description.includes(req.description)) {
        covered = true;
        break;
      }
    }
    if (!covered) return false; // 有需求未覆盖
  }
  
  return true;
}
```

**示例**:
```markdown
✅ 正确：
PRD.md 需求：
- REQ-001: 用户登录
- REQ-002: 用户注册
- REQ-003: 密码重置

ROADMAP.md 任务：
- 【用户登录】(后端) 实现 JWT 登录接口（覆盖 REQ-001）
- 【用户注册】(后端) 实现注册 API（覆盖 REQ-002）
- 【密码重置】(后端) 实现密码重置流程（覆盖 REQ-003）

❌ 错误：
ROADMAP.md 任务：
- 【用户登录】(后端) 实现 JWT 登录接口（覆盖 REQ-001）
- 【用户注册】(后端) 实现注册 API（覆盖 REQ-002）
（遗漏 REQ-003 密码重置）
```

---

### 2.8 检查点 7: 技术对齐

**检查内容**: 是否与 TRD.md 的技术选型一致？

**标准**: 无冲突

**验证方法**:
```javascript
function checkTechnicalAlignment(roadmapContent, trdContent) {
  // 1. 提取 TRD.md 中的技术选型
  const trdTechStack = extractTechStack(trdContent);
  
  // 2. 提取 ROADMAP.md 中的技术选型
  const roadmapTechStack = extractTechStack(roadmapContent);
  
  // 3. 检查是否一致
  for (const tech of roadmapTechStack) {
    if (!trdTechStack.includes(tech)) {
      return false; // 技术选型冲突
    }
  }
  
  return true;
}
```

**示例**:
```markdown
✅ 正确：
TRD.md 技术选型：
- 数据库：MySQL
- 后端：Node.js + Express
- 前端：React

ROADMAP.md 任务：
- 使用 MySQL 设计数据库表
- 基于 Node.js + Express 实现后端 API
- 使用 React 开发前端页面

❌ 错误：
ROADMAP.md 任务：
- 使用 MongoDB 设计数据库（与 TRD 冲突）
```

---

### 2.9 检查点 8: 代码现状

**检查内容**: 增量需求是否分析了现有代码？

**标准**: 增量需求必须包含代码现状章节

**验证方法**:
```javascript
function checkCodeStatus(roadmapContent, isIncremental) {
  if (!isIncremental) return true; // 全新功能跳过
  
  // 检查是否包含代码现状章节
  const hasCodeStatusSection = roadmapContent.includes('代码现状');
  if (!hasCodeStatusSection) return false;
  
  // 检查是否包含现有模块分析
  const hasModuleAnalysis = roadmapContent.includes('现有模块') || 
                            roadmapContent.includes('核心文件');
  if (!hasModuleAnalysis) return false;
  
  // 检查是否包含技术栈分析
  const hasTechStackAnalysis = roadmapContent.includes('技术栈') || 
                               roadmapContent.includes('依赖');
  if (!hasTechStackAnalysis) return false;
  
  return true;
}
```

**示例**:
```markdown
✅ 正确（增量需求）：
## 代码现状

### 项目结构
- src/controllers: 控制器层
- src/services: 服务层
- src/models: 数据模型

### 技术栈
- Node.js 22+
- Express 4.x
- MySQL 8.0

### 改动影响
- 新增 auth 模块
- 修改 user 模块

❌ 错误（增量需求）：
（无代码现状章节）
```

---

### 2.10 检查点 9: 风险评估

**检查内容**: 是否识别了主要风险？

**标准**: 至少 3 项风险

**验证方法**:
```javascript
function checkRiskAssessment(roadmapContent) {
  const risks = extractRisks(roadmapContent);
  return risks.length >= 3;
}
```

**示例**:
```markdown
✅ 正确（≥3 项风险）：
## 风险评估

| 风险项 | 可能性 | 影响 | 应对措施 |
|--------|--------|------|---------|
| DDG 反爬虫 | 中 | 高 | 添加请求延迟、合理 User-Agent |
| HTML 结构变更 | 中 | 中 | 使用稳定选择器、定期验证 |
| 网络超时 | 高 | 低 | 设置超时时间、实现重试 |

❌ 错误（<3 项风险）：
## 风险评估

| 风险项 | 可能性 | 影响 | 应对措施 |
|--------|--------|------|---------|
| 网络超时 | 高 | 低 | 设置超时时间 |
```

---

### 2.11 检查点 10: 不确定性标注

**检查内容**: 不确定的任务是否标注？

**标准**: 标注原因和范围估算

**验证方法**:
```javascript
function checkUncertaintyNotation(roadmapContent) {
  const uncertainTasks = extractUncertainTasks(roadmapContent);
  
  for (const task of uncertainTasks) {
    // 检查是否标注原因
    if (!task.description.includes('因为') && !task.description.includes('取决于')) {
      return false;
    }
    
    // 检查是否标注范围估算
    if (!task.workload.includes('~') && !task.workload.includes('-')) {
      return false;
    }
  }
  
  return true;
}
```

**示例**:
```markdown
✅ 正确：
> 注：我对 [缓存模块] 的工作量不确定，因为不确定是否需要分布式缓存支持。
> 预估 1~2 人天，取决于是否引入 Redis。

❌ 错误：
缓存模块：1 人天
（无原因说明，无范围估算）
```

---

## 三、评分决策规则

### 3.1 评分计算

```javascript
function calculateScore(checkpoints) {
  const passedCount = checkpoints.filter(c => c.passed).length;
  return passedCount; // 0-10
}
```

### 3.2 决策规则

| 得分 | 决策 | 后续动作 |
|------|------|---------|
| **10/10** | ✅ pass | 直接写入 ROADMAP.md |
| **8-9/10** | ⚠️ conditional | 修正后写入 ROADMAP.md |
| **<8/10** | ❌ reject | 重新生成（最多 3 次） |

**决策逻辑**:
```javascript
function makeDecision(score) {
  if (score === 10) {
    return 'pass';
  } else if (score >= 8) {
    return 'conditional';
  } else {
    return 'reject';
  }
}
```

---

## 四、修正机制

### 4.1 修正流程

```
评分 8-9/10（conditional）
    ↓
识别未通过项
    ↓
生成修正建议
    ↓
修正 ROADMAP.md
    ↓
重新自审阅（最多 3 次）
    ↓
评分 10/10 → 写入文件
```

### 4.2 修正示例

**示例 1: 工作量评估不通过**
```
问题：任务【用户管理】(后端) 工作量为 3 人天，超过 2 人天上限
修正：拆分为【用户管理】(后端) 用户 CRUD 接口（1.5 人天）+ 【用户管理】(后端) 权限控制接口（1 人天）
```

**示例 2: 风险评估不通过**
```
问题：风险评估只有 2 项，需要至少 3 项
修正：补充风险项"第三方 API 不稳定"，可能性：中，影响：高，应对措施：添加超时和重试机制
```

**示例 3: 任务命名不通过**
```
问题：任务命名"前端任务 1"不符合格式
修正：修改为"【用户认证】(前端) 登录页面开发"
```

---

## 五、SELF-REVIEW.md（自审阅报告）

### 5.1 生成时机

- ✅ 评分 8-9/10（conditional）时生成
- ✅ 评分 <8/10（reject）时生成
- ❌ 评分 10/10（pass）时不生成（可选）

### 5.2 报告结构

```markdown
# 自审阅报告 - {项目名称}

## 审阅元数据

| 字段 | 值 |
|------|-----|
| 审阅时间 | {YYYY-MM-DD HH:mm:ss} |
| 审阅对象 | ROADMAP.md v{版本} |
| 审阅版本 | v3.1.4 |

## 评分结果

**总分**: {X}/10

| 检查点 | 得分 | 状态 |
|--------|------|------|
| 1. 任务拆分 | ✅/❌ | 通过/不通过 |
| 2. 工作量评估 | ✅/❌ | 通过/不通过 |
| ... | ... | ... |

## 问题列表

| 检查点 | 问题描述 | 修正建议 |
|--------|---------|---------|
| 2. 工作量评估 | 任务【用户管理】工作量为 3 人天 | 拆分为两个子任务 |

## 修正历史

| 版本 | 修正内容 | 修正后得分 |
|------|---------|-----------|
| v1 | 拆分超过 2 人天的任务 | 9/10 → 10/10 |

## 审阅结论

**决策**: pass / conditional / reject
```

---

## 六、审阅 Agent 配置

### 6.1 config.yaml 配置

```yaml
stages:
  roadmapping:
    # 自审阅配置
    selfReview:
      enabled: true  # 是否启用自审阅
      checkpoints: 10  # 检查点数量
      passScore: 10  # 通过分数线
      conditionalScore: 8  # 条件通过分数线
      maxRetries: 3  # 最大修正次数
      generateReport: true  # 是否生成 SELF-REVIEW.md
```

### 6.2 检查点配置

```javascript
const checkpoints = [
  { id: 1, name: '任务拆分', enabled: true, weight: 0.10 },
  { id: 2, name: '工作量评估', enabled: true, weight: 0.10 },
  { id: 3, name: '收尾项', enabled: true, weight: 0.10 },
  { id: 4, name: '任务命名', enabled: true, weight: 0.10 },
  { id: 5, name: '描述规范', enabled: true, weight: 0.10 },
  { id: 6, name: '需求覆盖', enabled: true, weight: 0.10 },
  { id: 7, name: '技术对齐', enabled: true, weight: 0.10 },
  { id: 8, name: '代码现状', enabled: true, weight: 0.10 },
  { id: 9, name: '风险评估', enabled: true, weight: 0.10 },
  { id: 10, name: '不确定性标注', enabled: true, weight: 0.10 }
];
```

---

## 七、审阅 Agent 优势

### 7.1 与 ReviewDesignAgent 对比

| 特性 | Roadmapping 自审阅 Agent | ReviewDesignAgent |
|------|----------------------|------------------|
| **审阅对象** | ROADMAP.md | PRD.md + TRD.md |
| **检查点** | 10 项 | 7 项（D1-D7） |
| **审阅方式** | 自审阅（内置） | 独立 Agent |
| **评分规则** | 10/10 通过，8-9/10 修正，<8/10 重做 | >=90% 通过 |
| **修正机制** | 自动修正（最多 3 次） | 驳回重新执行 |
| **审阅报告** | SELF-REVIEW.md（可选） | REVIEW-REPORT.md |

### 7.2 优势

1. ✅ **纯自动化** - 无用户交互，自动执行检查
2. ✅ **10 项检查清单** - 全面覆盖开发计划质量
3. ✅ **评分决策** - 10/10 通过，8-9/10 修正，<8/10 重做
4. ✅ **自动修正** - 评分 8-9/10 时自动修正
5. ✅ **审阅透明** - SELF-REVIEW.md 记录审阅过程（可选）
6. ✅ **高效** - ~5-10 秒完成审阅
7. ✅ **灵活** - 检查点可配置

---

*ROADMAPPING 环节审阅 Agent 详解 v3.1.4（自审阅 Agent） by openclaw-ouyp*  
**版本**: v3.1.4 | **日期**: 2026-04-02 16:34 | **状态**: 完成 ✅
