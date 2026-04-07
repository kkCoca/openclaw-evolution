# 需求说明文档 - ClawDevFlow

## 文档元数据

| 字段 | 值 |
|------|-----|
| 版本 | v3.1.0 |
| 哈希 | sha256:f0e44912d5778703c30ce7921ceb25a81a454672 |
| Git Commit | f0e4491 |
| 最后更新 | 2026-04-02 |
| 作者 | openclaw-ouyp |

---

## 需求列表

### REQ-001: 流程引擎 Skill 基础功能

**位置**: L13-43

**版本**: v1.0.0 (2026-03-26)

**类型**: 原始需求

**描述**: 流程引擎 Skill（openclaw-research-workflow）的基础功能需求。

**需求内容**:
1. **独立完整** — 一个包包含所有依赖 skills（designing/roadmapping/detailing/coding/reviewing）
2. **零感知安装** — 用户只需安装 1 个 skill，依赖自动注册
3. **流程标准化** — 所有场景都走完整研发流程（designing→roadmapping→detailing→coding）
4. **易于分享** — 支持 clawhub/脚本/压缩包多种安装方式

**验收标准**:
- Given 用户安装流程引擎 Skill
- When 用户执行流程
- Then 所有依赖 skills 自动可用，流程完整执行

---

### REQ-002: 流程引擎 OpenCode 调用说明

**位置**: L46-76

**版本**: v1.1.0 (2026-03-26)

**类型**: 增量需求（基于 REQ-001）

**父需求**: REQ-001

**问题背景**:
在 AGENTS.md 审阅过程中发现，流程引擎 Skill（workflow.md）没有明确体现调用 OpenCode 执行研发流程。

**具体问题**:
1. 流程引擎 Skill 只是文档，没有说明如何调用 OpenCode
2. AGENTS.md 中的"三方协作架构"说明了流程引擎调用 OpenCode，但 workflow.md 本身没有体现
3. 用户查看 workflow.md 时，无法了解每个阶段是如何调用 OpenCode 执行的

**增量需求**:
- ✅ **流程透明化** — 每个阶段明确"调用 OpenCode 执行 XXX skill"

**修改内容**:
1. workflow.md 每个阶段增加"调用 OpenCode 执行"说明
2. README.md 增加"工作原理"章节

**验收标准**:
- Given workflow.md 和 README.md 已修改
- When 审阅文档
- Then workflow.md 每个阶段明确"调用 OpenCode 执行 XXX skill"，README.md 增加"工作原理"章节

---

### REQ-003: 审阅驱动 + 会话隔离 + 工具无关

**位置**: L79-152

**版本**: v2.0.0 (2026-03-28)

**类型**: 增量需求（基于 REQ-001）

**父需求**: REQ-001

**问题背景**:
在流程引擎使用过程中发现以下问题：
1. PRD/TRD 生成后缺少沟通确认环节
2. 单会话依次执行导致上下文膨胀
3. 流程引擎角色模糊

**需求目标**:
| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **审阅驱动** | 每个阶段必须 openclaw-ouyp 确认后才继续 | 所有阶段都有明确的审阅检查点 |
| **会话隔离** | 每个阶段独立子会话执行 | 子会话上下文独立 |
| **工具无关** | 可配置 AI 工具 | 配置文件可指定各阶段使用的 AI 工具 |
| **状态可追溯** | 完整记录每个阶段的执行状态 | 状态日志可查询，支持断点续传 |
| **回滚灵活** | 支持阶段级回滚 | 驳回后重新执行当前阶段 |

**功能需求**:
1. **状态机管理** — 状态枚举/状态流转/状态持久化
2. **子会话调度** — 每个阶段独立 spawn 子会话
3. **审阅协议执行** — 审阅检查点/审阅结论/审阅超时
4. **配置文件支持** — config.yaml
5. **状态持久化** — state-manager.js
6. **文档更新** — workflow.md/SKILL.md/REVIEW-PROTOCOL.md

**输出要求**:
必须完整输出 5 个阶段的产物：
```
projects/{项目名}/
├── REQUIREMENTS.md
├── 01_designing/
│   ├── PRD.md
│   └── TRD.md
├── 02_roadmapping/
│   └── ROADMAP.md
├── 03_detailing/
│   └── DETAIL.md
├── 04_coding/
│   └── src/
├── 05_reviewing/
│   └── REVIEW-REPORT.md
└── CHANGELOG.md
```

**验收标准**:
- Given 流程引擎 v2.0 执行完成
- When 审阅输出目录
- Then 01_designing~05_reviewing 所有目录和文件完整存在

---

### REQ-004: 补充 02_roadmapping/和 03_detailing/阶段产物

**位置**: L155-182

**版本**: v2.0.1 (2026-03-30)

**类型**: Bugfix（基于 REQ-003）

**父需求**: REQ-003

**问题描述**:
流程引擎 v2.0.0 执行后，输出目录缺失 2 个阶段的产物：
- ❌ 02_roadmapping/ROADMAP.md（缺失）
- ❌ 03_detailing/DETAIL.md（缺失）

**根因分析**:
1. PRD.md v2.0.0 的需求定义不完整，没有明确要求输出 ROADMAP.md 和 DETAIL.md
2. 流程引擎自己没有执行自己定义的标准（SKILL.md 要求 5 阶段，实际只输出 3 个）
3. 验收报告造假（REVIEW-REPORT.md 声称文件存在，但实际不存在）

**修复方案**:
重新执行流程引擎，确保完整输出 5 个阶段的产物。

**验收标准**:
- Given 流程引擎 v2.0.1 执行完成
- When 审阅输出目录
- Then 01_designing~05_reviewing 所有 5 个目录和文件完整存在

