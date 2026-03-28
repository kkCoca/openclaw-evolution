# 流程引擎优化需求说明 v2.0

> **版本**: v2.0  
> **日期**: 2026-03-28  
> **状态**: 待审阅  
> **作者**: openclaw-ouyp + AI Assistant  
> **关联项目**: `/home/ouyp/Learning/Practice/openclaw-universe/tasks/20260326-research-workflow-skill/`

---

## 零、项目背景

### 流程引擎项目结构

**开发项目位置**：
```
/home/ouyp/Learning/Practice/openclaw-universe/tasks/20260326-research-workflow-skill/
├── REQUIREMENTS.md          # 需求说明（追加式）
├── 01_designing/
│   ├── PRD.md               # 产品需求文档（追加式）
│   └── TRD.md               # 技术设计文档
├── 04_coding/
│   └── openclaw-research-workflow/  # 技能源代码
│       ├── SKILL.md
│       ├── workflow.md
│       ├── README.md
│       ├── bundled-skills/
│       └── ...
└── 05_reviewing/
    └── REVIEW-REPORT.md
```

**安装位置**：
```
~/.openclaw/skills/openclaw-research-workflow/
```

**版本历史**：
| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0.0 | 2026-03-26 | 初始版本 |
| v1.0.1 | 2026-03-26 | BUG-001 修复 |
| v1.1.0 | 2026-03-26 | FEATURE-001：增加 OpenCode 调用说明 |
| **v2.0.0** | **2026-03-28** | **FEATURE-002：审阅驱动 + 会话隔离 + 工具无关（本次优化）** |

---

## 一、当前问题分析

---

## 一、当前问题分析

### 问题 1：PRD/TRD 生成后缺少沟通确认环节

**现状**：
```
流程引擎 → 调用 OpenCode 执行 designing → 直接输出 PRD.md + TRD.md → 继续下一阶段
```

**问题**：
- AI 生成的 PRD/TRD 没有经过 openclaw-ouyp 审阅确认
- 违背 SOUL.md "生成与审阅分离" 原则
- 错误设计会传递到后续所有阶段

**影响**：
- 需求理解偏差无法及时纠正
- 技术选型问题可能在编码阶段才被发现
- 返工成本高

---

### 问题 2：单会话依次执行导致上下文膨胀

**现状**：
```
单会话执行：designing → roadmapping → detailing → coding → reviewing
上下文累积：5 个阶段的输入输出全部堆积在同一会话
```

**问题**：
- Token 消耗随阶段数线性增长
- 模型注意力分散，早期信息易被遗忘
- 长上下文降低响应质量

**影响**：
- 复杂项目（如 20+ 文件）可能导致上下文溢出
- 后期阶段可能"忘记"早期约定
- 调试困难（日志混杂）

---

### 问题 3：流程引擎角色模糊

**现状**：
- 流程引擎既做编排又做执行
- 直接调用 OpenCode，耦合度高
- 无法灵活切换 AI 工具

**问题**：
- 难以支持多 AI 工具（OpenCode/Claude Code/其他）
- 编排逻辑与执行逻辑混杂
- 扩展性差

---

## 二、优化目标

| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **审阅驱动** | 每个阶段必须 openclaw-ouyp 确认后才继续 | 所有阶段都有明确的审阅检查点和通过标准 |
| **会话隔离** | 每个阶段独立子会话执行 | 子会话上下文独立，主会话只保留编排状态 |
| **工具无关** | 可配置 AI 工具（OpenCode/Claude Code/其他） | 配置文件可指定各阶段使用的 AI 工具 |
| **状态可追溯** | 完整记录每个阶段的执行状态和审阅结论 | 状态日志可查询，支持断点续传 |
| **回滚灵活** | 支持阶段级回滚（策略 A） | 驳回后重新执行当前阶段，不影响已通过阶段 |

---

## 三、详细设计方案

