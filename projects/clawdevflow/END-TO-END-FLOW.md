# ClawDevFlow 端到端完整流程

**日期**: 2026-04-02  
**版本**: v3.0.1  
**场景**: 从用户需求提出到 clawdevflow 执行完成

---

## 一、流程总览

```
┌─────────────────────────────────────────────────────────────────────────┐
│  阶段 0: 用户需求提出                                                    │
│  (用户 → openclaw-ouyp)                                                 │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  阶段 1: 需求整理与确认                                                 │
│  (openclaw-ouyp 整理需求，创建 REQUIREMENTS.md)                          │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  阶段 2: 调用 clawdevflow                                               │
│  (/sessions_spawn clawdevflow)                                          │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  阶段 3: 流程引擎执行                                                    │
│  (workflow-executor.js → workflow-orchestrator.js)                      │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ↓                    ↓                    ↓
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  阶段 3.1:       │ │  阶段 3.2:       │ │  阶段 3.3:       │
│  DESIGNING       │ │  ROADMAPPING     │ │  DETAILING       │
│  (产品设计)       │ │  (开发计划)       │ │  (详细设计)       │
└──────────────────┘ └──────────────────┘ └──────────────────┘
        │                    │                    │
        ↓                    ↓                    ↓
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  阶段 3.4:       │ │  阶段 3.5:       │ │  阶段 3.6:       │
│  CODING          │ │  TESTING         │ │  REVIEWING       │
│  (代码实现)       │ │  (测试)           │ │  (验收)           │
└──────────────────┘ └──────────────────┘ └──────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  阶段 4: 用户验收                                                        │
│  (openclaw-ouyp 审阅产出，确认通过)                                      │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  阶段 5: Git 提交与部署                                                  │
│  (git add/commit/push, 部署上线)                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 二、阶段 0: 用户需求提出

### 2.1 场景示例

**用户**：openclaw-ouyp  
**渠道**：QQ Bot / Telegram / 直接对话  
**内容**：功能需求描述

### 2.2 示例需求

```
用户：我要给 clawdevflow 增加一个功能

需求描述：
我想优化 Roadmap Agent，让它从交互式改为纯自动化模式，
并且增加自审阅功能。具体要求：

1. 移除所有用户交互步骤
2. 生成 ROADMAP.md 后自动执行 10 项检查
3. 评分 8-9 分自动修正，<8 分重新生成
4. 生成 SELF-REVIEW.md 记录审阅过程

这个需求怎么实现？
```

### 2.3 关键信息

| 信息项 | 说明 |
|--------|------|
| **提出者** | openclaw-ouyp |
| **接收者** | AI 助手 |
| **需求类型** | 增量需求 / 全新功能 / 问题修复 |
| **优先级** | P0/P1/P2/P3 |
| **期望时间** | 即时 / 本周 / 本月 |

---

## 三、阶段 1: 需求整理与确认

### 3.1 AI 助手响应

```
AI 助手：好的，我理解你的需求了。让我整理一下：

**需求类型**: 增量需求（在现有 clawdevflow 基础上优化）

**需求目标**:
1. Roadmap Agent 纯自动化改造
2. 增加自审阅 Agent（10 项检查清单）
3. 自动修正机制
4. 审阅报告生成

**影响范围**:
- bundled-skills/roadmapping/SKILL.md
- adapters/opencode.js
- cdf-orchestrator/stage-executor.js
- 新增 CHECKLIST.md 和示例文件

**版本升级**: v2.0.1 → v2.1.0

我理解得对吗？如果确认，我将：
1. 追加需求到 REQUIREMENTS.md
2. 调用 clawdevflow 执行研发流程
```

### 3.2 用户确认

```
用户：对的，开始吧
```

### 3.3 需求整理（AI 助手执行）

**文件**: `projects/clawdevflow/REQUIREMENTS.md`

```bash
# 追加需求到 REQUIREMENTS.md
cat >> REQUIREMENTS.md << 'EOF'

---

## v2.1.0 增量需求说明 - Roadmap Agent 优化

