# 端到端流程：用户需求 → Designing → Roadmapping

> **版本**: v1.0  
> **日期**: 2026-04-08  
> **作者**: openclaw-ouyp

---

## 流程总览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        用户需求提出阶段                                   │
│  用户提出需求 → 龙虾澄清 → 需求确认 → REQUIREMENTS.md                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         DESIGNING 阶段                                   │
│  生成 PRD/TRD → 自动审阅 (D1-D7) → PRD 确认 → TRD 确认 → approved 快照   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓ (入口门禁×2)
┌─────────────────────────────────────────────────────────────────────────┐
│                        ROADMAPPING 阶段                                  │
│  生成 ROADMAP → 自动审阅 (R1-R3) → 重试闭环 → ROADMAP.md                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 阶段 1: 用户需求提出

### 1.1 用户提出需求

**触发方式**：用户通过 QQ/Telegram/微信等渠道提出需求

**示例对话**：

```
用户：我想做一个 DDG 搜索功能，可以搜索网页并返回结果

龙虾：好的，我来帮您梳理一下需求。请问：
1. 搜索关键词从哪里来？用户输入还是固定查询？
2. 需要返回多少条结果？
3. 是否需要缓存搜索结果？
4. 有超时要求吗？
5. 需要处理哪些异常情况？
```

**关键动作**：
- ✅ 龙虾主动澄清模糊需求
- ✅ 引导用户补充约束条件
- ✅ 确认验收标准

---

### 1.2 需求澄清轮次

**典型澄清流程**：

| 轮次 | 龙虾问题 | 用户回答 | 需求细化 |
|------|---------|---------|---------|
| 1 | 搜索关键词来源？ | 用户输入 | 需要参数传递 |
| 2 | 返回结果数量？ | 默认 10 条，可配置 | 添加 count 参数 |
| 3 | 超时要求？ | 30 秒内返回 | 添加 timeout 参数 |
| 4 | 缓存需求？ | 暂时不需要 | 不实现缓存 |
| 5 | 异常情况？ | 网络错误、无结果 | 添加错误处理 |

**澄清结束标志**：
- ✅ 所有关键问题都有答案
- ✅ 约束条件明确
- ✅ 验收标准可量化

---

### 1.3 编写 REQUIREMENTS.md

**龙虾动作**：将澄清后的需求整理为 REQUIREMENTS.md

```markdown
# 需求说明 - DDG 搜索功能

## v1.0.0（2026-04-08）

### REQ-001: DDG 搜索基础功能

**描述**: 调用 DuckDuckGo API 执行搜索并返回结果

**输入**:
- query: 搜索关键词（必填）
- count: 结果数量（可选，默认 10）
- timeout: 超时时间（可选，默认 30 秒）

**输出**:
- results: 搜索结果数组
- error: 错误信息（如有）

**验收标准**:
- Given 用户输入关键词"OpenClaw"
- When 执行搜索
- Then 返回至少 5 条相关结果

---

### REQ-002: 错误处理

**描述**: 处理网络错误、超时、空结果等异常

**验收标准**:
- Given 网络超时
- When 执行搜索
- Then 返回友好错误提示，不崩溃
```

**关键要求**：
- ✅ 需求可量化（Given/When/Then）
- ✅ 约束条件明确（超时、数量等）
- ✅ 追加式记录（保留历史版本）

---

### 1.4 需求确认

**龙虾审阅检查点**：

| 检查项 | 说明 | 验证方式 |
|--------|------|---------|
| 完整性 | 所有澄清问题都有答案 | 对比澄清记录 |
| 可测试性 | 验收标准可量化 | Given/When/Then 格式 |
| 一致性 | 需求之间无冲突 | 人工审阅 |
| 可追溯性 | REQ 编号唯一 | 编号检查 |

**确认动作**：
```bash
# 龙虾确认需求完整
echo "✅ REQUIREMENTS.md v1.0.0 已确认"
```