### 3.1 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    流程引擎 (纯编排器)                        │
│                                                             │
│  输入层：                                                    │
│  - 解析任务（场景类型 + REQUIREMENTS.md）                     │
│  - 加载配置（config.yaml）                                   │
│                                                             │
│  编排层：                                                    │
│  - 状态机管理（待执行/执行中/待审阅/通过/驳回）                │
│  - 子会话调度（sessions_spawn）                             │
│  - 审阅协议执行（等待确认→决策→继续/回滚）                    │
│                                                             │
│  适配层：                                                    │
│  - AI 工具抽象（OpenCode/Claude Code/Custom）                │
│  - 统一调用接口（executeStage）                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │ 子会话 1 │          │ 子会话 2 │          │ 子会话 5 │
   │designing│          │roadmap  │          │reviewing│
   │         │          │         │          │         │
   │AI 工具执行│          │AI 工具执行│          │AI 工具执行│
   └─────────┘          └─────────┘          └─────────┘
        ↓                     ↓                     ↓
   PRD.md + TRD.md      ROADMAP.md          REVIEW-REPORT.md
```

---

### 3.2 状态机设计

```
┌──────────┐    spawn 子会话    ┌──────────┐    子会话完成    ┌──────────┐
│ 待执行   │ ───────────────→ │ 执行中   │ ─────────────→ │ 待审阅   │
│ Pending  │                   │ Running  │                 │ Reviewing│
└──────────┘                   └──────────┘                 └────┬─────┘
                                                                  │
                     ┌────────────────────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────────────────────────────┐
        │              openclaw-ouyp 审阅                 │
        └────────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬────────────┐
        ↓            ↓            ↓            ↓
   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
   │ 通过   │  │条件通过│  │ 驳回   │  │ 需澄清 │
   │ Pass   │  │Conditional││ Reject ││ Clarify│
   └───┬────┘  └───┬────┘  └───┬────┘  └───┬────┘
       │           │           │           │
       │ 进入下一阶段  │ 进入下一阶段  │ 重新执行   │ 回答后重新审阅
       │           │ (记录待修复项)│ 当前阶段   │
       ↓           ↓           ↓           ↓
   ┌────────────────────────────────────────────────┐
   │                  下一阶段                        │
   └────────────────────────────────────────────────┘
```

**状态枚举**：
```javascript
const StageStatus = {
  PENDING: 'pending',      // 待执行
  RUNNING: 'running',      // 执行中
  REVIEWING: 'reviewing',  // 待审阅
  PASSED: 'passed',        // 通过
  CONDITIONAL_PASSED: 'conditional_passed', // 条件通过
  REJECTED: 'rejected',    // 驳回（重新执行）
  TERMINATED: 'terminated' // 终止（用户主动停止）
};
```

---

### 3.3 各阶段审阅协议

#### 阶段 1: designing

| 属性 | 说明 |
|------|------|
| **输入** | REQUIREMENTS.md（openclaw-ouyp 提供） |
| **输出** | 01_designing/PRD.md + 01_designing/TRD.md |
| **执行 AI** | designing skill |
| **期望结果** | 需求完整、技术选型合理、PRD/TRD 职责清晰 |

**审阅检查点**：

| 编号 | 检查项 | 验证方法 | 通过标准 |
|------|--------|---------|---------|
| D1 | 需求覆盖率 100% | 对照 REQUIREMENTS.md 逐条核对 | 所有需求点都有对应设计 |
| D2 | 无模糊描述 | 搜索"适当的"、"一些"、"可能"等模糊词 | 无模糊术语 |
| D3 | 技术选型合理 | 检查技术选型章节的比较表 | 每个选择都有优缺点对比 |
| D4 | PRD/TRD 职责清晰 | PRD 只含需求+UI，TRD 只含技术 + 数据库 | 职责分离清晰 |
| D5 | 异常处理完整 | 检查失败路径设计 | 正常流程 + 失败处理 + 边界情况都覆盖 |
| D6 | 向后兼容 | 检查兼容性说明（增量需求） | 明确说明兼容性策略 |

**审阅请求模板**：
```markdown
## 📋 阶段审阅：designing

### 本阶段目标
将用户需求转化为完整的产品需求文档 (PRD) 和技术设计文档 (TRD)

### 输入文档
- REQUIREMENTS.md（v1.0.0 + v1.1.0 + ...）

### 输出文档
- 01_designing/PRD.md
- 01_designing/TRD.md