**Issue ID**: FEATURE-003  
**需求类型**: 增量需求  
**版本升级**: v2.0.1 → v2.1.0

### 需求目标
| 目标 | 说明 | 验收标准 |
|------|------|---------|
| 纯自动化 | 移除所有用户交互 | roadmapping 阶段无用户交互 |
| 自审阅 | 增加 AI 自审阅 Agent | 生成后自动执行 10 项检查清单 |
| 自动修正 | 小问题自动修正 | 评分 8-9/10 时自动修正后输出 |
| 审阅透明 | 记录审阅过程 | 生成 SELF-REVIEW.md |
| 文档标准化 | 完善技能文档 | SKILL.md 包含完整执行流程 |

### 功能需求
1. 移除交互步骤
2. 自动阅读文档（PRD.md + TRD.md）
3. 自动分析代码（增量需求）
4. 自审阅 Agent（10 项检查清单）
5. 评分决策（10/10 通过、8-9/10 修正、<8/10 重做）
6. 修正机制（最多 3 次）
7. 审阅报告（SELF-REVIEW.md）
8. 文档完善（SKILL.md、CHECKLIST.md、示例）

### 验收标准
- Given Git 分支已创建
- When 审阅修改后的文件
- Then SKILL.md 包含自审阅流程
- Then CHECKLIST.md 包含 10 项检查说明
- Then opencode.js 任务描述包含检查清单
- Then stage-executor.js 修复 bug
- Then workflow-orchestrator.js 添加输入
- Then 示例文件完整

### 版本历史
| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v2.0.1 | 2026-03-30 | BUG-002 修复 |
| v2.1.0 | 2026-04-02 | FEATURE-003: Roadmap Agent 优化 |
EOF
```

### 3.4 输出产物

| 文件 | 位置 | 说明 |
|------|------|------|
| `REQUIREMENTS.md` | `projects/clawdevflow/` | 追加 v2.1.0 需求 |

---

## 四、阶段 2: 调用 clawdevflow

### 4.1 调用命令

```bash
/sessions_spawn clawdevflow

# 任务：Roadmap Agent 优化 v2.1.0
# 场景类型：增量需求
# 需求说明：REQUIREMENTS.md
# 原有项目：/home/ouyp/Learning/Practice/openclaw-universe/projects/clawdevflow/
# 约束条件：
# - 保持与现有流程引擎的接口一致
# - 审阅机制不改变（流程引擎统一审阅）
# - 输出目录结构不变
# 验收标准：
# - Given REQUIREMENTS.md 已追加 v2.1.0 需求
# - When 审阅所有修改的文件
# - Then SKILL.md 包含自审阅流程（步骤 4-5）
# - Then CHECKLIST.md 包含 10 项检查说明
# - Then opencode.js 任务描述包含检查清单
# - Then stage-executor.js 修复 designingPath 未定义
# - Then workflow-orchestrator.js 添加 designingPath 输入
# - Then 示例文件完整（ROADMAP-example.md、SELF-REVIEW-example.md）
# 输出目录：/home/ouyp/Learning/Practice/openclaw-universe/projects/clawdevflow/
```

### 4.2 任务参数解析

**解析结果**：
```javascript
const workflowConfig = {
  workflowId: 'wf-20260402-003',
  scenario: '增量需求',
  projectPath: '/home/ouyp/Learning/Practice/openclaw-universe/projects/clawdevflow/',
  requirementsFile: 'REQUIREMENTS.md',
  constraints: [
    '保持与现有流程引擎的接口一致',
    '审阅机制不改变',
    '输出目录结构不变'
  ],
  acceptanceCriteria: [
    'SKILL.md 包含自审阅流程',
    'CHECKLIST.md 包含 10 项检查说明',
    // ...
  ]
};
```

### 4.3 输出产物

| 文件 | 位置 | 说明 |
|------|------|------|
| `state.json` | `projects/clawdevflow/.cdf/state.json` | 工作流状态 |

---

## 五、阶段 3: 流程引擎执行

### 5.1 阶段 3.0: 初始化

**文件**: `workflow-executor.js`

```
╔═══════════════════════════════════════════════════════════╗
║   ClawDevFlow (CDF) - 爪刃研发流                           ║
║   AI 辅助研发流程编排引擎 v3.0.1                            ║
╚═══════════════════════════════════════════════════════════╝