---

### REQ-005: Roadmap Agent 优化（纯自动化 + 自审阅）

**位置**: L185-268

**版本**: v2.1.0 (2026-04-02)

**类型**: 增量需求（基于 REQ-003）

**父需求**: REQ-003

**问题背景**:
在 roadmapping 阶段使用过程中发现以下问题：
1. **交互式技能不符合流程引擎设计理念** - 需要用户多次确认（评估范围、评审确认）
2. **依赖外部 skill** - 需要调用 designing skill 澄清需求，增加耦合
3. **审阅机制重复** - skill 内部评审 + 流程引擎审阅，用户需要审阅两次
4. **代码分析能力弱** - "搜索相关代码"但没有具体实现
5. **工作量评估主观** - 没有检查标准和评分机制

**需求目标**:
| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **纯自动化** | 移除所有用户交互 | roadmapping 阶段无用户交互，直接输出 |
| **自审阅** | 增加 AI 自审阅 Agent | 生成后自动执行 10 项检查清单 |
| **自动修正** | 小问题自动修正 | 评分 8-9/10 时自动修正后输出 |
| **审阅透明** | 记录审阅过程 | 生成 SELF-REVIEW.md 记录审阅过程 |
| **文档标准化** | 完善技能文档 | SKILL.md 包含完整执行流程和检查清单 |

**功能需求**:
1. **移除交互步骤** - 移除确认评估范围、用户评审确认等交互
2. **自动阅读文档** - 自动阅读 PRD.md + TRD.md 作为输入
3. **自动分析代码** - 增量需求时自动扫描项目结构
4. **自审阅 Agent** - 10 项检查清单（任务拆分、工作量、收尾项等）
5. **评分决策** - 10/10 通过、8-9/10 修正、<8/10 重做
6. **修正机制** - 最多 3 次修正机会
7. **审阅报告** - 生成 SELF-REVIEW.md（可选）
8. **文档完善** - SKILL.md、CHECKLIST.md、示例文件

**输出要求**:
```
bundled-skills/roadmapping/
├── SKILL.md                  # 完全重构，包含自审阅流程
├── CHECKLIST.md              # 10 项检查清单详细说明
└── examples/
    ├── ROADMAP-example.md    # 开发计划示例
    └── SELF-REVIEW-example.md # 自审阅报告示例
```

**验收标准**:
- Given REQUIREMENTS.md 已追加 v2.1.0 需求
- When 审阅修改后的文件
- Then SKILL.md 包含自审阅流程（步骤 4-5）
- Then CHECKLIST.md 包含 10 项检查说明
- Then opencode.js 任务描述包含检查清单
- Then stage-executor.js 修复 designingPath 未定义
- Then workflow-orchestrator.js 添加 designingPath 输入
- Then 示例文件完整

---

### REQ-006: DESIGNING 阶段审阅优化（需求追溯性+AI 检查）

**位置**: L271-375

**版本**: v3.1.0 (2026-04-02)

**类型**: 增量需求（基于 REQ-003）

**父需求**: REQ-003

---

### REQ-007: PRD/TRD 文档修复（满足 v3.1.0 审阅标准）

**位置**: L378-420

**版本**: v3.1.1 (2026-04-02)

**类型**: Bugfix（基于 REQ-003）

**父需求**: REQ-003

**问题描述**:
DESIGNING 阶段审查报告（DESIGNING-REVIEW-REPORT-PRD-TRD.md）显示当前 PRD.md 和 TRD.md 不满足 v3.1.0 审阅标准。

**审查结果**:
- ❌ D1 需求覆盖率：13%（版本对齐❌ 追溯矩阵❌ 可定位映射❌）
- ❌ D2 文档完整性：TRD 缺少数据库/接口/安全设计章节
- ❌ D4 技术选型：无比较表和决策依据
- ❌ D6 异常处理：无异常处理章节
- ❌ D7 验收标准：无 Given/When/Then 格式

**修复需求**:
1. **PRD.md 修复** - 添加文档元数据、需求追溯矩阵、非功能需求章节、验收标准（Given/When/Then）
2. **TRD.md 修复** - 添加文档元数据、需求追溯矩阵、数据库设计、接口设计、安全设计、技术选型、异常处理章节

**验收标准**:
- Given PRD/TRD 已按照 templates 模板修复
- When 执行 ReviewDesignAgent v3.1.0 检查
- Then D1 版本对齐✅ 追溯矩阵✅ 可定位映射✅
- Then D2 文档章节完整✅
- Then D4 技术选型有比较表和决策依据✅
- Then D6 异常处理完整✅
- Then D7 验收标准可测试✅
- Then 审查得分 >= 90%

---

### REQ-008: PRD/TRD 审查问题修复（哈希对齐 + 异常处理完善）

**位置**: L423-470

**版本**: v3.1.2 (2026-04-02)

**类型**: Bugfix（基于 REQ-007）

**父需求**: REQ-007

---

### REQ-009: designing 阶段用户确认签字优化（不生成额外文件）

**位置**: L473-530

**版本**: v3.1.3 (2026-04-02)

**类型**: 增量需求（基于 REQ-003）

**父需求**: REQ-003

**问题背景**:
当前 designing 阶段审查通过后，缺少用户确认签字环节，导致：
1. 用户可能不理解设计方案就进入开发
2. 需求变更无正式确认记录
3. 返工风险高

**需求目标**:
| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **不生成额外文件** | 避免文件过多导致信息不一致 | 0 个额外文件 |
| **签字回填 PRD.md** | 签字直接关联到需求文档 | PRD.md 包含签字章节 |
| **确认内容提炼** | 供用户快速理解 | 内存中提炼，聊天窗口展示 |
| **版本管理** | 支持多版本迭代 | Git 管理 PRD.md 版本 |