### 审阅检查点
| 编号 | 检查项 | 状态 | 备注 |
|------|--------|------|------|
| D1 | 需求覆盖率 100% | ⬜ | |
| D2 | 无模糊描述 | ⬜ | |
| D3 | 技术选型合理 | ⬜ | |
| D4 | PRD/TRD 职责清晰 | ⬜ | |
| D5 | 异常处理完整 | ⬜ | |
| D6 | 向后兼容 | ⬜ | 增量需求适用 |

### 关键决策
{列出本阶段的关键技术选型和设计决策}

### 审阅结论
请选择：
- ✅ 通过（进入 roadmapping 阶段）
- ⚠️ 条件通过（有以下小问题需后续修复：___）
- ❌ 驳回（需重新执行 designing 阶段，原因：___）
- ❓ 需澄清（有以下问题：___）
```

---

#### 阶段 2: roadmapping

| 属性 | 说明 |
|------|------|
| **输入** | PRD.md + TRD.md |
| **输出** | 02_roadmapping/ROADMAP.md |
| **执行 AI** | roadmapping skill |
| **期望结果** | 开发计划可行、任务拆分合理、工作量估算可信 |

**审阅检查点**：

| 编号 | 检查项 | 验证方法 | 通过标准 |
|------|--------|---------|---------|
| R1 | 任务拆分合理 | 检查每个任务的工作量估算 | 所有任务在 0.5-2 人天范围内 |
| R2 | 依赖关系清晰 | 检查任务间的依赖说明 | 前置任务明确标注 |
| R3 | 工作量估算可信 | 对照任务复杂度评估 | 估算与复杂度匹配 |
| R4 | 包含联调测试项 | 检查是否有联调测试任务 | 前后端各有联调测试项 |
| R5 | 包含演示项 | 检查是否有演示准备任务 | 固定 0.5 人天演示项 |
| R6 | 涉及模块完整 | 检查涉及模块列表 | 所有改动模块都列出 |

**审阅请求模板**：
```markdown
## 📋 阶段审阅：roadmapping

### 本阶段目标
将设计文档转化为可执行的开发计划，包含任务拆分和工作量估算

### 输入文档
- 01_designing/PRD.md
- 01_designing/TRD.md

### 输出文档
- 02_roadmapping/ROADMAP.md

### 审阅检查点
| 编号 | 检查项 | 状态 | 备注 |
|------|--------|------|------|
| R1 | 任务拆分合理 | ⬜ | |
| R2 | 依赖关系清晰 | ⬜ | |
| R3 | 工作量估算可信 | ⬜ | |
| R4 | 包含联调测试项 | ⬜ | |
| R5 | 包含演示项 | ⬜ | |
| R6 | 涉及模块完整 | ⬜ | |

### 关键决策
{列出任务拆分策略和工作量估算依据}

### 审阅结论
请选择：
- ✅ 通过（进入 detailing 阶段）
- ⚠️ 条件通过（有以下小问题需后续修复：___）
- ❌ 驳回（需重新执行 roadmapping 阶段，原因：___）
- ❓ 需澄清（有以下问题：___）
```

---

#### 阶段 3: detailing

| 属性 | 说明 |
|------|------|
| **输入** | PRD.md + TRD.md + ROADMAP.md |
| **输出** | 03_detailing/DETAIL.md |
| **执行 AI** | detailing skill |
| **期望结果** | 文件级设计完整、接口定义清晰、可直接指导编码 |

**审阅检查点**：

| 编号 | 检查项 | 验证方法 | 通过标准 |
|------|--------|---------|---------|
| D1 | 文件级设计完整 | 检查文件清单 | 所有需要新增/修改的文件都列出 |
| D2 | 接口定义清晰 | 检查方法签名 | 方法名、参数、返回值完整 |
| D3 | 无实现代码 | 检查是否有具体实现 | 只有方法签名，无实现逻辑 |
| D4 | 符合最佳实践 | 对照技术栈最佳实践 | 设计符合框架约定 |
| D5 | 数据库变更完整 | 检查数据库设计章节 | 表结构、字段、索引都定义 |
| D6 | 配置变更完整 | 检查配置项说明 | 新增配置项都列出 |

**审阅请求模板**：
```markdown
## 📋 阶段审阅：detailing