---

## 阶段 2: Designing 阶段

### 2.1 启动 Designing

**用户动作**：调用流程引擎

```bash
/sessions_spawn clawdevflow

# 任务：DDG 搜索功能
# 场景类型：全新功能
# 需求说明：REQUIREMENTS.md
# 输出目录：/home/ouyp/Learning/Practice/openclaw-universe/projects/ddg-websearch/
```

**流程引擎动作**：
1. 读取 REQUIREMENTS.md
2. 初始化 state.json
3. 设置 stageStatus = 'auto_reviewing'
4. Spawn 子会话执行 designing

---

### 2.2 生成 PRD/TRD

**AI 工具动作**（OpenCode/Claude Code）：

```yaml
任务：根据 REQUIREMENTS.md 生成 PRD.md 和 TRD.md

输入：
- requirementsContent: REQUIREMENTS.md 完整内容
- projectPath: 项目目录

输出：
- 01_designing/PRD.md
- 01_designing/TRD.md
```

**PRD.md 结构**：
```markdown
# 产品需求文档 - DDG 搜索

## 文档元数据
- PRD 版本：v1.0.0
- 对齐 REQUIREMENTS 版本：v1.0.0
- 需求追溯矩阵：完整

## 1. 需求背景
...

## 2. 功能需求
- REQ-001 → PRD-001
- REQ-002 → PRD-002

## 3. 非功能需求
- 性能：30 秒内返回
- 可用性：99.9%

## 4. 需求追溯矩阵
| REQ-ID | PRD 章节 | 状态 |
|--------|---------|------|
| REQ-001 | 2.1 | ✅ |
| REQ-002 | 2.2 | ✅ |
```

**TRD.md 结构**：
```markdown
# 技术设计文档 - DDG 搜索

## 1. 系统架构
- 前端：Node.js CLI
- 后端：DuckDuckGo API

## 2. 接口设计
- search(query, count, timeout)

## 3. 错误处理
- 网络错误：重试 3 次
- 超时：抛出 TimeoutError

## 4. 安全设计
- 无敏感数据
- 无需认证
```

---

### 2.3 自动审阅（D1-D7）

**ReviewDesignAgentV2 执行审阅**：

| 检查点 | 类型 | 检查内容 | 关键性 |
|--------|------|---------|--------|
| D1 | Auto | 文档元数据完整 | Critical |
| D2 | Auto | 需求追溯矩阵 | Critical |
| D3 | Auto | PRD 结构完整 | Critical |
| D4 | Auto | TRD 结构完整 | Critical |
| D5 | AI | 需求覆盖度 100% | Critical |
| D6 | AI | 技术可行性 | Non-Critical |
| D7 | AI | 风险评估 | Non-Critical |

**审阅结果示例**：
```json
{
  "gates": {
    "D1": { "passed": true },
    "D2": { "passed": true },
    "D3": { "passed": true },
    "D4": { "passed": true },
    "D5": { "passed": true }
  },
  "qualityChecks": {
    "D6": { "passed": true },
    "D7": { "passed": false, "issues": ["风险评估不足"] }
  },
  "overall": {
    "score": 95,
    "recommendation": "conditional"
  }
}
```

**决策规则**：
```
Critical 项失败 → BLOCK（重试）
Non-Critical 项失败 → CLARIFY（需澄清）
全部通过 → PASS（进入 PRD 确认）
```

---

### 2.4 PRD 确认（第一次确认）

**龙虾收到审阅请求**：

```markdown
## Designing 阶段审阅请求

### 阶段产出
- PRD.md (v1.0.0)
- TRD.md (v1.0.0)

### 自动审阅结果
- D1 文档元数据 ✅
- D2 需求追溯 ✅
- D3 PRD 结构 ✅
- D4 TRD 结构 ✅
- D5 需求覆盖 ✅
- D6 技术可行 ✅
- D7 风险评估 ⚠️ (Non-Critical)

### 审阅结论
⚠️ 条件通过（Non-Critical 项 1 个失败）

### 待修复项
- D7: 风险评估不足（建议补充网络异常、API 限流等风险）

### 请确认
1. 是否通过 PRD 审阅？
2. 是否需要补充风险评估？
```