**功能需求**:
1. **更新 PRD.md 模板** - 增加签字章节和版本历史章节
2. **确认内容提炼功能** - 从 PRD/TRD 提炼关键需求和技术方案（内存中）
3. **签字收集功能** - 收集用户签字（表单/邮件回复）
4. **签字回填功能** - 将签字回填到 PRD.md
5. **版本管理功能** - 自动更新版本历史，创建 Git Tag

**输出要求**:
```
scripts/
├── generate-confirmation-content.js    # 确认内容提炼
├── collect-user-signature.js           # 签字收集
└── update-prd-signature.js             # 签字回填

templates/
└── PRD-template.md                     # 增加签字章节
```

**验收标准**:
### Given
- REQUIREMENTS.md 已追加 REQ-009（v3.1.3 优化需求）
- PRD.md v3.1.2 和 TRD.md v3.1.2 存在

### When
- 执行完整 clawdevflow 流程（designing→roadmapping→detailing→coding→reviewing）
- 用户验收所有产出

### Then
- ✅ PRD.md v3.1.3 包含签字章节和版本历史
- ✅ TRD.md v3.1.3 包含签字章节（可选）
- ✅ 确认内容提炼功能正常（内存中，不生成文件）
- ✅ 签字回填功能正常（回填到 PRD.md）
- ✅ 版本管理功能正常（Git 管理）
- ✅ 不生成任何额外文件
- ✅ ReviewDesignAgent 审查得分 >= 90%
- ✅ 用户验收通过

**问题描述**:
ReviewDesignAgent v3.1.0 审查（DESIGNING-REVIEW-REPORT-v3.1.1.md）显示 PRD/TRD v3.1.1 存在 2 个红线项问题，审查得分 78.4%，未达到 90% 目标。

**审查结果**:
- ❌ D1 版本哈希不一致：PRD/TRD 声明的 REQUIREMENTS 哈希为 `a0b180bc...`，实际为 `f0e44912...`
- ✅ D2 文档完整性：100%
- ✅ D4 技术选型：100%
- ❌ D6 异常处理：67%（缺少降级方案和监控告警）
- ✅ D7 验收标准：100%
- **总分**: 78.4%（需要 >= 90%）

**修复需求**:
1. **版本哈希对齐修复** - 更新 PRD.md 和 TRD.md 中的"对齐 REQUIREMENTS 哈希"为 `sha256:f0e44912d5778703c30ce7921ceb25a81a454672`
2. **异常处理完善** - TRD.md 补充降级方案子章节和监控告警子章节

**验收标准**:
- Given PRD.md 和 TRD.md 已修复
- When 执行 ReviewDesignAgent v3.1.0 检查
- Then D1 版本哈希一致✅
- Then D6 异常处理完整（包含降级方案和监控告警）✅
- Then 审查得分 >= 90%
- Then 审阅决策：pass 或 conditional

---

## v3.1.1 Bugfix 需求说明 - PRD/TRD 文档修复

**Issue ID**: BUG-005
**需求类型**: Bugfix
**版本升级**: v3.1.0 → v3.1.1

### 问题背景

DESIGNING 阶段审查报告显示 PRD.md 和 TRD.md 不满足 v3.1.0 审阅标准，审查得分仅 13%。

### 修复方案

按照 templates/ 目录下的模板修复 PRD.md 和 TRD.md。

### 输出要求

```
01_designing/
├── PRD.md              # 修复（v3.1.1）
└── TRD.md              # 修复（v3.1.1）
```

### 验收标准

### Given
- templates/REQUIREMENTS-template.md 存在
- templates/PRD-template.md 存在
- templates/TRD-template.md 存在

### When
- 执行 designing 阶段
- 执行 REVIEWING 阶段审查

### Then
- ✅ PRD.md 包含文档元数据（对齐的 REQUIREMENTS 版本/哈希）
- ✅ PRD.md 包含需求追溯矩阵（覆盖 REQ-001 ~ REQ-006）
- ✅ PRD.md 包含非功能需求章节
- ✅ PRD.md 包含验收标准（Given/When/Then 格式）
- ✅ TRD.md 包含文档元数据（对齐的 REQUIREMENTS+PRD 版本/哈希）
- ✅ TRD.md 包含需求追溯矩阵
- ✅ TRD.md 包含数据库设计章节
- ✅ TRD.md 包含接口设计章节
- ✅ TRD.md 包含安全设计章节
- ✅ TRD.md 包含技术选型章节（比较表 + 决策依据）
- ✅ TRD.md 包含异常处理章节
- ✅ ReviewDesignAgent 审查得分 >= 90%

### 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v3.1.0 | 2026-04-02 | FEATURE-004：DESIGNING 阶段审阅优化 |
| v3.1.1 | 2026-04-02 | BUG-005 修复：PRD/TRD 文档修复（满足 v3.1.0 审阅标准） |
| **v3.1.2** | **2026-04-02** | **BUG-006 修复：PRD/TRD 审查问题修复（哈希对齐 + 异常处理完善）** |

---

## v3.1.2 Bugfix 需求说明 - PRD/TRD 审查问题修复

**Issue ID**: BUG-006
**需求类型**: Bugfix
**版本升级**: v3.1.1 → v3.1.2

### 问题背景

ReviewDesignAgent v3.1.0 审查报告显示 PRD/TRD v3.1.1 存在 2 个红线项问题，审查得分 78.4%，未达到 90% 目标。

### 修复方案