### 本阶段目标
将开发计划细化到文件和方法级别，形成可直接指导编码的执行方案

### 输入文档
- 01_designing/PRD.md
- 01_designing/TRD.md
- 02_roadmapping/ROADMAP.md

### 输出文档
- 03_detailing/DETAIL.md

### 审阅检查点
| 编号 | 检查项 | 状态 | 备注 |
|------|--------|------|------|
| D1 | 文件级设计完整 | ⬜ | |
| D2 | 接口定义清晰 | ⬜ | |
| D3 | 无实现代码 | ⬜ | |
| D4 | 符合最佳实践 | ⬜ | |
| D5 | 数据库变更完整 | ⬜ | |
| D6 | 配置变更完整 | ⬜ | |

### 关键决策
{列出关键的文件结构设计和技术决策}

### 审阅结论
请选择：
- ✅ 通过（进入 coding 阶段）
- ⚠️ 条件通过（有以下小问题需后续修复：___）
- ❌ 驳回（需重新执行 detailing 阶段，原因：___）
- ❓ 需澄清（有以下问题：___）
```

---

#### 阶段 4: coding

| 属性 | 说明 |
|------|------|
| **输入** | DETAIL.md + 最佳实践文档 |
| **输出** | 04_coding/src/ + 04_coding/tests/ + 04_coding/README.md |
| **执行 AI** | coding skill |
| **期望结果** | 功能完整实现、类型安全、测试覆盖核心逻辑 |

**审阅检查点**：

| 编号 | 检查项 | 验证方法 | 通过标准 |
|------|--------|---------|---------|
| C1 | 功能完整实现 | 对照 DETAIL.md 逐条核对 | 所有设计都有对应实现 |
| C2 | 类型安全 | 检查类型定义 | 无 any/raw type 等模糊类型 |
| C3 | 测试覆盖核心逻辑 | 检查测试文件 | 核心业务逻辑有单元测试 |
| C4 | 无重复代码 | 搜索相似代码 | 无明显重复逻辑 |
| C5 | 边界处理完整 | 检查空值/异常处理 | null/undefined/空集合都处理 |
| C6 | 代码符合最佳实践 | 对照最佳实践文档 | 遵循框架约定和最佳实践 |
| C7 | 文档完整 | 检查 README.md | 安装、使用、配置说明完整 |

**审阅请求模板**：
```markdown
## 📋 阶段审阅：coding

### 本阶段目标
按照详细设计实现生产级代码，包含单元测试和文档

### 输入文档
- 03_detailing/DETAIL.md
- 最佳实践文档

### 输出文档
- 04_coding/src/（源代码）
- 04_coding/tests/（单元测试）
- 04_coding/README.md（使用文档）

### 审阅检查点
| 编号 | 检查项 | 状态 | 备注 |
|------|--------|------|------|
| C1 | 功能完整实现 | ⬜ | |
| C2 | 类型安全 | ⬜ | |
| C3 | 测试覆盖核心逻辑 | ⬜ | |
| C4 | 无重复代码 | ⬜ | |
| C5 | 边界处理完整 | ⬜ | |
| C6 | 代码符合最佳实践 | ⬜ | |
| C7 | 文档完整 | ⬜ | |

### 关键决策
{列出实现过程中的关键技术决策}

### 审阅结论
请选择：
- ✅ 通过（进入 reviewing 阶段）
- ⚠️ 条件通过（有以下小问题需后续修复：___）
- ❌ 驳回（需重新执行 coding 阶段，原因：___）
- ❓ 需澄清（有以下问题：___）
```

---

#### 阶段 5: reviewing

| 属性 | 说明 |
|------|------|
| **输入** | 所有产出（PRD+TRD+ROADMAP+DETAIL+ 代码 + 测试 + 文档） |
| **输出** | 05_reviewing/REVIEW-REPORT.md |
| **执行 AI** | reviewing skill |
| **期望结果** | 验收报告可信、问题清单完整、对齐验证通过 |

**审阅检查点**：

| 编号 | 检查项 | 验证方法 | 通过标准 |
|------|--------|---------|---------|
| V1 | 需求对齐验证 | 对照 REQUIREMENTS.md 逐条验证 | 所有需求都已实现 |
| V2 | 架构一致性检查 | 对照 TRD.md 检查架构 | 实现与设计一致 |
| V3 | 代码质量审查 | 检查代码审查报告 | 无严重质量问题 |
| V4 | 问题清单完整 | 检查问题汇总 | 所有发现的问题都列出 |
| V5 | 验收结论清晰 | 检查验收结论 | 通过/不通过理由明确 |
| V6 | 修复建议可行 | 检查修复建议 | 建议具体可执行 |

**审阅请求模板**：
```markdown
## 📋 阶段审阅：reviewing