[CDF] 步骤 1/3: 加载配置文件...
[CDF] ✅ 配置加载完成
[CDF]   默认 AI 工具：opencode
[CDF]   工作区根目录：/home/ouyp/Learning/Practice/openclaw-universe

[CDF] 步骤 2/3: 解析任务参数...
[CDF] ✅ 任务解析完成
[CDF]   工作流 ID: wf-20260402-003
[CDF]   场景类型：增量需求
[CDF]   项目路径：/home/ouyp/Learning/Practice/openclaw-universe/projects/clawdevflow/
[CDF]   需求文件：REQUIREMENTS.md

[CDF] 步骤 3/3: 执行流程编排...
```

### 5.2 阶段 3.1: DESIGNING（产品设计）

**阶段目标**: 生成 PRD.md 和 TRD.md

**执行流程**:
```
1. Workflow Orchestrator 调用 executeStage('designing')
   ↓
2. Stage Executor 准备输入
   - requirementsFile: REQUIREMENTS.md
   - outputDir: 01_designing/
   ↓
3. AI Tool Adapter 调用 OpenCode
   - task: "你是一个产品设计专家。请执行 designing skill..."
   - sessions_spawn({ task, runtime: "subagent", mode: "run" })
   ↓
4. OpenCode 执行 designing skill
   - 阅读 REQUIREMENTS.md
   - 生成 PRD.md（产品需求文档）
   - 生成 TRD.md（技术设计文档）
   ↓
5. 检查输出文件
   - 01_designing/PRD.md ✅
   - 01_designing/TRD.md ✅
   ↓
6. Review Orchestrator 执行审阅
   - ReviewDesignAgent.execute()
   - 检查点：D1 需求覆盖、D2 文档完整、D3 无模糊词...
   - 审阅结论：pass
   ↓
7. State Manager 记录状态
   - stages.designing.status = 'passed'
   - stages.designing.outputs = ['PRD.md', 'TRD.md']
```

**输出产物**:
| 文件 | 位置 | 说明 |
|------|------|------|
| `PRD.md` | `01_designing/` | 产品需求文档（追加 v2.1.0 章节） |
| `TRD.md` | `01_designing/` | 技术设计文档（追加 v2.1.0 章节） |

**用户审阅点**:
```
╔═══════════════════════════════════════════════════════════╗
║  阶段审阅：DESIGNING                                      ║
╚═══════════════════════════════════════════════════════════╝

产出文件:
- 01_designing/PRD.md
- 01_designing/TRD.md

审阅检查点:
- [ ] PRD.md 是否包含 v2.1.0 产品需求（第 12 章）？
- [ ] TRD.md 是否包含 v2.1.0 技术设计？
- [ ] 需求覆盖率是否 100%？
- [ ] 是否有模糊词？

审阅结论:
[ ] 通过 → 进入下一阶段
[ ] 条件通过 → 进入下一阶段，记录待修复项
[ ] 驳回 → 重新执行 designing 阶段
[ ] 需澄清 → 回答问题后重新审阅
[ ] 终止 → 停止整个流程

你的结论：通过 ✅
```

---

### 5.3 阶段 3.2: ROADMAPPING（开发计划）

**阶段目标**: 生成 ROADMAP.md（新增自审阅）

**执行流程**:
```
1. Workflow Orchestrator 调用 executeStage('roadmapping')
   ↓
2. Stage Executor 准备输入
   - designingPath: 01_designing/
   - prdFile: 01_designing/PRD.md
   - trdFile: 01_designing/TRD.md
   - outputDir: 02_roadmapping/
   ↓
3. AI Tool Adapter 调用 OpenCode
   - task: "你是一个技术项目经理。请执行 roadmapping skill..."
   - 包含 10 项检查清单说明
   - sessions_spawn({ task, runtime: "subagent", mode: "run" })
   ↓