**龙虾确认动作**：
```bash
# 选项 1：通过
approvePRD({
  userId: 'openclaw-ouyp',
  requirementsHash: 'sha256:xxx',
  prdHash: 'sha256:yyy',
  notes: 'PRD 通过，风险评估后续补充'
})

# 选项 2：驳回
rejectPRD({
  userId: 'openclaw-ouyp',
  reason: '风险评估不足，需要补充',
  suggestions: ['补充网络异常风险', '补充 API 限流风险']
})
```

**状态流转**：
```
auto_reviewing → prd_confirm_pending → trd_confirm_pending
```

---

### 2.5 TRD 确认（第二次确认）

**龙虾收到审阅请求**：

```markdown
## TRD 确认请求

### 当前状态
- PRD 已确认 ✅
- TRD 待确认 ⏳

### TRD 关键内容
- 系统架构：Node.js CLI + DDG API
- 接口设计：search(query, count, timeout)
- 错误处理：重试 3 次 + TimeoutError
- 安全设计：无敏感数据

### 自动审阅结果
- 技术可行性 ✅
- 架构合理性 ✅
- 接口设计 ✅

### 请确认
1. TRD 技术选型是否合理？
2. 是否进入 Roadmapping 阶段？
```

**龙虾确认动作**：
```bash
approveTRD({
  userId: 'openclaw-ouyp',
  requirementsHash: 'sha256:xxx',
  prdHash: 'sha256:yyy',
  trdHash: 'sha256:zzz',
  notes: 'TRD 确认通过，进入 Roadmapping'
})
```

**状态流转**：
```
trd_confirm_pending → passed
```

---

### 2.6 写入 Approved 快照

**流程引擎动作**：
```javascript
this.stateManager.state.stages.designing.approved = {
  requirementsHash: 'sha256:xxx',
  prdHash: 'sha256:yyy',
  trdHash: 'sha256:zzz',
  requirementsContent: '...',  // REQUIREMENTS 完整内容
  prdContent: '...',           // PRD 完整内容
  trdContent: '...',           // TRD 完整内容
  approvedBy: 'openclaw-ouyp',
  approvedAt: '2026-04-08T10:00:00Z',
  transitionId: 'TRD_APPROVED_1712548800000'
};
```

**关键说明**：
- ✅ 方案 A：使用 state 快照（不是独立文件）
- ✅ Roadmapping 的唯一可信输入
- ✅ 包含完整内容 + 哈希 + 审批元数据
- ✅ 防止内容漂移（哈希绑定）

---

## 阶段 3: Roadmapping 入口门禁

### 3.1 门禁检查（两处）

**检查点 1: Designing 完成后**：
```javascript
// workflow-orchestrator.js:105-120
const validation = validateRoadmappingEntry(this.stateManager, state);

if (!validation.ok) {
  // 阻断并通知用户
  this.stateManager.updateStage('roadmapping', 'blocked');
  await this.notifyUser('Roadmapping 入口门禁失败', validation.details);
  break;
}
```

**检查点 2: ExecuteStage 内（防绕过）**：
```javascript
// executeStage('roadmapping') 内部
const validation = validateRoadmappingEntry(this.stateManager, state);
if (!validation.ok) {
  throw new Error(`Roadmapping 入口门禁失败：${validation.reason}`);
}
```

---

### 3.2 门禁检查项

| 检查项 | 验证方式 | 失败处理 |
|--------|---------|---------|
| Designing 已完成 | `stageStatus === 'passed'` | 阻断，通知用户 |
| Approved 快照存在 | `approved` 对象完整 | 阻断，通知用户 |
| 哈希一致性 | 比对 approved.hash 与当前内容 | 阻断，要求重新确认 |
| 内容完整性 | `approved.*Content` 非空 | 阻断，通知用户 |