### 本阶段目标
对所有产出进行全面审查，验证需求对齐和代码质量，形成验收报告

### 输入文档
- 01_designing/PRD.md + TRD.md
- 02_roadmapping/ROADMAP.md
- 03_detailing/DETAIL.md
- 04_coding/src/ + tests/ + README.md

### 输出文档
- 05_reviewing/REVIEW-REPORT.md

### 审阅检查点
| 编号 | 检查项 | 状态 | 备注 |
|------|--------|------|------|
| V1 | 需求对齐验证 | ⬜ | |
| V2 | 架构一致性检查 | ⬜ | |
| V3 | 代码质量审查 | ⬜ | |
| V4 | 问题清单完整 | ⬜ | |
| V5 | 验收结论清晰 | ⬜ | |
| V6 | 修复建议可行 | ⬜ | |

### 关键发现
{列出审查发现的主要问题和建议}

### 最终验收结论
- ✅ 通过（整个流程完成，可部署）
- ⚠️ 条件通过（有以下小问题需修复后部署：___）
- ❌ 驳回（需重新执行 reviewing 阶段或回退到前面阶段，原因：___）
- ❓ 需澄清（有以下问题：___）
```

---

### 3.4 配置文件设计

```yaml
# ~/.openclaw/skills/openclaw-research-workflow/config.yaml
# 流程引擎配置文件

# 全局设置
global:
  # 默认 AI 工具
  defaultAITool: opencode
  
  # 工作区根目录
  workspaceRoot: /home/ouyp/Learning/Practice/openclaw-universe
  
  # 日志级别
  logLevel: info

# 各阶段配置
stages:
  designing:
    # 使用的 AI 工具（覆盖全局默认）
    aiTool: opencode
    
    # 是否需要审阅（默认 true）
    requireReview: true
    
    # 子会话超时（秒）
    timeoutSeconds: 1800
    
    # 最大重试次数
    maxRetries: 3
    
    # 输出目录
    outputDir: 01_designing
    
    # 输出文件
    outputs:
      - PRD.md
      - TRD.md

  roadmapping:
    aiTool: opencode
    requireReview: true
    timeoutSeconds: 1800
    maxRetries: 3
    outputDir: 02_roadmapping
    outputs:
      - ROADMAP.md

  detailing:
    aiTool: opencode
    requireReview: true
    timeoutSeconds: 1800
    maxRetries: 3
    outputDir: 03_detailing
    outputs:
      - DETAIL.md

  coding:
    aiTool: opencode
    requireReview: true
    timeoutSeconds: 3600
    maxRetries: 3
    outputDir: 04_coding
    outputs:
      - src/
      - tests/
      - README.md

  reviewing:
    aiTool: opencode
    requireReview: true
    timeoutSeconds: 1800
    maxRetries: 3
    outputDir: 05_reviewing
    outputs:
      - REVIEW-REPORT.md

# 审阅配置
review:
  # 必须审阅的阶段（默认全部）
  requiredStages:
    - designing
    - roadmapping
    - detailing
    - coding
    - reviewing
  
  # 审阅超时（小时），超时后发送提醒
  timeoutHours: 24
  
  # 审阅结论选项
  decisionOptions:
    - pass        # 通过
    - conditional # 条件通过
    - reject      # 驳回
    - clarify     # 需澄清

# 回滚策略
rollback:
  # 策略：A=当前阶段重做，B=回滚到上阶段，C=完全重启
  strategy: A
  
  # 最大重试次数（每个阶段）
  maxRetriesPerStage: 3
  
  # 最大重试次数（整个流程）
  maxRetriesTotal: 10
  
  # 重试间隔（秒）
  retryDelaySeconds: 5