1. **版本哈希对齐修复** - 更新 PRD.md 和 TRD.md 中的"对齐 REQUIREMENTS 哈希"
2. **异常处理完善** - TRD.md 补充降级方案子章节和监控告警子章节

### 输出要求

```
01_designing/
├── PRD.md              # 修复（v3.1.2）
└── TRD.md              # 修复（v3.1.2）
```

### 验收标准

### Given
- PRD.md v3.1.1 存在
- TRD.md v3.1.1 存在
- DESIGNING-REVIEW-REPORT-v3.1.1.md 审查报告存在

### When
- 执行 designing 阶段修复
- 执行 REVIEWING 阶段审查

### Then
- ✅ PRD.md 包含文档元数据（对齐的 REQUIREMENTS 版本/哈希为 f0e44912...）
- ✅ TRD.md 包含文档元数据（对齐的 REQUIREMENTS 版本/哈希为 f0e44912...）
- ✅ TRD.md 包含降级方案子章节
- ✅ TRD.md 包含监控告警子章节
- ✅ ReviewDesignAgent v3.1.0 审查得分 >= 90%
- ✅ 审阅决策：pass 或 conditional

### 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v3.1.1 | 2026-04-02 | BUG-005 修复：PRD/TRD 文档修复 |
| **v3.1.2** | **2026-04-02** | **BUG-006 修复：PRD/TRD 审查问题修复（哈希对齐 + 异常处理完善）** |

**问题背景**:
在 DESIGNING 阶段审阅使用过程中发现以下问题：
1. **需求追溯性不足** - PRD/TRD 未声明对齐的 REQUIREMENTS 版本/哈希
2. **需求映射不准确** - 只靠自然语言匹配，无法验证真实映射
3. **AI 检查未实现** - D4 技术选型、D6 异常处理的 AI 检查逻辑缺失
4. **检查粒度粗** - 只检查"有无"，不检查"质量"
5. **验收标准缺失** - 缺少 D7 验收标准可测试性检查

**核心补充要求**:
1. **版本/哈希对齐** - PRD/TRD 必须声明"对齐到哪个 REQUIREMENTS 版本/哈希"，并且与 REQUIREMENTS 最新版本一致
2. **可定位的需求映射** - REQUIREMENTS 的每条需求必须在 PRD 有"可定位的映射"，不能只靠自然语言匹配

**需求目标**:
| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **需求追溯性** | PRD/TRD 必须声明对齐的 REQUIREMENTS 版本/哈希 | 版本一致，哈希匹配 |
| **可定位映射** | 每条需求必须有可定位的映射（章节 + 行号） | 需求追溯矩阵完整 |
| **AI 检查实现** | 实现 D4/D6/D7 的 AI 检查逻辑 | AI 检查正常执行 |
| **检查粒度增强** | 从"有无"升级为"质量" | D2/D5 检查内容质量 |
| **文档标准化** | 提供 REQUIREMENTS/PRD/TRD 模板 | 模板包含追溯矩阵 |

**功能需求**:
1. **版本/哈希对齐检查** - PRD/TRD 必须声明对齐的 REQUIREMENTS 版本/哈希，且与最新版本一致
2. **需求追溯矩阵检查** - PRD 必须包含需求追溯矩阵，覆盖所有需求
3. **可定位映射检查** - 每个映射必须有 PRD 章节和行号
4. **D4 技术选型 AI 检查** - 评估技术选型合理性（比较表 + 决策依据）
5. **D6 异常处理 AI 检查** - 评估异常处理完整性（正常 + 失败 + 边界）
6. **D7 验收标准可测试性检查** - 检查验收标准是否包含 Given/When/Then
7. **文档模板** - 提供 REQUIREMENTS/PRD/TRD 模板，包含追溯矩阵格式

**检查点分类**:
| 类型 | 检查点 | 权重 | 不满足后果 |
|------|--------|------|-----------|
| 红线项 | D1 需求覆盖率（含版本对齐 + 可定位映射） | 0.25 | ❌ reject |
| 红线项 | D2 文档完整性 | 0.15 | ❌ reject |
| 红线项 | D4 技术选型合理 | 0.20 | ❌ reject |
| 红线项 | D6 异常处理 | 0.20 | ❌ reject |
| 质量项 | D5 向后兼容（仅增量需求） | 0.12 | ⚠️ conditional |
| 质量项 | D7 验收标准可测试性 | 0.10 | ⚠️ conditional |
| 加分项 | D3 无模糊词 | 0.08 | ✅ pass + 建议 |

**输出要求**:
```
review-agents/
└── review-design.js          # 重写 D1 检查，实现 D4/D6/D7 AI 检查

templates/
├── REQUIREMENTS-template.md  # 含版本、哈希、需求 ID（REQ-XXX）
├── PRD-template.md           # 含对齐版本/哈希、需求追溯矩阵
└── TRD-template.md           # 含对齐 REQUIREMENTS+PRD 版本/哈希
```

**验收标准**:
- Given REQUIREMENTS.md 已追加 v3.1.0 需求
- When 审阅所有修改的文件
- Then D1 检查实现版本对齐验证（PRD 声明版本/哈希）
- Then D1 检查实现版本一致性验证（与 REQUIREMENTS 比对）
- Then D1 检查实现追溯矩阵提取和验证
- Then D1 检查实现需求映射可定位性验证（章节 + 行号）
- Then D4 实现 AI 检查（技术选型合理性评估）
- Then D6 实现 AI 检查（异常处理完整性评估）
- Then D7 实现验收标准可测试性检查
- Then 提供 REQUIREMENTS 模板（含版本、哈希、需求 ID）
- Then 提供 PRD 模板（含对齐版本/哈希、追溯矩阵）
- Then 提供 TRD 模板（含对齐 REQUIREMENTS+PRD 版本/哈希）