**验证报告示例**：
```json
{
  "ok": true,
  "details": {
    "designingPassed": true,
    "approvedExists": true,
    "hashesMatch": true,
    "contentComplete": true
  }
}
```

---

## 阶段 4: Roadmapping 阶段

### 4.1 生成 ROADMAP.md

**AI 工具输入**（只读）：
```javascript
{
  // 从 approved 快照读取（唯一可信来源）
  requirementsContent: approved.requirementsContent,
  prdContent: approved.prdContent,
  trdContent: approved.trdContent,
  
  // 哈希（用于追溯）
  requirementsHash: approved.requirementsHash,
  prdHash: approved.prdHash,
  trdHash: approved.trdHash,
  
  // 审批元数据
  approvedBy: approved.approvedBy,
  approvedAt: approved.approvedAt,
  
  // 重试相关
  attempt: 1,
  regenerateHint: ''  // 第一次尝试为空
}
```

**AI 工具输出**：
```markdown
# 开发计划 - DDG 搜索

## 文档元数据
alignedTo: v1.0.0
requirementsHash: sha256:xxx
prdHash: sha256:yyy
trdHash: sha256:zzz
attempt: 1

## 1. 需求追溯矩阵
| REQ-ID | ROADMAP 任务 | 状态 |
|--------|-------------|------|
| REQ-001 | 任务 1: DDG API 调用 | ✅ |
| REQ-002 | 任务 2: 错误处理 | ✅ |

## 2. MVP 可交付计划
### 2.1 范围
- 任务 1: DDG API 调用（1 人天）
- 任务 2: 错误处理（0.5 人天）
- 任务 3: 联调测试（0.5 人天）

## 3. 里程碑
- Phase 1: 核心功能（任务 1+2）
- Phase 2: 测试验收（任务 3）

## 4. DoD
- 所有测试通过
- 文档完整

## 5. 依赖
- DDG API 可用

## 6. 风险
- API 限流
```

**关键要求**：
- ✅ 头部必须包含 YAML trace（哈希 + approved 元数据）
- ✅ REQ 全覆盖（Traceability）
- ✅ 结构完整（里程碑/DoD/依赖/风险）
- ✅ 不引入 PRD 未定义需求

---

### 4.2 自动审阅（R1-R3）

**ReviewRoadmapAgentV1 执行审阅**：

| 检查点 | 类型 | 检查内容 | 关键性 |
|--------|------|---------|--------|
| R1 Traceability | Auto | REQ 全覆盖 | Critical |
| R2 Structure | Auto | 里程碑/DoD/依赖/风险 | Critical |
| R3 Scope | AI | 禁止引入 PRD 未定义需求 | Critical |

**R1: Traceability 检查**：
```javascript
// 提取 REQUIREMENTS 中的所有 REQ ID（兼容 5 种格式）
const reqPatterns = [
  /### (REQ-\d+):/g,
  /## (REQ-\d+):/g,
  /### (REQ-\d+)\s/g,
  /## (REQ-\d+)\s/g,
  /REQ-\d+/g
];

// 检查每个 REQ 是否在 ROADMAP 中有对应 item
const uncoveredReqs = reqIds.filter(id => !roadmapContent.includes(id));
if (uncoveredReqs.length > 0) {
  return { passed: false, uncoveredReqs };
}
```

**R2: Structure 检查**：
```javascript
const requiredSections = [
  { id: 'milestone', keywords: ['里程碑', 'Milestone', 'Phase'] },
  { id: 'dod', keywords: ['DoD', 'Definition of Done'] },
  { id: 'dependencies', keywords: ['依赖', 'Dependencies'] },
  { id: 'risks', keywords: ['风险', 'Risks'] }
];

const missingSections = requiredSections.filter(s => 
  !s.keywords.some(keyword => roadmapContent.includes(keyword))
);
if (missingSections.length > 0) {
  return { passed: false, missingSections };
}
```