# 并行化配置
parallel:
  # 是否启用并行
  enabled: true
  
  # 可并行的阶段组合
  groups:
    # 前端和后端编码可并行
    - name: coding-parallel
      stages:
        - coding-frontend
        - coding-backend
      maxParallel: 2
  
  # 并行任务数限制
  maxConcurrentTasks: 3

# AI 工具配置
aiTools:
  opencode:
    # OpenCode 配置
    command: opencode
    args:
      - --print
      - --permission-mode
      - bypassPermissions
    
  claude-code:
    # Claude Code 配置
    command: claude
    args:
      - --print
      - --permission-mode
      - bypassPermissions
    
  custom:
    # 自定义 AI 工具配置
    command: /path/to/custom/tool
    args: []
    env:
      API_KEY: ${CUSTOM_AI_API_KEY}
```

---

### 3.5 回滚机制（策略 A）

**策略 A 定义**：驳回后重新执行当前阶段，不影响已通过阶段

**状态持久化**：
```javascript
// ~/.openclaw/skills/openclaw-research-workflow/state.json
{
  "workflowId": "wf-20260328-001",
  "task": "DDG 搜索添加 timeout 参数",
  "scenario": "增量需求",
  "projectPath": "/home/ouyp/Learning/Practice/openclaw-universe/projects/ddg-websearch",
  "startedAt": "2026-03-28T10:00:00+08:00",
  "currentStage": "detailing",
  "stages": {
    "designing": {
      "status": "passed",
      "sessionId": "session-designing-001",
      "outputs": ["01_designing/PRD.md", "01_designing/TRD.md"],
      "reviewDecision": "pass",
      "reviewedAt": "2026-03-28T10:30:00+08:00",
      "reviewerNotes": ""
    },
    "roadmapping": {
      "status": "passed",
      "sessionId": "session-roadmapping-001",
      "outputs": ["02_roadmapping/ROADMAP.md"],
      "reviewDecision": "conditional",
      "reviewedAt": "2026-03-28T11:00:00+08:00",
      "reviewerNotes": "任务 3 工作量估算偏高，后续关注"
    },
    "detailing": {
      "status": "reviewing",
      "sessionId": "session-detailing-001",
      "outputs": ["03_detailing/DETAIL.md"],
      "reviewDecision": null,
      "reviewedAt": null,
      "reviewerNotes": null
    },
    "coding": {
      "status": "pending",
      "sessionId": null,
      "outputs": [],
      "reviewDecision": null,
      "reviewedAt": null,
      "reviewerNotes": null
    },
    "reviewing": {
      "status": "pending",
      "sessionId": null,
      "outputs": [],
      "reviewDecision": null,
      "reviewedAt": null,
      "reviewerNotes": null
    }
  },
  "retries": {
    "detailing": 1  // detailing 阶段已重试 1 次
  }
}
```

**回滚流程**：
```
1. openclaw-ouyp 审阅结论：驳回
2. 流程引擎记录驳回原因到 state.json
3. 检查重试次数是否超过 maxRetriesPerStage
   - 未超过：重新 spawn 子会话执行当前阶段
   - 超过：提示用户介入，流程终止
4. 重新执行时，将驳回原因传递给 AI 工具
5. AI 工具根据驳回原因调整输出
6. 重新进入待审阅状态
```

---

### 3.6 会话管理

**子会话生命周期**：
```javascript
// 1. Spawn 子会话
const session = await sessions_spawn({
  task: `执行 ${stageName} skill`,
  input: stageInput,
  runtime: "subagent",
  mode: "run",
  timeoutSeconds: config.stages[stageName].timeoutSeconds
});

// 2. 等待完成
const result = await waitForCompletion(session.id);

// 3. 记录会话信息
state.stages[stageName].sessionId = session.id;
state.stages[stageName].outputs = result.outputs;