---

## 版本历史

| 版本 | 日期 | 变更说明 | 关联需求 |
|------|------|---------|---------|
| v1.0.0 | 2026-03-26 | 初始版本（原始需求） | REQ-001 |
| v1.0.1 | 2026-03-26 | BUG-001 修复（目录结构问题） | REQ-001 |
| v1.1.0 | 2026-03-26 | FEATURE-001：增加 OpenCode 调用说明 | REQ-002 |
| v2.0.0 | 2026-03-28 | FEATURE-002：审阅驱动 + 会话隔离 + 工具无关 | REQ-003 |
| v2.0.1 | 2026-03-30 | BUG-002 修复：补充 02_roadmapping/和 03_detailing/ | REQ-004 |
| v2.1.0 | 2026-04-02 | FEATURE-003：Roadmap Agent 优化（纯自动化 + 自审阅） | REQ-005 |
| **v3.1.0** | **2026-04-02** | **FEATURE-004：DESIGNING 阶段审阅优化（需求追溯性+AI 检查）** | **REQ-006** |
| v3.1.1 | 2026-04-02 | BUG-005 修复：PRD/TRD 文档修复（满足 v3.1.0 审阅标准） | REQ-007 |
| v3.1.2 | 2026-04-02 | BUG-006 修复：PRD/TRD 审查问题修复（哈希对齐 + 异常处理完善） | REQ-008 |
| **v3.1.3** | **2026-04-02** | **FEATURE-005：DESIGNING 阶段用户确认签字优化（不生成额外文件）** | **REQ-009** |
| **v3.1.4** | **2026-04-02** | **BUG-007 修复：PRD/TRD 描述 AI 工具为 config.yaml 配置（不硬编码 OpenCode）** | **REQ-010** |
| **v3.1.5** | **2026-04-02** | **FEATURE-006：ROADMAPPING 审阅 Agent 规则优化（Freshness/Traceability/MVP/风险）** | **REQ-011** |
| **v3.1.6** | **2026-04-02** | **FEATURE-007：ROADMAPPING 环节优化（解决 R4 范围膨胀 + 不生成 SELF-REVIEW.md）** | **REQ-012** |
| **v3.1.7** | **2026-04-02** | **问题分析：DETAILING 环节审阅 Agent 缺失** | **REQ-013 分析** |
| **v3.1.8** | **2026-04-02** | **FEATURE-008：DETAILING 审阅 Agent 优化（Hard Gates + 输入输出规范）** | **REQ-013** |

**当前版本**: v3.1.8（最新）

---

## 需求追溯矩阵

| 需求 ID | 版本 | 类型 | 父需求 | 状态 | PRD 映射 | TRD 映射 |
|---------|------|------|--------|------|---------|---------|
| REQ-001 | v1.0.0 | 原始需求 | - | ✅ 已完成 | ✅ 已映射 | ✅ 已映射 |
| REQ-002 | v1.1.0 | 增量需求 | REQ-001 | ✅ 已完成 | ✅ 已映射 | ✅ 已映射 |
| REQ-003 | v2.0.0 | 增量需求 | REQ-001 | ✅ 已完成 | ✅ 已映射 | ✅ 已映射 |
| REQ-004 | v2.0.1 | Bugfix | REQ-003 | ✅ 已完成 | ✅ 已映射 | ✅ 已映射 |
| REQ-005 | v2.1.0 | 增量需求 | REQ-003 | ✅ 已完成 | ✅ 已映射 | ✅ 已映射 |
| REQ-006 | v3.1.0 | 增量需求 | REQ-003 | ✅ 已完成 | ✅ 已映射 | ✅ 已映射 |
| REQ-007 | v3.1.1 | Bugfix | REQ-003 | ✅ 已完成 | ✅ 已映射 | ✅ 已映射 |
| REQ-008 | v3.1.2 | Bugfix | REQ-007 | ✅ 已完成 | ✅ 已映射 | ✅ 已映射 |
| REQ-009 | v3.1.3 | 增量需求 | REQ-003 | ✅ 已完成 | ✅ 已映射 | ✅ 已映射 |
| REQ-010 | v3.1.4 | BUG-007 | REQ-003 | ✅ 已完成 | ✅ 已映射 | ✅ 已映射 |
| REQ-011 | v3.1.5 | FEATURE-006 | REQ-005 | ✅ 已完成 | ✅ 已映射 | ✅ 已映射 |
| REQ-012 | v3.1.6 | FEATURE-007 | REQ-011 | ✅ 已完成 | ✅ 已映射 | ✅ 已映射 |
| REQ-013 | v3.1.8 | FEATURE-008 | REQ-012 | ⏳ 进行中 | 待映射 | 待映射 |

**覆盖率**: 12/13 = 92%（REQ-013 进行中）

---

## REQ-010: PRD/TRD 描述 AI 工具为 config.yaml 配置（不硬编码 OpenCode）

**位置**: L580-630

**版本**: v3.1.4 (2026-04-02)

**类型**: Bugfix（基于 REQ-003）

**父需求**: REQ-003

**问题描述**:
PRD.md 和 TRD.md 中硬编码描述"使用 OpenCode"，应该描述为"根据 config.yaml 配置选择 AI 工具"。

**当前问题**:
- ❌ PRD.md 描述："使用 OpenCode 执行 designing skill"
- ❌ TRD.md 描述："使用 OpenCode 生成代码"
- ❌ 无法灵活切换 AI 工具