**R3: Scope 检查**：
```javascript
const prdReqIds = new Set();  // 从 PRD 提取
const roadmapReqIds = new Set();  // 从 ROADMAP 提取
const newReqs = [...roadmapReqIds].filter(id => !prdReqIds.has(id));

if (newReqs.length > 0) {
  return { passed: false, newReqs };  // 范围膨胀
}
```

**审阅结果示例**：
```json
{
  "gates": {
    "traceability": { "passed": true, "coverage": "100%" },
    "structure": { "passed": false, "missingSections": ["risks"] }
  },
  "qualityChecks": {
    "scope": { "passed": true }
  },
  "overall": {
    "score": 0,
    "recommendation": "reject"
  }
}
```

---

### 4.3 处理审阅结果

**失败处理**：
```javascript
if (!reviewResult.gates.structure?.passed) {
  blockingIssues.push({
    id: 'STRUCTURE_FAILED',
    severity: 'blocker',
    message: '结构完整性检查失败',
    missingSections: ['risks'],
    regenerateHint: '请在 ROADMAP.md 中添加 风险 章节'
  });
}

// 写回 lastRegenerateHint，retryCount++
this.stateManager.state.stages.roadmapping.lastRegenerateHint = 
  '【强制修复】STRUCTURE_FAILED: 结构完整性检查失败\n请在 ROADMAP.md 中添加 风险 章节';
this.stateManager.state.stages.roadmapping.retryCount = 1;
this.stateManager.save();

return ReviewDecision.REJECT;
```

**成功处理**：
```javascript
// 所有检查通过（v3.5.0 修复：清理重试痕迹）
this.stateManager.state.stages.roadmapping.lastRegenerateHint = '';
this.stateManager.state.stages.roadmapping.retryCount = 0;
this.stateManager.state.stages.roadmapping.attempt = 1;
this.stateManager.save();

return ReviewDecision.PASS;
```

---

### 4.4 可收敛重试闭环

```
生成 ROADMAP.md (attempt=1)
  ↓
自动审阅 (R1/R2/R3)
  ↓
审阅通过？─── 否 → 生成 blockingIssues
  ↓                    ↓
 是                  写回 lastRegenerateHint
  ↓                    ↓
清理重试痕迹          retryCount++ (1)
  ↓                    ↓
PASS                保存 state
                      ↓
                    下一轮注入 hint
                      ↓
                    生成 ROADMAP.md (attempt=2)
                      ↓
                    自动审阅
                      ↓
                    审阅通过？→ PASS
```

**重试限制**：
- 最大重试次数：3 次
- 达到限制后：升级到 `blocked`，通知用户介入

---

## 端到端检查清单

### 需求提出阶段

- [ ] 用户需求清晰无歧义
- [ ] 所有约束条件明确
- [ ] 验收标准可量化（Given/When/Then）
- [ ] REQUIREMENTS.md 追加式记录
- [ ] 需求编号唯一（REQ-001, REQ-002...）

---

### Designing 阶段

- [ ] PRD.md 包含文档元数据（版本、哈希）
- [ ] PRD.md 包含需求追溯矩阵
- [ ] TRD.md 包含系统架构、接口设计
- [ ] 自动审阅 D1-D7 全部通过
- [ ] PRD 确认（第一次签字）
- [ ] TRD 确认（第二次签字）
- [ ] Approved 快照写入 state.json
- [ ] 哈希绑定（防止内容漂移）

---

### Roadmapping 入口门禁

- [ ] Designing stageStatus === 'passed'
- [ ] Approved 快照存在且完整
- [ ] 哈希一致性验证通过
- [ ] 内容完整性验证通过
- [ ] 两处门禁检查（连接处 + ExecuteStage 内）