4. OpenCode 执行 roadmapping skill
   a. 阅读 PRD.md 和 TRD.md
   b. 分析代码现状（增量需求）
   c. 生成 ROADMAP.md 初稿
   d. 自审阅（10 项检查清单）
      - 任务拆分、工作量评估、收尾项...
      - 评分：10/10
   e. 修正（如需要，评分 8-9/10）
   f. 写入 ROADMAP.md
   g. 写入 SELF-REVIEW.md（如执行过修正）
   ↓
5. 检查输出文件
   - 02_roadmapping/ROADMAP.md ✅
   - 02_roadmapping/SELF-REVIEW.md ✅（可选）
   ↓
6. Review Orchestrator 执行审阅
   - ❌ 无 ReviewRoadmapAgent（缺失）
   - 跳过审阅，直接进入下一阶段
   ↓
7. State Manager 记录状态
   - stages.roadmapping.status = 'passed'
   - stages.roadmapping.outputs = ['ROADMAP.md']
```

**输出产物**:
| 文件 | 位置 | 说明 |
|------|------|------|
| `ROADMAP.md` | `02_roadmapping/` | 开发计划（追加 v2.1.0 章节） |
| `SELF-REVIEW.md` | `02_roadmapping/` | 自审阅报告（可选） |

**自审阅检查清单**（在 skill 内部执行）:
```
1. ✅ 任务拆分 - 职责单一，按模块和前后端拆分
2. ✅ 工作量评估 - 单个任务 ≤ 2 人天
3. ✅ 收尾项 - 联调测试（0.5 人天）+ 演示（0.5 人天）
4. ✅ 任务命名 - `【任务简称】(前端/后端) 任务简述`
5. ✅ 描述规范 - 只描述"做什么"
6. ✅ 需求覆盖 - 覆盖 PRD.md 所有功能
7. ✅ 技术对齐 - 与 TRD.md 一致
8. ✅ 代码现状 - 增量需求分析现有代码
9. ✅ 风险评估 - ≥3 项风险
10. ✅ 不确定性标注 - 标注原因和范围

评分：10/10 ✅
决策：直接通过
```

**用户审阅点**:
```
╔═══════════════════════════════════════════════════════════╗
║  阶段审阅：ROADMAPPING                                    ║
╚═══════════════════════════════════════════════════════════╝

产出文件:
- 02_roadmapping/ROADMAP.md
- 02_roadmapping/SELF-REVIEW.md（可选）

审阅检查点:
- [ ] 任务拆分是否合理？
- [ ] 工作量评估是否客观？
- [ ] 是否包含联调测试和演示项？
- [ ] 风险评估是否全面？
- [ ] 自审阅报告是否记录问题？

你的结论：通过 ✅
```

---

### 5.4 阶段 3.3: DETAILING（详细设计）

**阶段目标**: 生成 DETAIL.md

**执行流程**:
```
1. Workflow Orchestrator 调用 executeStage('detailing')
   ↓
2. Stage Executor 准备输入
   - prdFile: 01_designing/PRD.md
   - trdFile: 01_designing/TRD.md
   - roadmapFile: 02_roadmapping/ROADMAP.md
   - outputDir: 03_detailing/
   ↓
3. AI Tool Adapter 调用 OpenCode
   - task: "你是一个系统架构师。请执行 detailing skill..."
   ↓
4. OpenCode 执行 detailing skill
   - 阅读 PRD.md、TRD.md、ROADMAP.md
   - 生成文件级详细设计
   - 写入 DETAIL.md
   ↓
5. 检查输出文件
   - 03_detailing/DETAIL.md ✅
   ↓
6. Review Orchestrator 执行审阅
   - ❌ 无 ReviewDetailingAgent（缺失）
   - 跳过审阅
   ↓
7. State Manager 记录状态
   - stages.detailing.status = 'passed'
```

**输出产物**:
| 文件 | 位置 | 说明 |
|------|------|------|
| `DETAIL.md` | `03_detailing/` | 详细设计文档 |

---

### 5.5 阶段 3.4: CODING（代码实现）

**阶段目标**: 生成源代码

**执行流程**:
```
1. Workflow Orchestrator 调用 executeStage('coding')
   ↓