**修复方案**:
1. PRD.md 修改为："根据 config.yaml 配置选择 AI 工具（默认 opencode，可配置为 claude-code/custom）"
2. TRD.md 修改为："根据 config.yaml 配置选择 AI 工具（默认 opencode，可配置为 claude-code/custom）"
3. 更新 PRD-template.md 和 TRD-template.md

**验收标准**:
### Given
- PRD.md v3.1.3 和 TRD.md v3.1.3 存在
- config.yaml 包含 AI 工具配置

### When
- 执行 designing 阶段修复
- 审阅 PRD.md 和 TRD.md

### Then
- ✅ PRD.md v3.1.4 描述 AI 工具为"根据 config.yaml 配置选择"
- ✅ TRD.md v3.1.4 描述 AI 工具为"根据 config.yaml 配置选择"
- ✅ PRD-template.md 更新为"根据 config.yaml 配置选择"
- ✅ TRD-template.md 更新为"根据 config.yaml 配置选择"
- ✅ ReviewDesignAgent 审查得分 >= 90%
- ✅ 用户验收通过

---

## REQ-011: ROADMAPPING 审阅 Agent 规则优化（Freshness/Traceability/MVP/风险）

**位置**: L630-700

**版本**: v3.1.5 (2026-04-02)

**类型**: 增量需求（基于 REQ-005）

**父需求**: REQ-005

**问题背景**:
当前 roadmapping 审阅 Agent 只有 10 项检查清单，缺少关键的质量控制规则：
- ❌ 无 Freshness 对齐检查（文档不更新到最新）
- ❌ 无显式需求引用（Traceability 不足）
- ❌ 无 MVP 可交付性检查（空泛计划）
- ❌ 无依赖检查（只检查风险）
- ❌ 无范围膨胀预警

**需求目标**:
| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **Freshness** | 对齐最新需求 | ROADMAP.md 包含 alignedTo + requirementsHash |
| **Traceability** | 能追溯到 PRD/需求 | ROADMAP 显式引用需求 ID（覆盖率 100%） |
| **Deliverability** | 具备可交付性 | 有 MVP/里程碑 1 段落（scope/验收/工作量） |
| **风险管理** | 依赖与风险完整 | 有 Dependencies/Risks 段落 |
| **范围控制** | 预警范围膨胀 | 检测"可能/可选/未来"关键词（warning） |

**新增规则**（4 项 critical + 1 项 non-critical）:
| 规则 | 检查点 | 关键性 | 说明 |
|------|--------|--------|------|
| R0 | Freshness 对齐 | critical | ROADMAP.md 必须包含 alignedTo + requirementsHash |
| R1 | Traceability（需求引用） | critical | ROADMAP 必须显式引用需求 ID（覆盖率 100%） |
| R2 | MVP 可交付性 | critical | 必须存在 MVP/Phase 1/里程碑 1 段落 |
| R3 | 依赖与风险 | critical | ROADMAP 必须有 Dependencies/Risks 段落 |
| R4 | 范围膨胀风险 | non-critical | 检测"可能/可选/未来"等关键词（warning） |

**输出要求**:
```
bundled-skills/roadmapping/
└── SKILL.md                  # 更新 10 项检查清单为 12 项

adapters/
└── opencode.js               # 更新 roadmapping 任务描述

tests/
└── test-roadmap-review.js    # 新增测试用例
```

**验收标准**:
### Given
- REQUIREMENTS.md 已追加 REQ-011（v3.1.5）
- bundled-skills/roadmapping/SKILL.md 存在

### When
- 执行完整 clawdevflow 流程（designing→roadmapping→detailing→coding→reviewing）
- 审阅所有产出文档

### Then
- ✅ PRD.md v3.1.5 包含新规则说明
- ✅ TRD.md v3.1.5 包含技术实现方案
- ✅ bundled-skills/roadmapping/SKILL.md 更新 10 项检查清单为 12 项
- ✅ adapters/opencode.js 更新 roadmapping 任务描述
- ✅ ReviewDesignAgent 审查得分 >= 90%
- ✅ 用户验收通过

---

## REQ-012: ROADMAPPING 环节优化（解决 R4 范围膨胀 + 不生成 SELF-REVIEW.md）

**位置**: L700-770

**版本**: v3.1.6 (2026-04-02)

**类型**: 增量需求（基于 REQ-011）

**父需求**: REQ-011

**问题背景**:
ROADMAPPING 环节 v3.1.5 执行发现两个问题：
1. ⚠️ R4 范围膨胀风险误报（检测到"可选"关键词，但已标注缓解措施）
2. ❌ 生成 SELF-REVIEW.md（增加额外文件，不符合"不生成额外文件"原则）

**需求目标**:
| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **解决 R4 范围膨胀** | 优化 R4 检查规则，减少误报 | R4 检查通过（无误报） |
| **不生成 SELF-REVIEW.md** | 简化输出，只在 critical 项失败时生成 | 无 SELF-REVIEW.md 文件 |

**优化方案**:
1. **R4 规则优化**：
   - 检测到"可能/可选/未来"关键词时，检查是否有缓解措施
   - 如有缓解措施，不判定为问题
   - 只 warning，不影响评分

2. **SELF-REVIEW.md 生成逻辑优化**：
   - critical 项（R0-R3）任一失败 → 生成 SELF-REVIEW.md
   - 全部通过 → 不生成 SELF-REVIEW.md
   - 简化输出，符合"不生成额外文件"原则

**输出要求**:
```
bundled-skills/roadmapping/
└── SKILL.md                  # 更新 R4 规则和 SELF-REVIEW.md 生成逻辑

adapters/
└── opencode.js               # 更新 roadmapping 任务描述
```