---

### Roadmapping 阶段

- [ ] ROADMAP.md 头部包含 YAML trace
- [ ] REQ 全覆盖（R1 Traceability）
- [ ] 结构完整（R2 Structure：里程碑/DoD/依赖/风险）
- [ ] 不引入 PRD 未定义需求（R3 Scope）
- [ ] 空内容判空（v3.5.0 修复）
- [ ] 需求提取规则增强（v3.5.0 修复）
- [ ] 重试闭环可收敛
- [ ] PASS 时清理重试痕迹（v3.5.0 修复）

---

## 常见问题

### Q1: 需求澄清需要多少轮？

**答案**：通常 3-5 轮，取决于需求复杂度。

**建议**：
- 第一轮：明确核心功能
- 第二轮：明确约束条件
- 第三轮：明确验收标准
- 第四轮：确认边界情况
- 第五轮：最终确认

---

### Q2: Designing 阶段卡住怎么办？

**检查状态**：
```bash
cat state.json | jq '.stages.designing.stageStatus'
```

**可能状态**：
- `prd_confirm_pending` → 等待 PRD 确认
- `trd_confirm_pending` → 等待 TRD 确认
- `blocked` → 重试耗尽，需要用户介入

**解决方案**：
- 等待确认 → 调用 `approvePRD()` 或 `approveTRD()`
- 已阻断 → 查看 `lastBlockingIssues`，手动修复后重置状态

---

### Q3: Roadmapping 重试耗尽怎么办？

**检查日志**：
```bash
cat state.json | jq '.stages.roadmapping'
```

**可能原因**：
- R1 失败：REQUIREMENTS 格式不兼容
- R2 失败：ROADMAP 缺少必需章节
- R3 失败：引入了 PRD 未定义的需求

**解决方案**：
1. 查看 `lastBlockingIssues` 了解失败原因
2. 手动修复 ROADMAP.md
3. 重置 `retryCount=0` 并继续

---

### Q4: 如何验证 Approved 快照？

**检查命令**：
```bash
cat state.json | jq '.stages.designing.approved'
```

**期望输出**：
```json
{
  "requirementsHash": "sha256:xxx",
  "prdHash": "sha256:yyy",
  "trdHash": "sha256:zzz",
  "requirementsContent": "...",
  "prdContent": "...",
  "trdContent": "...",
  "approvedBy": "openclaw-ouyp",
  "approvedAt": "2026-04-08T10:00:00Z",
  "transitionId": "TRD_APPROVED_1712548800000"
}
```

---

### Q5: 如何验证入口门禁？

**手动触发检查**：
```javascript
const { validateRoadmappingEntry } = require('./utils/validate-roadmapping-entry');
const validation = validateRoadmappingEntry(stateManager, state);
console.log(validation);
```

**期望输出**：
```json
{
  "ok": true,
  "details": {
    "designingPassed": true,
    "approvedExists": true,
    "hashesMatch": true,
    "contentComplete": true
  }
}
```

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-04-08 | 初始版本，整理端到端完整流程 |
| v3.5.0 | 2026-04-08 | Roadmapping 待办建议修复（空内容判空/需求提取增强/集成测试） |

---

## 参考文档

- `REQUIREMENTS.md` - 需求说明（openclaw-ouyp 提供）
- `01_designing/PRD.md` - 产品需求文档（AI 生成）
- `01_designing/TRD.md` - 技术设计文档（AI 生成）
- `02_roadmapping/ROADMAP.md` - 开发计划（AI 生成）
- `DESIGNING-TO-ROADMAPPING-FLOW.md` - Designing→Roadmapping 环节流程
- `workflow-orchestrator.js` - 流程编排器（核心代码）
- `review-roadmap-v1.js` - Roadmap 审阅 Agent

---

*本文档由 openclaw-ouyp 维护*  
**版本**: v1.0 | **状态**: 稳定 ✅