2. Stage Executor 准备输入
   - detailFile: 03_detailing/DETAIL.md
   - outputDir: 04_coding/src/
   ↓
3. AI Tool Adapter 调用 OpenCode
   - task: "你是一个资深开发工程师。请执行 coding skill..."
   ↓
4. OpenCode 执行 coding skill
   - 阅读 DETAIL.md
   - 实现代码
   - 写入 src/ 目录
   ↓
5. 检查输出文件
   - 04_coding/src/*.js ✅
   ↓
6. Review Orchestrator 执行审阅
   - ReviewCodeAgent.execute()
   - 检查点：C1 需求对齐、C2 架构对齐、C3 代码质量...
   - 审阅结论：pass
   ↓
7. State Manager 记录状态
   - stages.coding.status = 'passed'
```

**输出产物**:
| 文件 | 位置 | 说明 |
|------|------|------|
| `*.js` | `04_coding/src/` | 源代码文件 |

---

### 5.6 阶段 3.5: TESTING（测试）

**阶段目标**: 生成测试用例

**执行流程**:
```
1. Workflow Orchestrator 调用 executeStage('testing')
   ↓
2. Stage Executor 准备输入
   - srcDir: 04_coding/src/
   - outputDir: 04_coding/tests/
   ↓
3. AI Tool Adapter 调用 OpenCode
   - task: "你是一个测试专家。请执行 testing skill..."
   ↓
4. OpenCode 执行 testing skill
   - 阅读源代码
   - 生成测试用例
   - 写入 tests/ 目录
   ↓
5. 检查输出文件
   - 04_coding/tests/*.test.js ✅
   ↓
6. Review Orchestrator 执行审阅
   - ❌ 无 ReviewTestingAgent（缺失）
   - 跳过审阅
   ↓
7. State Manager 记录状态
   - stages.testing.status = 'passed'
```

**输出产物**:
| 文件 | 位置 | 说明 |
|------|------|------|
| `*.test.js` | `04_coding/tests/` | 测试用例文件 |

---

### 5.7 阶段 3.6: REVIEWING（验收）

**阶段目标**: 生成验收报告

**执行流程**:
```
1. Workflow Orchestrator 调用 executeStage('reviewing')
   ↓
2. Stage Executor 准备输入
   - designingPath: 01_designing/
   - codingPath: 04_coding/
   - outputDir: 05_reviewing/
   ↓
3. AI Tool Adapter 调用 OpenCode
   - task: "你是一个质量保障专家。请执行 reviewing skill..."
   ↓
4. OpenCode 执行 reviewing skill
   - 审查所有产出文档
   - 检查需求覆盖率
   - 生成验收报告
   - 写入 REVIEW-REPORT.md
   ↓
5. 检查输出文件
   - 05_reviewing/REVIEW-REPORT.md ✅
   ↓
6. Review Orchestrator 执行审阅
   - ❌ 无 ReviewReviewingAgent（缺失）
   - 跳过审阅
   ↓
7. State Manager 记录状态
   - stages.reviewing.status = 'passed'
   - status = 'completed'
```

**输出产物**:
| 文件 | 位置 | 说明 |
|------|------|------|
| `REVIEW-REPORT.md` | `05_reviewing/` | 验收报告 |

---

### 5.8 阶段 3 完成总结

```
╔═══════════════════════════════════════════════════════════╗
║   ClawDevFlow (CDF) 流程执行完成                           ║
╚═══════════════════════════════════════════════════════════╝

工作流 ID: wf-20260402-003
项目路径：/home/ouyp/Learning/Practice/openclaw-universe/projects/clawdevflow/
进度：6/6 (100%)
待修复项：0 项
创建时间：2026-04-02 10:00:00
更新时间：2026-04-02 10:30:00

产出文件:
├── 01_designing/
│   ├── PRD.md              ✅
│   └── TRD.md              ✅
├── 02_roadmapping/
│   ├── ROADMAP.md          ✅
│   └── SELF-REVIEW.md      ✅
├── 03_detailing/
│   └── DETAIL.md           ✅
├── 04_coding/
│   ├── src/                ✅
│   └── tests/              ✅
└── 05_reviewing/
    └── REVIEW-REPORT.md    ✅
```

---

## 六、阶段 4: 用户验收

### 6.1 验收材料

**AI 助手**：
```
流程执行完成！请审阅以下产出：

**设计文档**:
- 01_designing/PRD.md（产品需求）
- 01_designing/TRD.md（技术设计）
- 02_roadmapping/ROADMAP.md（开发计划）
- 02_roadmapping/SELF-REVIEW.md（自审阅报告）
- 03_detailing/DETAIL.md（详细设计）

**代码**:
- 04_coding/src/（源代码）
- 04_coding/tests/（测试用例）

**验收报告**:
- 05_reviewing/REVIEW-REPORT.md

请确认：
[ ] 所有需求已实现
[ ] 文档完整
[ ] 代码质量合格
[ ] 测试覆盖充分
```

### 6.2 用户验收

```
用户：验收通过，可以提交了
```

### 6.3 输出产物

| 文件 | 位置 | 说明 |
|------|------|------|
| `验收结论` | 会话记录 | 用户确认通过 |

---

## 七、阶段 5: Git 提交与部署

### 7.1 Git 提交

**AI 助手执行**：
```bash
cd /home/ouyp/Learning/Practice/openclaw-universe

# 1. 添加文件
git add projects/clawdevflow/REQUIREMENTS.md
git add projects/clawdevflow/01_designing/PRD.md
git add projects/clawdevflow/04_coding/src/bundled-skills/roadmapping/
git add projects/clawdevflow/04_coding/src/adapters/opencode.js
git add projects/clawdevflow/04_coding/src/cdf-orchestrator/

# 2. 提交
git commit -m "feat: Roadmap Agent 优化 v2.1.0（FEATURE-003）

- 纯自动化改造：移除所有用户交互步骤
- 自审阅 Agent：增加 10 项检查清单
- 自动修正：评分 8-9/10 时自动修正
- 审阅透明：生成 SELF-REVIEW.md

修改文件：6 个
新增文件：4 个

版本：v2.1.0 | 日期：2026-04-02"

# 3. 打 Tag
git tag v2.1.0

# 4. 推送
git push origin master --tags
```

### 7.2 部署上线

**AI 助手执行**：
```bash
# 根据 PRD.md 中的部署说明执行
cd /home/ouyp/Learning/Practice/openclaw-universe/projects/clawdevflow

# 安装依赖
npm install

# 运行测试
npm test

# 部署（根据实际部署方式）
./install.sh
```

### 7.3 输出产物

| 文件 | 位置 | 说明 |
|------|------|------|
| `Git Commit` | Git 仓库 | 提交记录 |
| `Git Tag` | Git 仓库 | v2.1.0 |
| `部署日志` | 部署服务器 | 部署记录 |

---

## 八、完整流程总结

### 8.1 阶段时间线

| 阶段 | 时间 | 参与方 | 产出 |
|------|------|--------|------|
| 0. 用户需求 | 10:00 | 用户 → AI | 需求描述 |
| 1. 需求整理 | 10:01 | AI | REQUIREMENTS.md |
| 2. 调用 clawdevflow | 10:02 | AI | state.json |
| 3.1. DESIGNING | 10:03-10:08 | 流程引擎 | PRD.md + TRD.md |
| 3.2. ROADMAPPING | 10:09-10:14 | 流程引擎 | ROADMAP.md |
| 3.3. DETAILING | 10:15-10:18 | 流程引擎 | DETAIL.md |
| 3.4. CODING | 10:19-10:25 | 流程引擎 | src/ |
| 3.5. TESTING | 10:26-10:28 | 流程引擎 | tests/ |
| 3.6. REVIEWING | 10:29-10:30 | 流程引擎 | REVIEW-REPORT.md |
| 4. 用户验收 | 10:31 | 用户 | 验收结论 |
| 5. Git 提交 | 10:32 | AI | Git Commit + Tag |
| 5. 部署 | 10:33 | AI | 部署日志 |

**总耗时**: ~33 分钟

### 8.2 关键文件流转

```
REQUIREMENTS.md (用户提出)
    ↓
PRD.md + TRD.md (DESIGNING 阶段)
    ↓
ROADMAP.md (ROADMAPPING 阶段)
    ↓
DETAIL.md (DETAILING 阶段)
    ↓
src/ (CODING 阶段)
    ↓
tests/ (TESTING 阶段)
    ↓
REVIEW-REPORT.md (REVIEWING 阶段)
    ↓
Git Commit + Tag (部署)
```

### 8.3 参与方职责

| 参与方 | 职责 |
|--------|------|
| **用户** | 提出需求、确认方案、验收产出 |
| **AI 助手** | 整理需求、调用流程、Git 提交、部署 |
| **流程引擎** | 编排 6 个阶段、调用 AI 工具、执行审阅 |
| **OpenCode** | 执行各阶段 skill、生成文档和代码 |
| **Review Agent** | 自动检查、AI 检查、生成审阅结论 |

---

## 九、优化机会点

### 9.1 阶段 0-1: 需求提出与整理

| 问题 | 优化建议 |
|------|---------|
| 需求理解依赖 AI | 提供需求模板，结构化输入 |
| 需求确认耗时 | 增加需求自动分析，推荐场景类型 |

### 9.2 阶段 2: 调用 clawdevflow

| 问题 | 优化建议 |
|------|---------|
| 命令复杂 | 提供交互式命令生成器 |
| 参数易错 | 增加参数验证和提示 |

### 9.3 阶段 3: 流程引擎执行

| 问题 | 优化建议 | 优先级 |
|------|---------|--------|
| Review Agent 缺失 | 新增 Roadmap/Detailing/Testing Agent | P0 |
| AI 检查未实现 | 实现 type: 'ai' 的检查逻辑 | P0 |
| 检查粒度粗 | 从"有无"升级为"质量" | P0 |
| 审阅时间长 | 并行执行审阅 | P1 |

### 9.4 阶段 4: 用户验收

| 问题 | 优化建议 |
|------|---------|
| 验收材料分散 | 生成统一验收报告 |
| 验收标准主观 | 提供验收检查清单 |

### 9.5 阶段 5: Git 提交与部署

| 问题 | 优化建议 |
|------|---------|
| Git 命令手动 | 自动执行 Git 操作 |
| 部署方式多样 | 支持多种部署方式配置 |

---

## 十、附录

### 10.1 相关文件索引

| 文件 | 位置 | 说明 |
|------|------|------|
| `REQUIREMENTS.md` | `projects/clawdevflow/` | 需求说明 |
| `PRD.md` | `01_designing/` | 产品需求文档 |
| `TRD.md` | `01_designing/` | 技术设计文档 |
| `ROADMAP.md` | `02_roadmapping/` | 开发计划 |
| `DETAIL.md` | `03_detailing/` | 详细设计 |
| `REVIEW-REPORT.md` | `05_reviewing/` | 验收报告 |
| `CALL-FLOW-DIAGRAMS.md` | `projects/clawdevflow/` | 调用流程图 |
| `EXECUTION-FLOW-REVIEW-ANALYSIS.md` | `projects/clawdevflow/` | 审阅 Agent 分析 |

### 10.2 关键代码位置

| 组件 | 文件 | 说明 |
|------|------|------|
| Workflow Executor | `workflow-executor.js` | 流程入口 |
| Workflow Orchestrator | `cdf-orchestrator/workflow-orchestrator.js` | 流程编排 |
| Stage Executor | `cdf-orchestrator/stage-executor.js` | 阶段执行 |
| AI Tool Adapter | `adapters/opencode.js` | AI 工具调用 |
| Review Orchestrator | `review-orchestrator/review-orchestrator.js` | 审阅编排 |
| Review Agents | `review-agents/review-design.js` | 审阅 Agent |
| State Manager | `cdf-orchestrator/state-manager.js` | 状态管理 |

---

*端到端流程文档 by openclaw-ouyp*  
**版本**: v1.0 | **日期**: 2026-04-02 | **状态**: 完成 ✅