**验收标准**:
### Given
- REQUIREMENTS.md 已追加 REQ-012（v3.1.6）
- bundled-skills/roadmapping/SKILL.md v3.1.5 存在

### When
- 重新执行 roadmapping 环节
- 审阅 ROADMAP.md v3.1.6

### Then
- ✅ R4 范围膨胀风险通过（无误报）
- ✅ 不生成 SELF-REVIEW.md
- ✅ 自审阅得分 >= 90%
- ✅ ReviewDesignAgent 审查得分 >= 90%
- ✅ 用户验收通过

---

## REQ-013: DETAILING 审阅 Agent 优化（Hard Gates + 输入输出规范）

**位置**: L780-900

**版本**: v3.1.8 (2026-04-02)

**类型**: 增量需求（基于 REQ-012）

**父需求**: REQ-012

**问题背景**:
DETAILING 环节不存在审阅 Agent，导致：
- ❌ DETAIL.md 质量无法保证
- ❌ 可能遗漏关键设计细节
- ❌ 可能与 PRD/TRD/ROADMAP 不一致
- ❌ CODING 阶段发现设计问题，需要返工
- ❌ 不符合"审阅驱动"设计理念

**需求目标**:
| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **输入/输出规范** | 明确审阅 Agent 输入输出 | 读取 5 个文件，输出 3 项 |
| **Hard Gates** | 3 项 Critical 强门禁 | HG1 Freshness/HG2 可追溯/HG3 可测试 |
| **检查清单** | 10 项检查（5 critical + 5 normal） | Critical 一票否决 |
| **输出格式** | 审阅结论 + 失败项 + 修复建议 | JSON 格式，明确到章节/行号 |

**核心设计**:
1. **输入**（必须读取 5 个文件）:
   - REQUIREMENTS.md（最新需求 source of truth）
   - PRD.md（产品需求）
   - TRD.md（技术设计）
   - ROADMAP.md（开发计划）
   - DETAIL.md（被审阅对象）

2. **输出**（必须生成 3 项）:
   - 审阅结论（pass/conditional/reject）
   - 失败项列表（明确到章节/行号）
   - 修复建议（指出示例）

3. **Hard Gates**（3 项 Critical）:
   - HG1 Freshness 对齐（防止上游变了 DETAIL 还在写旧版本）
   - HG2 需求可追溯（可定位映射，不能凭描述匹配）
   - HG3 验收可测试（否则 coding 只能靠感觉）

4. **检查清单**（10 项）:
   - Critical（5 项）: HG1-3 + D0 章节完整性 + D2 技术一致性
   - Normal（5 项）: D3 计划对齐 + D4-D7 设计质量

**输出要求**:
```
bundled-skills/detailing/
└── SKILL.md                  # 新增审阅 Agent（10 项检查清单）

adapters/
└── opencode.js               # 更新 detailing 任务描述
```

**验收标准**:
### Given
- REQUIREMENTS.md 已追加 REQ-013（v3.1.8）
- bundled-skills/detailing/SKILL.md 存在

### When
- 执行完整 clawdevflow 流程（designing→roadmapping→detailing→coding→reviewing）
- 审阅所有产出文档

### Then
- ✅ PRD.md v3.1.8 包含 DETAILING 审阅 Agent 说明
- ✅ TRD.md v3.1.8 包含技术实现方案
- ✅ bundled-skills/detailing/SKILL.md 新增 10 项检查清单
- ✅ adapters/opencode.js 更新 detailing 任务描述
- ✅ ReviewDesignAgent 审查得分 >= 90%
- ✅ 用户验收通过

---

## REQ-014: DESIGNING 审阅 Agent 修复（v3.1.9）

**位置**: L783-850

**版本**: v3.1.9 (2026-04-07)

**类型**: 问题修复（基于 REQ-006）

**父需求**: REQ-006 (DESIGNING 阶段审阅优化)

**问题背景**:
在使用 ReviewDesignAgent v2.0 过程中发现 3 个关键缺陷：

1. **Freshness Gate 哈希校验缺失** - 只检查 PRD/TRD 是否包含哈希声明格式，但不验证声明的哈希值与 REQUIREMENTS 实际计算值是否一致。PRD 随便写一句"对齐哈希：abc123"也能通过。

2. **需求 ID 正则不统一** - `extractRequirementsWithIds()` 只支持 `REQ-001` 格式，不支持 `REQ-ABC-001` 格式。但 REQUIREMENTS.md 实际需求 ID 格式为 `REQ-(?:[A-Z]+-)?\d+`。

3. **D7 验收标准检查太弱** - 只要 PRD 任何地方出现过 Given/When/Then 就判通过，会被"写了一个示例"轻易糊弄过去，不是逐条验证每条需求的验收标准。

**修复需求**:

1. **Freshness Gate 哈希校验** - PRD/TRD 声明的哈希必须与 REQUIREMENTS 实际计算值一致，不一致则驳回。

2. **需求 ID 正则统一** - 支持 `REQ-(?:[A-Z]+-)?\d+` 格式，与 REQUIREMENTS.md 实际需求 ID 格式一致。

3. **D7 验收标准逐条检查** - 每条需求的 PRD 映射章节内必须包含 Given/When/Then（或前置条件/触发条件/预期结果），不是全局搜索。

**功能需求**:
- ✅ Freshness Gate 增加哈希值对比逻辑
- ✅ `extractRequirementsWithIds()` 正则更新为 `REQ-(?:[A-Z]+-)?\d+`
- ✅ 新增 `checkAcceptanceCriteriaPerRequirement()` 方法，逐条验证验收标准
- ✅ D7 检查点改为调用新方法