// 4. 子会话结束后自动清理（mode: "run" 是一次性的）
```

**主会话职责**：
- 解析任务输入
- 加载配置文件
- 管理状态机
- Spawn 子会话
- 等待用户审阅
- 根据审阅结论决策
- 持久化状态到 state.json

---

### 3.7 日志设计

**日志格式**：
```json
// ~/.openclaw/skills/openclaw-research-workflow/logs/wf-20260328-001.log
{
  "timestamp": "2026-03-28T10:00:00+08:00",
  "workflowId": "wf-20260328-001",
  "stage": "designing",
  "event": "stage_started",
  "details": {
    "sessionId": "session-designing-001",
    "aiTool": "opencode"
  }
}

{
  "timestamp": "2026-03-28T10:25:00+08:00",
  "workflowId": "wf-20260328-001",
  "stage": "designing",
  "event": "stage_completed",
  "details": {
    "sessionId": "session-designing-001",
    "outputs": ["01_designing/PRD.md", "01_designing/TRD.md"],
    "durationSeconds": 1500
  }
}

{
  "timestamp": "2026-03-28T10:30:00+08:00",
  "workflowId": "wf-20260328-001",
  "stage": "designing",
  "event": "review_decision",
  "details": {
    "decision": "pass",
    "reviewer": "openclaw-ouyp",
    "notes": ""
  }
}

{
  "timestamp": "2026-03-28T10:31:00+08:00",
  "workflowId": "wf-20260328-001",
  "stage": "roadmapping",
  "event": "stage_started",
  "details": {
    "sessionId": "session-roadmapping-001",
    "aiTool": "opencode"
  }
}
```

---

## 四、实现计划

### 开发项目

**项目位置**：`/home/ouyp/Learning/Practice/openclaw-universe/tasks/20260326-research-workflow-skill/`

**Git 分支**：`feature/workflow-v2`（新建）

**安装方式**：开发完成后运行 `install.sh` 覆盖安装到 `~/.openclaw/skills/openclaw-research-workflow/`

---

### 阶段 1：核心框架（优先级：高）

| 任务 | 工作量 | 说明 | 输出文件 |
|------|--------|------|---------|
| 1.1 重写 workflow.md | 1 人天 | 实现状态机 + 子会话编排 | `04_coding/openclaw-research-workflow/workflow.md` |
| 1.2 创建 config.yaml 模板 | 0.5 人天 | 提供配置示例 | `04_coding/openclaw-research-workflow/config.yaml` |
| 1.3 创建 state.json 管理逻辑 | 0.5 人天 | 状态持久化 | `04_coding/openclaw-research-workflow/state-manager.js` |
| 1.4 创建 REVIEW-PROTOCOL.md | 0.5 人天 | 各阶段审阅协议 | `04_coding/openclaw-research-workflow/REVIEW-PROTOCOL.md` |
| 1.5 更新 SKILL.md | 0.5 人天 | 使用说明更新 | `04_coding/openclaw-research-workflow/SKILL.md` |
| 1.6 更新 PRD.md/TRD.md | 0.5 人天 | 设计文档追加 v2.0 章节 | `01_designing/PRD.md` + `TRD.md` |

**小计**：3.5 人天

---

### 阶段 2：AI 工具适配层（优先级：中）

| 任务 | 工作量 | 说明 | 输出文件 |
|------|--------|------|---------|
| 2.1 创建 AI 工具抽象接口 | 1 人天 | 统一调用接口 | `04_coding/openclaw-research-workflow/ai-tool-adapter.js` |
| 2.2 实现 OpenCode 适配器 | 0.5 人天 | 现有逻辑迁移 | `04_coding/openclaw-research-workflow/adapters/opencode.js` |
| 2.3 实现 Claude Code 适配器 | 0.5 人天 | 新增支持 | `04_coding/openclaw-research-workflow/adapters/claude-code.js` |
| 2.4 实现 Custom 适配器 | 0.5 人天 | 支持自定义工具 | `04_coding/openclaw-research-workflow/adapters/custom.js` |

**小计**：2.5 人天

---

### 阶段 3：增强功能（优先级：低）

| 任务 | 工作量 | 说明 | 输出文件 |
|------|--------|------|---------|
| 3.1 并行化支持 | 1 人天 | coding 阶段前后端并行 | `04_coding/openclaw-research-workflow/parallel-executor.js` |
| 3.2 断点续传 | 0.5 人天 | 从中断点继续执行 | `04_coding/openclaw-research-workflow/resume-manager.js` |
| 3.3 日志查询工具 | 0.5 人天 | 日志检索和展示 | `04_coding/openclaw-research-workflow/log-viewer.js` |
| 3.4 审阅提醒 | 0.5 人天 | 超时后发送提醒 | `04_coding/openclaw-research-workflow/remind-service.js` |

**小计**：2.5 人天

---

### 总计：8.5 人天

**建议分批实施**：
- **第一批（阶段 1）**：核心框架，解决当前最紧迫的审阅和会话隔离问题
- **第二批（阶段 2）**：AI 工具适配，提升灵活性
- **第三批（阶段 3）**：增强功能，按需实施

---

### Git 提交策略

```bash
# 创建功能分支
cd /home/ouyp/Learning/Practice/openclaw-universe
git checkout -b feature/workflow-v2