**约束条件**:
- 向后兼容，不破坏现有检查逻辑
- 不生成额外文件（仅修改 review-design-v2.js）
- 保持代码风格一致

**验收标准**:
### Given
- ReviewDesignAgent v2.0 存在 3 个缺陷
- REQUIREMENTS.md 已追加 REQ-014

### When
- 执行修复后的 ReviewDesignAgent v2.0
- 运行自测验证

### Then
- ✅ Freshness Gate 能检测哈希不匹配（PRD 随便写哈希会被驳回）
- ✅ 需求 ID 支持 `REQ-ABC-001` 格式
- ✅ D7 逐条验证验收标准（每条需求的 PRD 映射章节内必须包含 Given/When/Then）
- ✅ ReviewDesignAgent 审查得分 >= 90%
- ✅ 用户验收通过

**需求追溯矩阵**:

| 需求 ID | PRD.md 章节 | TRD.md 章节 | 状态 |
|--------|------------|------------|------|
| REQ-014 | 19.1-19.7 | 16.1-16.7 | ⚪ 待映射 |

---

## REQ-015: Designing 环节 Policy 优化（v3.3.0）

**位置**: L851-900

**版本**: v3.3.0 (2026-04-07)

**类型**: 增量需求（基于 REQ-003）

**父需求**: REQ-003 (审阅驱动 + 会话隔离 + 工具无关)

**问题背景**:
在 v3.1.x 系列修复完成后，需要提升流程的可维护性和用户体验：
1. 配置写死后难以调整（需要改代码）
2. 小需求也要两次确认，流程繁琐
3. conditional 一律阻断，不够灵活
4. 配置错误难以发现

**增量需求**:
1. **Policy 配置化** - 将决策规则移到 config.yaml
2. **小需求合并确认** - <=2 个需求可以 one_step 模式
3. **conditional 分级** - blocker vs warning 分级处理
4. **Policy 验证器** - 启动时验证配置合法性

**功能需求**:
- ✅ config.yaml 新增 designing.policy 配置
- ✅ 支持 auto/one_step/two_step 三种模式
- ✅ severity_model 定义 blocker 和 warning 列表
- ✅ 小需求标准：max_requirements/max_prd_lines/max_trd_lines
- ✅ Policy 验证器启动时验证配置

**验收标准**:
### Given
- REQUIREMENTS.md 已追加 REQ-015（v3.3.0）
- config.yaml 已配置 designing.policy

### When
- 执行 clawdevflow 流程引擎
- 启动 WorkflowOrchestrator

### Then
- ✅ Policy 配置正确加载
- ✅ 启动时自动验证 policy 配置
- ✅ 小需求自动使用 one_step 模式
- ✅ blocker 阻断流程，warning 只记录
- ✅ 配置错误时抛出友好提示

**需求追溯矩阵**:

| 需求 ID | PRD.md 章节 | TRD.md 章节 | 状态 |
|--------|------------|------------|------|
| REQ-015 | 待映射 | 待映射 | ⚪ 待映射 |

---

## REQ-016: Designing Policy 优化完整修复（v3.4.0 Stable）

**位置**: L901-950

**版本**: v3.4.0 (2026-04-07)

**类型**: 增量需求（基于 REQ-015）

**父需求**: REQ-015 (Designing Policy 优化)

**问题背景**:
在 REQ-015 实现后，通过 GPT-5.2 审阅发现以下问题需要修复：
1. executeDesigning() 在等待确认时仍会执行生成
2. executeDesigning() 返回语义不一致（waiting confirmation 返回 success=false）
3. executeStage 可能误调用处理 designing
4. stageStatus 与通用 stage state 可能漂移

**增量需求**:
1. **断点恢复不重复生成** - executeDesigning() 开头检查 stageStatus，等待确认中跳过生成
2. **返回语义统一** - waiting confirmation 返回 success=true, completed=false
3. **executeStage guard** - 禁止 executeStage 处理 designing
4. **stage state 同步** - TRD_APPROVED 和 RETRY_EXHAUSTED 时同步 updateStage

**功能需求**:
- ✅ executeDesigning() 检查 stageStatus (prd_confirm_pending/trd_confirm_pending/passed/blocked)
- ✅ waiting confirmation 返回 {success: true, completed: false, reason: WAITING_CONFIRMATION}
- ✅ executeStage() 开头检查 stageName === 'designing'，抛出错误
- ✅ approveTRD() 成功后同步 updateStage('designing', 'passed')
- ✅ RETRY_EXHAUSTED 时同步 updateStage('designing', 'blocked')

**验收标准**:
### Given
- REQUIREMENTS.md 已追加 REQ-016（v3.4.0）
- 部署 ClawDevFlow v3.4.0 到 ~/.openclaw/skills/clawdevflow/

### When
- 执行 clawdevflow 流程引擎
- 执行 designing 环节

### Then
- ✅ prd_confirm_pending/trd_confirm_pending 状态下跳过生成
- ✅ passed 状态下返回 completed=true
- ✅ blocked 状态下返回 BLOCKED
- ✅ executeStage('designing') 抛出错误
- ✅ TRD_APPROVED 时 stageStatus 和通用 stage state 都为 passed
- ✅ RETRY_EXHAUSTED 时 stageStatus 和通用 stage state 都为 blocked

**需求追溯矩阵**:

| 需求 ID | PRD.md 章节 | TRD.md 章节 | 状态 |
|--------|------------|------------|------|
| REQ-016 | 待映射 | 待映射 | ⚪ 待映射 |

---

*需求说明文档 by openclaw-ouyp*  
**版本**: v3.4.0 (Stable) | **日期**: 2026-04-07 | **Git Commit**: 待计算