# 阶段 1 完成后
git add tasks/20260326-research-workflow-skill/
git commit -m "feat: 流程引擎 v2.0 核心框架

- 审阅驱动：每个阶段必须 openclaw-ouyp 确认后继续
- 会话隔离：每个阶段独立子会话执行
- 状态机管理：待执行/执行中/待审阅/通过/驳回
- 配置文件：config.yaml 支持工具配置
- 状态持久化：state.json 支持断点续传

关联需求：research/workflow-optimization/REQUIREMENTS.md"

# 阶段 2 完成后
git add tasks/20260326-research-workflow-skill/
git commit -m "feat: AI 工具适配层

- 统一调用接口：ai-tool-adapter.js
- OpenCode 适配器
- Claude Code 适配器
- Custom 适配器（支持自定义工具）"

# 阶段 3 完成后
git add tasks/20260326-research-workflow-skill/
git commit -m "feat: 增强功能

- 并行化支持
- 断点续传
- 日志查询工具
- 审阅提醒服务"

# 打 Tag
git tag v2.0.0
git push origin feature/workflow-v2 --tags
```

---

## 五、风险与应对

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|---------|
| 状态持久化失败 | 流程中断后无法恢复 | 中 | 每次状态变更立即写入，支持手动修复 state.json |
| 子会话超时 | 长时间任务被中断 | 中 | 合理设置 timeoutSeconds，支持手动延长 |
| 审阅结论解析失败 | 无法识别用户决策 | 低 | 提供明确的结论选项，支持自然语言解析 |
| AI 工具调用失败 | 阶段执行失败 | 中 | 重试机制 + 错误日志 + 用户介入 |
| 配置文件格式错误 | 流程引擎无法启动 | 低 | 启动时验证配置，提供默认值 |

---

## 六、验收标准

### 功能验收

| 编号 | 验收项 | 验证方法 |
|------|--------|---------|
| F1 | 每个阶段独立子会话执行 | 检查 sessions_spawn 调用 |
| F2 | 每个阶段完成后等待审阅 | 检查审阅确认逻辑 |
| F3 | 审阅结论正确解析 | 测试 4 种结论选项 |
| F4 | 驳回后重新执行当前阶段 | 模拟驳回场景 |
| F5 | 状态持久化正确 | 中断后恢复验证 |
| F6 | 配置文件生效 | 修改配置验证行为变化 |
| F7 | 日志完整记录 | 检查日志文件内容 |

### 非功能验收

| 编号 | 验收项 | 验证方法 |
|------|--------|---------|
| N1 | 子会话上下文隔离 | 检查各子会话独立运行 |
| N2 | 主会话上下文不膨胀 | 检查主会话 token 使用 |
| N3 | 审阅请求格式清晰 | 人工审阅模板可读性 |
| N4 | 错误处理友好 | 模拟错误场景验证提示 |

---

## 七、后续演进方向

1. **多项目并行**：支持同时执行多个项目的流程
2. **智能推荐**：基于历史数据推荐技术选型和工作量估算
3. **质量门禁**：自动执行代码质量检查（lint/test/coverage）
4. **部署集成**：与 CI/CD 集成，自动部署
5. **度量分析**：流程效率分析和优化建议

---

*本文档由 openclaw-ouyp 审阅后决定是否实施*  
**版本**: v2.0  
**状态**: 待审阅 ⏳  
**审阅截止**: 2026-03-29
