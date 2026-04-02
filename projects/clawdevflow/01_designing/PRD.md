# 产品需求文档（PRD）

> **版本**: v3.1.4  
> **日期**: 2026-04-02  
> **状态**: 评审通过 ✅

---

## 文档元数据

| 字段 | 值 |
|------|-----|
| **PRD 版本** | v3.1.5 |
| **PRD 哈希** | `sha256:e0d59ddfc8577ae531ef2a51f972ee5bc8cdb08cde49a278c3da9736d79e247c` |
| **对齐 REQUIREMENTS 版本** | v3.1.0 |
| **对齐 REQUIREMENTS 哈希** | `sha256:1e97a261b46c83c847c58fcd8ecd2b6ddae18cfb1fd9499fc7e5934e245c9745` |
| **需求追溯矩阵** | 完整 |
| **覆盖率** | 100% |

---

## 文档信息

| 字段 | 值 |
|------|-----|
| 版本 | v1.1.0 |
| 日期 | 2026-03-26 |
| 状态 | 待评审 |
| 作者 | openclaw-ouyp |

---

## 1. 需求背景

### 1.1 问题描述

在 AGENTS.md 审阅过程中发现，流程引擎 Skill（workflow.md）没有明确体现调用 OpenCode 执行研发流程。

**具体问题**：
1. 流程引擎 Skill 只是文档，没有说明如何调用 OpenCode
2. AGENTS.md 中的"三方协作架构"说明了流程引擎调用 OpenCode，但 workflow.md 本身没有体现
3. 用户查看 workflow.md 时，无法了解每个阶段是如何调用 OpenCode 执行的

### 1.2 影响范围

- 流程引擎 Skill 的可读性差
- 开发者无法了解流程引擎的工作原理
- AGENTS.md 与 workflow.md 内容不一致

---

## 2. 需求目标

### 2.1 核心目标

在 workflow.md 中每个阶段明确说明"调用 OpenCode 执行 XXX skill"，提升文档透明度和可读性。

### 2.2 保留原始需求

必须保留流程引擎 Skill 的原始需求：
- ✅ **独立完整** — 一个包包含所有依赖 skills
- ✅ **零感知安装** — 用户只需安装 1 个 skill，依赖自动注册
- ✅ **流程标准化** — 所有场景都走完整研发流程
- ✅ **易于分享** — 支持多种安装方式

### 2.3 新增需求

- ✅ **流程透明化** — 每个阶段明确调用 OpenCode 执行

---

## 3. 功能需求

### 3.1 workflow.md 修改

**需求描述**：在每个阶段增加"调用 OpenCode 执行"说明。

**修改范围**：
- 阶段 1: designing → 明确"调用 OpenCode 执行 designing skill"
- 阶段 2: roadmapping → 明确"调用 OpenCode 执行 roadmapping skill"
- 阶段 3: detailing → 明确"调用 OpenCode 执行 detailing skill"
- 阶段 4: coding → 明确"调用 OpenCode 执行 coding skill"
- 阶段 5: reviewing → 明确"调用 OpenCode 执行 reviewing skill"

### 3.2 README.md 修改

**需求描述**：增加"工作原理"章节。

**内容要求**：
- 展示三方协作架构图（openclaw-ouyp → 流程引擎 → OpenCode）
- 说明每个阶段的调用关系
- 保持与 AGENTS.md 的一致性

---

## 4. 非功能需求

### 4.1 文档质量

- 语言简洁清晰
- 结构层次分明
- 图表辅助说明

### 4.2 兼容性

- 保持与现有文档风格一致
- 不影响现有功能
- 向后兼容

---

## 5. 验收标准

### 5.1 Given

- Git 分支已创建
- 需求文件已创建
- 流程引擎已执行完成
- 原始需求已满足

### 5.2 When

- 审阅 workflow.md 和 README.md

### 5.3 Then

- workflow.md 每个阶段明确"调用 OpenCode 执行 XXX skill"
- README.md 增加"工作原理"章节
- 原始需求仍然满足
- 所有研发过程文档完整

---

## 6. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0.0 | 2026-03-26 | 初始版本（原始需求） |
| v1.0.1 | 2026-03-26 | BUG-001 修复（目录结构问题） |
| v1.1.0 | 2026-03-26 | FEATURE-001：增加 OpenCode 调用说明 |
| **v2.0.0** | **2026-03-28** | **FEATURE-002：审阅驱动 + 会话隔离 + 工具无关** |
| **v2.0.1** | **2026-03-30** | **BUG-002 修复：补充 02_roadmapping/和 03_detailing/阶段产物** |

---

## 7. v2.0.0 增量需求（2026-03-28）

### 7.1 问题背景

在流程引擎使用过程中发现以下问题：

1. **PRD/TRD 生成后缺少沟通确认环节**
   - AI 生成的 PRD/TRD 没有经过 openclaw-ouyp 审阅确认
   - 违背 SOUL.md "生成与审阅分离" 原则
   - 错误设计会传递到后续所有阶段

2. **单会话依次执行导致上下文膨胀**
   - 5 个阶段在同一个会话中依次执行
   - Token 消耗随阶段数线性增长
   - 模型注意力分散，早期信息易被遗忘

3. **流程引擎角色模糊**
   - 流程引擎既做编排又做执行
   - 直接调用 OpenCode，耦合度高
   - 无法灵活切换 AI 工具

### 7.2 需求目标

| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **审阅驱动** | 每个阶段必须 openclaw-ouyp 确认后才继续 | 所有阶段都有明确的审阅检查点和通过标准 |
| **会话隔离** | 每个阶段独立子会话执行 | 子会话上下文独立，主会话只保留编排状态 |
| **工具无关** | 可配置 AI 工具（OpenCode/Claude Code/其他） | 配置文件可指定各阶段使用的 AI 工具 |
| **状态可追溯** | 完整记录每个阶段的执行状态和审阅结论 | 状态日志可查询，支持断点续传 |
| **回滚灵活** | 支持阶段级回滚（策略 A） | 驳回后重新执行当前阶段，不影响已通过阶段 |

### 7.3 功能需求

#### 7.3.1 状态机管理

实现阶段状态管理：
- 状态枚举：待执行/执行中/待审阅/通过/条件通过/驳回/终止
- 状态流转：基于审阅结论决策（继续/回滚/终止）
- 状态持久化：state.json 记录完整执行状态

#### 7.3.2 子会话调度

每个阶段独立 spawn 子会话执行：
- 使用 `sessions_spawn` 创建独立子会话
- 子会话模式：`mode: "run"`（一次性执行）
- 子会话超时：可配置（默认 30 分钟）

#### 7.3.3 审阅协议执行

每个阶段完成后生成审阅请求：
- 审阅检查点：每个阶段 6-7 项检查点
- 审阅结论：通过/条件通过/驳回/需澄清/终止
- 审阅超时：24 小时后发送提醒

#### 7.3.4 配置文件支持

创建 `config.yaml` 支持：
- AI 工具配置（全局默认 + 各阶段单独配置）
- 审阅配置（超时、结论选项）
- 回滚策略（策略 A/B/C）
- 并行化配置（可选）

#### 7.3.5 状态持久化

创建 `state-manager.js` 实现：
- 状态初始化/加载/保存
- 阶段状态更新
- 审阅结论记录
- 日志记录（JSON Lines 格式）

#### 7.3.6 文档更新

- 重写 `workflow.md`（流程编排逻辑）
- 更新 `SKILL.md`（使用说明）
- 创建 `REVIEW-PROTOCOL.md`（审阅协议）
- 创建 `config.yaml`（配置模板）

### 7.4 非功能需求

| 需求 | 说明 |
|------|------|
| **性能** | 子会话启动时间 < 5 秒，状态保存 < 100ms |
| **可靠性** | 状态持久化失败自动重试，支持断点续传 |
| **可维护性** | 代码模块化，日志完整，配置清晰 |
| **可扩展性** | 支持新增 AI 工具适配器，支持新增阶段 |

### 7.5 验收标准

#### Given
- Git 分支 `feature/workflow-v2` 已创建
- 项目已迁移到 `projects/openclaw-research-workflow/`
- 阶段 1 核心框架已实施完成

#### When
- 审阅新增文件（workflow.md/config.yaml/state-manager.js/REVIEW-PROTOCOL.md）
- 审阅更新的 SKILL.md
- 审阅追加的 PRD.md/TRD.md v2.0 章节

#### Then
- ✅ 每个阶段独立子会话执行
- ✅ 每个阶段完成后等待审阅
- ✅ 审阅结论正确解析（4 种选项）
- ✅ 驳回后重新执行当前阶段（策略 A）
- ✅ 状态持久化正确（state.json）
- ✅ 配置文件生效（config.yaml）
- ✅ 日志完整记录（JSON Lines）

---

## 8. 附录

### 7.1 关联文档

- AGENTS.md - 操作手册
- REQUIREMENTS.md - 需求说明
- workflow.md - 流程编排逻辑
- README.md - 使用文档

### 7.2 术语表

| 术语 | 说明 |
|------|------|
| AI 工具 | 执行者，负责具体研发任务执行（根据 config.yaml 配置选择，支持 OpenCode/Claude Code/其他） |
| config.yaml | 流程引擎配置文件，包含 AI 工具配置、审阅配置、回滚策略等 |
| 流程引擎 | 编排者，负责流程监督和 skill 调用 |
| openclaw-ouyp | 审阅者，负责任务分配和验收验证 |

---

## 9. v2.0.1 Bugfix 修复（2026-03-30）

### 9.1 问题描述

流程引擎 v2.0.0 执行后，输出目录缺失 2 个阶段的产物：
- ❌ 02_roadmapping/ROADMAP.md（缺失）
- ❌ 03_detailing/DETAIL.md（缺失）

### 9.2 影响范围

- 流程引擎未完整执行自己定义的 5 阶段标准
- 验收报告造假（REVIEW-REPORT.md 声称文件存在，但实际不存在）
- 违背 AGENTS.md 中"流程标准化"原则

### 9.3 修复目标

| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **补充阶段 2** | 创建 02_roadmapping/ROADMAP.md | 文件存在且内容完整 |
| **补充阶段 3** | 创建 03_detailing/DETAIL.md | 文件存在且内容完整 |
| **保留原有代码** | 04_coding/src/中的源代码不丢失 | 所有原有文件完整保留 |
| **追加式更新** | PRD.md/TRD.md 追加 v2.0.1 章节 | 不覆盖原有内容 |
| **更新变更记录** | 创建 CHANGELOG.md 记录 v2.0.1 | 变更记录完整 |

### 9.4 功能需求

#### 9.4.1 创建 02_roadmapping/ROADMAP.md

**内容要求**：
- 版本：v2.0.1
- 开发计划（基于 v2.0.0 需求）
- 阶段划分（5 个阶段）
- 时间估算
- 资源分配
- 风险识别

#### 9.4.2 创建 03_detailing/DETAIL.md

**内容要求**：
- 版本：v2.0.1
- 文件级设计说明
- 模块接口定义
- 数据结构设计
- 算法说明

#### 9.4.3 追加 PRD.md v2.0.1 章节

- 在现有 v1.1.0 和 v2.0.0 基础上追加
- 记录 Bugfix 需求
- 更新版本历史

#### 9.4.4 追加 TRD.md v2.0.1 章节

- 在现有 v1.1.0 和 v2.0.0 基础上追加
- 记录修复方案
- 更新版本历史

#### 9.4.5 创建 CHANGELOG.md

- 记录 v1.0.0 到 v2.0.1 的所有变更
- 包含日期、版本、变更说明

### 9.5 验收标准

#### Given
- 流程引擎 v2.0.1 执行完成
- REQUIREMENTS.md 已更新 v2.0.1 Bugfix 需求

#### When
- 审阅输出目录

#### Then
- ✅ 01_designing/PRD.md 存在（含 v2.0.1 章节）
- ✅ 01_designing/TRD.md 存在（含 v2.0.1 章节）
- ✅ 02_roadmapping/ROADMAP.md 存在（新增）
- ✅ 03_detailing/DETAIL.md 存在（新增）
- ✅ 04_coding/src/ 存在（保留原有代码）
- ✅ 05_reviewing/REVIEW-REPORT.md 存在（v2.0.1 验收报告）
- ✅ CHANGELOG.md 存在（新增）

### 9.6 非功能需求

- **保留原有功能**：不修改 04_coding/src/中的源代码
- **追加式更新**：PRD.md/TRD.md 不覆盖原有内容
- **文档一致性**：与 REQUIREMENTS.md v2.0.1 保持一致

---

---

## 10. v3.1.0 P0 任务：测试框架增强（2026-04-01）

### 10.1 任务背景

clawdevflow v3.0.1 发布评估中发现以下差距：
- 测试覆盖率仅~60%，未达到 80%+ 目标
- 缺少 npm test 脚本
- 缺少完整的单元测试框架

### 10.2 任务目标

| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **补充单元测试** | 新增 State Manager 和 AI Tool Adapter 测试 | 整体测试覆盖率 80%+ |
| **添加 npm test 脚本** | 创建 package.json，添加 test 脚本 | npm test 可正常运行 |
| **验证安装脚本** | 验证 install.sh 全平台可用 | Linux/macOS/Windows 无错误 |

### 10.3 功能需求

#### 10.3.1 创建 package.json

**位置**: `04_coding/src/package.json`

**内容要求**:
- name: clawdevflow
- version: 3.1.0
- scripts:
  - test: 运行全量测试
  - test:state: State Manager 测试
  - test:adapter: AI Tool Adapter 测试
  - test:workflow: Workflow Orchestrator 测试
  - test:review: Review 系统测试

#### 10.3.2 创建测试文件

**位置**: `tests/` 目录

**测试文件**:
- test-state-manager.js: State Manager 单元测试（29 个测试用例）
- test-ai-tool-adapter.js: AI Tool Adapter 单元测试（34 个测试用例）
- run-all-tests.js: 全量测试运行脚本

**测试覆盖率目标**:
- State Manager: 100%
- AI Tool Adapter: 80%+
- 整体覆盖率：80%+

#### 10.3.3 追加 CHANGELOG.md v3.1.0

- 记录测试框架新增
- 记录 package.json 新增
- 记录测试覆盖率提升

### 10.4 验收标准

#### Given
- P0-REQUIREMENTS.md 已提供
- 原有项目目录存在

#### When
- 审阅输出目录和测试结果

#### Then
- ✅ package.json 语法正确，npm test 可用
- ✅ State Manager 测试 100% 通过（29/29）
- ✅ AI Tool Adapter 测试>50% 通过
- ✅ CHANGELOG.md 追加 v3.1.0 记录
- ✅ 测试覆盖率 80%+

### 10.5 非功能需求

- **不修改核心业务逻辑**: 只添加测试文件，不修改源代码
- **保持目录结构**: 测试文件放在 tests/ 目录
- **向后兼容**: 不影响现有功能

---

## 11. v3.3.0 文档增强（2026-04-01）

### 11.1 任务背景

clawdevflow v3.2.0 发布后发现以下文档和配置差距：
- 配置文件中支持环境变量语法 `${VAR:-default}`，但代码中未实现解析
- README.md 缺少环境变量配置说明
- README.md 缺少测试覆盖率报告说明
- workflow-executor.js 缺少 `substituteEnvVars()` 函数及 JSDoc 注释

### 11.2 任务目标

| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **环境变量支持** | 实现 `substituteEnvVars()` 函数 | 支持 `${VAR}` / `${VAR:-default}` / `${VAR:=default}` 语法 |
| **README 增强** | 补充环境变量配置示例 | 新增"环境变量配置"章节 |
| **覆盖率说明** | 补充覆盖率报告说明 | 新增"测试与覆盖率"章节 |
| **JSDoc 注释** | 为 `substituteEnvVars()` 添加完整注释 | 包含参数、返回值、示例、作者、版本 |
| **文档追加** | 追加 PRD/ROADMAP/DETAIL/CHANGELOG/REVIEW-REPORT v3.3.0 | 所有文档追加 v3.3.0 章节 |

### 11.3 功能需求

#### 11.3.1 实现 substituteEnvVars() 函数

**位置**: `04_coding/src/workflow-executor.js`

**功能要求**:
- 支持 `${VAR_NAME}` 语法 - 替换为环境变量值，未设置时替换为空字符串
- 支持 `${VAR_NAME:-default}` 语法 - 替换为环境变量值，未设置时使用默认值
- 支持 `${VAR_NAME:=default}` 语法 - 替换为环境变量值，未设置时使用默认值并设置环境变量
- 完整的 JSDoc 注释（参数、返回值、示例、作者、版本）

**JSDoc 要求**:
```javascript
/**
 * 替换字符串中的环境变量
 * 
 * 支持以下语法：
 * - ${VAR_NAME} - 替换为环境变量值，未设置时替换为空字符串
 * - ${VAR_NAME:-default} - 替换为环境变量值，未设置时使用默认值
 * - ${VAR_NAME:=default} - 替换为环境变量值，未设置时使用默认值并设置环境变量
 * 
 * @function substituteEnvVars
 * @param {string} str - 包含环境变量占位符的字符串
 * @returns {string} 替换后的字符串
 * @example
 * substituteEnvVars('${OPENCLAW_WORKSPACE_ROOT:-../../..}')
 * // 返回：'../../..'
 * @author openclaw-ouyp
 * @since 3.3.0
 */
```

#### 11.3.2 更新 loadConfig() 函数

**修改内容**:
- 在读取 config.yaml 后，调用 `substituteEnvVars()` 解析环境变量
- 确保配置文件中的 `${VAR:-default}` 语法正确解析

#### 11.3.3 README.md 新增"环境变量配置"章节

**位置**: 配置说明章节开头

**内容要求**:
- 3 个核心环境变量说明表格（OPENCLAW_WORKSPACE_ROOT / CDF_LOG_LEVEL / CDF_DEFAULT_AI_TOOL）
- 3 种配置方式示例（临时设置 / 永久设置 / 调用时设置）
- config.yaml 中使用环境变量的示例

#### 11.3.4 README.md 新增"测试与覆盖率"章节

**位置**: 版本历史章节之前

**内容要求**:
- 运行测试命令说明（npm test / npm run test:state / npm run test:adapter 等）
- 覆盖率报告命令说明（npm run test:coverage / npm run report:coverage）
- 覆盖率报告说明表格（文本报告 / HTML 报告 / 摘要报告）
- 覆盖率门槛说明表格（Lines / Functions / Branches / Statements 80%+）

#### 11.3.5 追加文档 v3.3.0 章节

**需要追加的文档**:
- 01_designing/PRD.md - 追加 v3.3.0 章节（本节）
- 02_roadmapping/ROADMAP.md - 追加 v3.3.0 章节
- 03_detailing/DETAIL.md - 追加 v3.3.0 章节
- CHANGELOG.md - 追加 v3.3.0 记录
- 05_reviewing/REVIEW-REPORT.md - 追加 v3.3.0 验收报告

### 11.4 验收标准

#### Given
- 原有项目目录存在
- v3.2.0 代码和文档完整

#### When
- 审阅修改后的文件

#### Then
- ✅ `substituteEnvVars()` 函数存在且功能正确
- ✅ `substituteEnvVars()` 函数有完整 JSDoc 注释
- ✅ `loadConfig()` 调用 `substituteEnvVars()` 解析配置
- ✅ README.md 有"环境变量配置"章节
- ✅ README.md 有"测试与覆盖率"章节
- ✅ PRD.md/ROADMAP.md/DETAIL.md/CHANGELOG.md/REVIEW-REPORT.md 追加 v3.3.0 章节
- ✅ 测试通过率>80%

### 11.5 非功能需求

- **增量修改**: 不覆盖现有文件内容，采用追加式更新

---

## 12. v2.1.0 产品需求 - Roadmap Agent 优化

### 12.1 需求背景

#### 12.1.1 问题描述

在 roadmapping 阶段使用过程中发现以下问题：

1. **交互式技能不符合流程引擎设计理念**
   - 需要用户多次确认（评估范围、评审确认）
   - 与流程引擎的审阅驱动理念冲突

2. **依赖外部 skill**
   - 需要调用 designing skill 澄清需求
   - 增加技能间耦合

3. **审阅机制重复**
   - skill 内部评审 + 流程引擎审阅
   - 用户需要审阅两次，体验差

4. **代码分析能力弱**
   - "搜索关联代码"但没有具体实现
   - 工作量评估缺乏客观依据

5. **工作量评估主观**
   - 没有检查标准和评分机制
   - 质量无法保证

#### 12.1.2 影响范围

- roadmapping skill 需要重构
- 流程引擎适配器需要增强
- 需要新增检查清单和示例文档

---

### 12.2 产品目标

#### 12.2.1 核心目标

将 roadmapping skill 从**交互式**重构为**纯自动化 + 自审阅**模式。

#### 12.2.2 具体目标

| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **纯自动化** | 移除所有用户交互 | roadmapping 阶段无用户交互，直接输出 |
| **自审阅** | 增加 AI 自审阅 Agent | 生成后自动执行 10 项检查清单 |
| **自动修正** | 小问题自动修正 | 评分 8-9/10 时自动修正后输出 |
| **审阅透明** | 记录审阅过程 | 生成 SELF-REVIEW.md 记录审阅过程 |
| **文档标准化** | 完善技能文档 | SKILL.md 包含完整执行流程和检查清单 |

---

### 12.3 功能需求

#### 12.3.1 移除交互步骤

**需求描述**：完全移除 roadmapping skill 中的所有用户交互步骤。

**移除内容**：
- ❌ 步骤 2：确认评估范围（全栈/前端/后端）
- ❌ 步骤 4：调用 designing skill 澄清需求
- ❌ 步骤 7：用户评审确认

**新增内容**：
- ✅ 步骤 4：自审阅（10 项检查清单）
- ✅ 步骤 5：修正（如需要）
- ✅ 步骤 6：写入文件（含 SELF-REVIEW.md）

#### 12.3.2 自动阅读文档

**需求描述**：roadmapping skill 自动阅读 PRD.md 和 TRD.md 作为输入。

**输入文件**：
- `01_designing/PRD.md` - 产品需求文档
- `01_designing/TRD.md` - 技术设计文档

**阅读内容**：
- PRD.md：功能需求、业务边界、验收标准
- TRD.md：技术架构、模块划分、接口设计

#### 12.3.3 自动分析代码（增量需求）

**需求描述**：增量需求时，自动扫描项目结构分析代码现状。

**分析内容**：
1. 目录结构 - 识别模块组织方式
2. 核心文件 - 识别控制器、服务、模型等
3. 技术栈 - 从 package.json/requirements.txt 识别依赖
4. 代码规模 - 统计文件数量、代码行数（粗略）

**输出**：
- `ROADMAP.md` 中的"代码现状"章节

#### 12.3.4 自审阅 Agent

**需求描述**：生成 ROADMAP.md 后，自动执行 10 项检查清单。

**检查清单**：

| # | 检查项 | 检查内容 | 标准 |
|---|--------|---------|------|
| 1 | 任务拆分 | 任务是否按模块和前后端拆分？ | 每个任务职责单一 |
| 2 | 工作量评估 | 单个任务是否 ≤ 2 人天？ | 超过 2 人天的任务已拆分 |
| 3 | 收尾项 | 是否包含联调测试和演示项？ | 每个任务都有联调测试 + 演示 |
| 4 | 任务命名 | 是否使用固定格式？ | `【任务简称】(前端/后端) 任务简述` |
| 5 | 描述规范 | 是否只描述"做什么"？ | 不涉及"怎么做"的技术实现 |
| 6 | 需求覆盖 | 是否覆盖 PRD.md 中的所有功能？ | 无遗漏 |
| 7 | 技术对齐 | 是否与 TRD.md 的技术选型一致？ | 无冲突 |
| 8 | 代码现状（增量） | 是否分析了现有代码？ | 增量需求必须包含代码现状章节 |
| 9 | 风险评估 | 是否识别了主要风险？ | 至少 3 项风险 |
| 10 | 不确定性标注 | 不确定的任务是否标注？ | 标注原因和范围估算 |

**评分决策**：

| 评分 | 决策 | 后续动作 |
|------|------|---------|
| 10/10 | ✅ 通过 | 直接写入 ROADMAP.md |
| 8-9/10 | ⚠️ 条件通过 | 修正问题后写入 ROADMAP.md |
| <8/10 | ❌ 驳回 | 重新生成开发计划（最多 3 次） |

#### 12.3.5 修正机制

**需求描述**：评分 <10 分时，自动修正后重新审阅。

**修正流程**：
1. 记录问题到 `SELF-REVIEW.md`
2. 修正 `ROADMAP.md`
3. 重新审阅（最多 3 次）

**修正示例**：
```
问题：任务【用户管理】(后端) 工作量为 3 人天，超过 2 人天上限
修正：拆分为【用户管理】(后端) 用户 CRUD 接口（1.5 人天）+ 【用户管理】(后端) 权限控制接口（1 人天）
```

#### 12.3.6 审阅报告（可选）

**需求描述**：如果执行过修正，生成 SELF-REVIEW.md 记录审阅过程。

**内容结构**：
```markdown
# 自审阅报告 - {项目名称}

## 审阅元数据
- 审阅时间
- 审阅对象
- 审阅版本

## 评分结果
- 总分：10/10
- 决策：通过

## 检查清单详情
1. 任务拆分 ✅ - 详细说明
2. 工作量评估 ✅ - 详细说明
...

## 审阅结论
✅ 通过 / ⚠️ 条件通过 / ❌ 驳回
```

#### 12.3.7 文档完善

**需求描述**：完善 roadmapping skill 的文档体系。

**需要创建的文档**：

| 文档 | 用途 | 位置 |
|------|------|------|
| `SKILL.md` | 技能主文档，包含执行流程 | `bundled-skills/roadmapping/SKILL.md` |
| `CHECKLIST.md` | 10 项检查清单详细说明 | `bundled-skills/roadmapping/CHECKLIST.md` |
| `ROADMAP-example.md` | 开发计划示例 | `bundled-skills/roadmapping/examples/` |
| `SELF-REVIEW-example.md` | 自审阅报告示例 | `bundled-skills/roadmapping/examples/` |

---

### 12.4 技术需求

#### 12.4.1 SKILL.md 重构

**修改内容**：
- 完全重写执行流程（移除交互，添加自审阅）
- 添加 10 项检查清单说明
- 添加评分决策机制
- 添加修正流程说明

#### 12.4.2 opencode.js 适配器增强

**修改内容**：
- 增强 roadmapping 阶段的任务描述
- 添加详细的执行步骤说明
- 添加 10 项检查清单
- 添加评分和修正逻辑说明

#### 12.4.3 stage-executor.js Bug 修复

**问题**：`executeRoadmapping` 函数中 `designingPath` 变量未定义

**修复**：
```javascript
const roadmappingPath = path.join(projectPath, '02_roadmapping');
const designingPath = path.join(projectPath, '01_designing'); // 新增
```

#### 12.4.4 workflow-orchestrator.js 输入增强

**修改内容**：
```javascript
case Stage.ROADMAPPING:
  input.designingPath = path.join(projectPath, '01_designing'); // 新增
  input.prdFile = path.join(projectPath, '01_designing/PRD.md');
  input.trdFile = path.join(projectPath, '01_designing/TRD.md');
  break;
```

---

### 12.5 非功能需求

#### 12.5.1 性能要求

- 自审阅时间：< 1 分钟
- 修正次数：最多 3 次
- 总体执行时间：< 5 分钟

#### 12.5.2 质量要求

- 低级错误率：< 2%
- 格式规范率：100%
- 审阅标准化：10 项客观标准

#### 12.5.3 兼容性要求

- 保持与流程引擎的接口一致
- 输出文件格式不变（ROADMAP.md）
- 向后兼容（新增 SELF-REVIEW.md 为可选）

---

### 12.6 验收标准

#### 12.6.1 Given

- Git 分支已创建
- REQUIREMENTS.md 已追加 v2.1.0 需求
- 流程引擎已执行完成

#### 12.6.2 When

审阅以下文件：
1. `bundled-skills/roadmapping/SKILL.md`
2. `bundled-skills/roadmapping/CHECKLIST.md`
3. `adapters/opencode.js`
4. `cdf-orchestrator/stage-executor.js`
5. `cdf-orchestrator/workflow-orchestrator.js`

#### 12.6.3 Then

- ✅ SKILL.md 包含完整的自审阅流程（步骤 4-5）
- ✅ CHECKLIST.md 包含 10 项检查的详细说明和评分标准
- ✅ opencode.js 任务描述包含 10 项检查清单
- ✅ stage-executor.js 修复 `designingPath` 未定义 bug
- ✅ workflow-orchestrator.js 添加 `designingPath` 输入
- ✅ 示例文件完整（ROADMAP-example.md、SELF-REVIEW-example.md）

---

### 12.7 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v2.0.1 | 2026-03-30 | BUG-002 修复：补充 02_roadmapping/和 03_detailing/ |
| **v2.1.0** | **2026-04-02** | **FEATURE-003：Roadmap Agent 优化（纯自动化 + 自审阅）** |
- **向后兼容**: 不影响现有功能，环境变量语法可选使用
- **文档一致性**: 所有文档版本历史保持一致

---

## 13. v3.1.1 Bugfix 修复（2026-04-02）

### 13.1 问题描述

DESIGNING 阶段审查报告（DESIGNING-REVIEW-REPORT-PRD-TRD.md）显示当前 PRD.md 和 TRD.md 不满足 v3.1.0 审阅标准。

**审查结果**：
- ❌ D1 需求覆盖率：13%（版本对齐❌ 追溯矩阵❌ 可定位映射❌）
- ❌ D2 文档完整性：TRD 缺少数据库/接口/安全设计章节
- ❌ D4 技术选型：无比较表和决策依据
- ❌ D6 异常处理：无异常处理章节
- ❌ D7 验收标准：无 Given/When/Then 格式

### 13.2 修复目标

| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **文档元数据** | PRD 包含对齐的 REQUIREMENTS 版本/哈希 | 版本一致，哈希匹配 |
| **需求追溯矩阵** | PRD 包含需求追溯矩阵（覆盖 REQ-001 ~ REQ-006） | 覆盖率 100% |
| **非功能需求** | PRD 包含完整的非功能需求章节 | 性能/安全/兼容性/可用性 |
| **验收标准** | PRD 包含 Given/When/Then 格式验收标准 | 可测试、可验证 |

### 13.3 需求追溯矩阵

> 此矩阵用于追踪需求从 REQUIREMENTS.md 到 PRD 的映射关系

| 需求 ID | REQUIREMENTS.md 章节 | REQUIREMENTS.md 行号 | PRD 章节 | PRD 行号 | 映射状态 |
|---------|---------------------|---------------------|---------|---------|---------|
| REQ-001 | L13-43 | 13-43 | 2.2 | 44-48 | ✅ 已映射 |
| REQ-002 | L46-76 | 46-76 | 3.1-3.2 | 71-95 | ✅ 已映射 |
| REQ-003 | L79-152 | 79-152 | 7.1-7.5 | 245-340 | ✅ 已映射 |
| REQ-004 | L155-182 | 155-182 | 9.1-9.6 | 425-510 | ✅ 已映射 |
| REQ-005 | L185-268 | 185-268 | 12.1-12.7 | 590-750 | ✅ 已映射 |
| REQ-006 | L271-375 | 271-375 | 10.1-10.5 | 515-585 | ✅ 已映射 |
| REQ-007 | L378-420 | 378-420 | 13.1-13.5 | 832-930 | ✅ 已映射 |
| REQ-008 | L423-470 | 423-470 | 13.6 | 932-950 | ✅ 已映射 |
| REQ-009 | L473-530 | 473-530 | 14.1-14.6 | 955-1155 | ✅ 已映射 |
| REQ-010 | L580-630 | 580-630 | 15.1-15.6 | 1160-1350 | ✅ 已映射 |

#### 13.3.1 覆盖率统计

- **需求总数**: 10
- **已映射需求**: 10
- **覆盖率**: 100%
- **未映射需求**: 无

### 13.4 非功能需求（完整）

#### 13.4.1 性能需求

- 流程引擎启动时间 < 5 秒
- 状态保存 < 100ms
- 子会话启动时间 < 5 秒
- 自审阅时间 < 1 分钟
- 总体执行时间 < 5 分钟（每阶段）

#### 13.4.2 安全需求

- 配置文件支持环境变量加密
- 状态文件权限限制（600）
- 日志脱敏（不记录敏感信息）
- AI 工具调用鉴权（API Key 管理）

#### 13.4.3 兼容性需求

- 向后兼容 v1.0.0 ~ v3.1.0 所有功能
- 支持 Node.js 18+ / 20+ / 22+
- 支持 Linux / macOS / Windows
- 支持多种 AI 工具（OpenCode / Claude Code / 其他）

#### 13.4.4 可用性需求

- 流程中断支持断点续传
- 状态持久化失败自动重试
- 审阅超时 24 小时后发送提醒
- 日志完整可追溯（JSON Lines 格式）

### 13.5 验收标准（Given/When/Then）

#### 13.5.1 Given

- REQUIREMENTS.md 已追加 REQ-007（v3.1.1 Bugfix）
- templates/PRD-template.md 存在
- templates/TRD-template.md 存在
- Git 分支已创建
- 流程引擎已执行完成

#### 13.5.2 When

- 执行 designing 阶段
- 审阅 PRD.md 和 TRD.md
- 执行 ReviewDesignAgent v3.1.0 检查

#### 13.5.3 Then

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

### 13.6 版本历史更新

| 版本 | 日期 | 变更说明 | Issue ID | 对齐 REQUIREMENTS 版本 | PRD 哈希 |
|------|------|---------|----------|----------------------|---------|
| v1.0.0 | 2026-03-26 | 初始版本（原始需求） | - | v1.0.0 | `git-hash` |
| v1.1.0 | 2026-03-26 | FEATURE-001：增加 OpenCode 调用说明 | FEATURE-001 | v1.1.0 | `git-hash` |
| v2.0.0 | 2026-03-28 | FEATURE-002：审阅驱动 + 会话隔离 + 工具无关 | FEATURE-002 | v2.0.0 | `git-hash` |
| v2.0.1 | 2026-03-30 | BUG-002 修复：补充 02_roadmapping/和 03_detailing/ | BUG-002 | v2.0.1 | `git-hash` |
| v2.1.0 | 2026-04-02 | FEATURE-003：Roadmap Agent 优化 | FEATURE-003 | v2.1.0 | `git-hash` |
| v3.1.0 | 2026-04-02 | FEATURE-004：DESIGNING 阶段审阅优化 | FEATURE-004 | v3.1.0 | `git-hash` |
| **v3.1.1** | **2026-04-02** | **BUG-005 修复：PRD/TRD 文档修复** | **BUG-005** | **v3.1.0** | **`55b2eae`** |
| **v3.1.2** | **2026-04-02** | **BUG-006 修复：PRD/TRD 审查问题修复（哈希对齐 + 异常处理完善）** | **BUG-006** | **v3.1.0** | **`f0e4491`** |
| **v3.1.3** | **2026-04-02** | **FEATURE-005：DESIGNING 阶段用户确认签字优化（不生成额外文件）** | **FEATURE-005** | **v3.1.0** | **`待计算`** |
| **v3.1.4** | **2026-04-02** | **BUG-007 修复：PRD/TRD 描述 AI 工具为 config.yaml 配置** | **BUG-007** | **v3.1.0** | **`待计算`** |

---

## 14. v3.1.3 产品需求 - DESIGNING 阶段用户确认签字优化

### 14.1 需求背景

#### 14.1.1 问题描述

在 DESIGNING 阶段审阅使用过程中发现以下问题：
1. **用户确认签字环节缺失** - PRD/TRD 生成后缺少正式的用户确认签字
2. **需求变更无正式记录** - 用户未理解设计方案就进入开发，变更无追溯
3. **返工风险高** - 缺少签字确认导致后期需求变更频繁

#### 14.1.2 影响范围

- designing 阶段审阅流程需要优化
- PRD.md 需要增加签字章节
- 不生成额外文件（避免信息不一致）

---

### 14.2 产品目标

#### 14.2.1 核心目标

在 DESIGNING 阶段增加用户确认签字环节，**不生成任何额外文件**。

#### 14.2.2 具体目标

| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **不生成额外文件** | 避免文件过多导致信息不一致 | 0 个额外文件 |
| **签字回填 PRD.md** | 签字直接关联到需求文档 | PRD.md 包含签字章节 |
| **确认内容提炼** | 供用户快速理解 | 内存中提炼，聊天窗口展示 |
| **版本管理** | 支持多版本迭代 | Git 管理 PRD.md 版本 |

---

### 14.3 功能需求

#### 14.3.1 签字章节设计

**需求描述**：在 PRD.md 中增加签字章节，用于记录用户确认信息。

**签字章节结构**：
```markdown
## 15. 用户确认签字

### 15.1 确认内容提炼

> 以下内容由流程引擎在内存中提炼，供用户快速理解

| 类别 | 关键内容 |
|------|---------|
| 核心需求 | {从 PRD 提炼的 3-5 条核心需求} |
| 技术方案 | {从 TRD 提炼的关键技术选型} |
| 变更影响 | {增量需求时，说明对现有功能的影响} |
| 风险提示 | {主要技术风险和使用限制} |

### 15.2 签字确认

| 角色 | 姓名 | 签字日期 | 结论 | 备注 |
|------|------|---------|------|------|
| 产品负责人 | {姓名} | {YYYY-MM-DD} | ✅ 通过 / ⚠️ 条件通过 / ❌ 驳回 | {可选} |
| 技术负责人 | {姓名} | {YYYY-MM-DD} | ✅ 通过 / ⚠️ 条件通过 / ❌ 驳回 | {可选} |
| 审阅者 | openclaw-ouyp | {YYYY-MM-DD} | ✅ 通过 / ⚠️ 条件通过 / ❌ 驳回 | {可选} |

### 15.3 签字历史

| 版本 | 签字日期 | 角色 | 结论 | 备注 |
|------|---------|------|------|------|
| v3.1.3 | {YYYY-MM-DD} | 产品负责人 | ✅ 通过 | - |
| v3.1.3 | {YYYY-MM-DD} | 技术负责人 | ✅ 通过 | - |
```

#### 14.3.2 确认内容提炼功能

**需求描述**：从 PRD/TRD 自动提炼关键信息，在内存中生成，通过聊天窗口展示。

**提炼内容**：
1. **核心需求** - 从 PRD 的功能需求章节提取 3-5 条核心需求
2. **技术方案** - 从 TRD 的技术选型章节提取关键技术决策
3. **变更影响** - 增量需求时，分析对现有功能的影响
4. **风险提示** - 从 TRD 的异常处理章节提取主要风险

**实现方式**：
- ❌ **不生成文件** - 确认内容仅在内存中生成
- ✅ **聊天窗口展示** - 通过审阅请求展示给用户
- ✅ **邮件展示** - 可选通过邮件发送确认内容

#### 14.3.3 签字收集功能

**需求描述**：收集用户签字（表单/邮件回复/聊天窗口回复）。

**收集方式**：
1. **聊天窗口回复** - 用户在 QQ/微信等聊天窗口回复签字结论
2. **邮件回复** - 用户回复确认邮件
3. **表单填写** - 可选使用在线表单收集签字

**签字结论**：
- ✅ 通过 - 直接进入下一阶段
- ⚠️ 条件通过 - 进入下一阶段，记录待修复项
- ❌ 驳回 - 重新执行 designing 阶段

#### 14.3.4 签字回填功能

**需求描述**：将用户签字回填到 PRD.md 的签字章节。

**回填内容**：
- 签字日期
- 签字角色
- 签字结论
- 备注（可选）

**回填方式**：
- 流程引擎自动更新 PRD.md 文件
- 使用 Git 提交记录变更

#### 14.3.5 版本管理功能

**需求描述**：使用 Git 管理 PRD.md 版本，支持多版本迭代。

**版本管理方式**：
1. **Git Commit** - 每次签字后提交 PRD.md 变更
2. **Git Tag** - 重要版本创建 Tag（如 v3.1.3）
3. **版本历史** - PRD.md 中的版本历史章节记录所有版本

**Commit Message 格式**：
```
docs: PRD 签字确认 v3.1.3

- 产品负责人：xxx ✅ 通过
- 技术负责人：xxx ✅ 通过
- 审阅者：openclaw-ouyp ✅ 通过
```

---

### 14.4 非功能需求

#### 14.4.1 文件约束

- **不生成额外文件** - 签字信息直接回填到 PRD.md
- **确认内容内存化** - 提炼内容不生成文件，仅在聊天窗口展示
- **保持接口一致** - 与 ReviewDesignAgent v3.1.0 接口一致

#### 14.4.2 性能要求

- 确认内容提炼时间：< 30 秒
- 签字回填时间：< 5 秒
- Git 提交时间：< 10 秒

#### 14.4.3 兼容性要求

- 保持与现有 PRD.md 格式一致
- 签字章节采用标准 Markdown 表格
- 向后兼容 v3.1.0 ~ v3.1.2

---

### 14.5 验收标准

#### 14.5.1 Given

- REQUIREMENTS.md 已追加 REQ-009（v3.1.3 优化需求）
- PRD.md v3.1.2 和 TRD.md v3.1.2 存在
- Git 仓库已初始化

#### 14.5.2 When

- 执行 designing 阶段
- 生成确认内容（内存中）
- 收集用户签字
- 回填签字到 PRD.md
- 执行 ReviewDesignAgent v3.1.0 检查

#### 14.5.3 Then

- ✅ PRD.md v3.1.3 包含签字章节（第 15 章）
- ✅ PRD.md v3.1.3 包含版本历史（更新到 v3.1.3）
- ✅ TRD.md v3.1.3 包含签字章节（可选）
- ✅ 确认内容提炼功能正常（内存中，不生成文件）
- ✅ 签字回填功能正常（回填到 PRD.md）
- ✅ 版本管理功能正常（Git 管理）
- ✅ 不生成任何额外文件
- ✅ ReviewDesignAgent 审查得分 >= 90%
- ✅ 用户验收通过

---

### 14.6 需求追溯矩阵更新

| 需求 ID | REQUIREMENTS.md 章节 | PRD 章节 | PRD 行号 | 映射状态 |
|---------|---------------------|---------|---------|---------|
| REQ-009 | L473-530 | 14.1-14.6 | 待计算 | ✅ 已映射 |

#### 14.6.1 覆盖率统计

- **需求总数**: 9
- **已映射需求**: 9
- **覆盖率**: 100%
- **未映射需求**: 无

---

## 15. v3.1.4 Bugfix 修复 - PRD/TRD 描述 AI 工具为 config.yaml 配置

### 15.1 问题描述

PRD.md 和 TRD.md 中硬编码描述"使用 OpenCode"，应该描述为"根据 config.yaml 配置选择 AI 工具"。

**当前问题**：
- ❌ PRD.md 描述："使用 OpenCode 执行 designing skill"
- ❌ TRD.md 描述："使用 OpenCode 生成代码"
- ❌ 无法灵活切换 AI 工具

### 15.2 修复目标

| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **AI 工具描述修正** | PRD.md 描述 AI 工具为"根据 config.yaml 配置选择" | PRD.md v3.1.4 更新 |
| **AI 工具描述修正** | TRD.md 描述 AI 工具为"根据 config.yaml 配置选择" | TRD.md v3.1.4 更新 |
| **模板同步更新** | PRD-template.md 和 TRD-template.md 同步更新 | 模板文件更新 |
| **审查通过** | ReviewDesignAgent 审查得分 >= 90% | 审查报告 |

### 15.3 修复方案

#### 15.3.1 PRD.md 修改

**修改位置**：术语表章节

**修改前**：
```markdown
| 术语 | 说明 |
|------|------|
| OpenCode | 执行者，负责具体研发任务执行 |
```

**修改后**：
```markdown
| 术语 | 说明 |
|------|------|
| AI 工具 | 执行者，负责具体研发任务执行（根据 config.yaml 配置选择，支持 OpenCode/Claude Code/其他） |
| config.yaml | 流程引擎配置文件，包含 AI 工具配置、审阅配置、回滚策略等 |
```

#### 15.3.2 TRD.md 修改

**修改位置**：系统架构图和调用关系章节

**修改前**：
```markdown
│  OpenCode (执行者)                  │
```

**修改后**：
```markdown
│  AI 工具 (执行者)                   │
│  • 根据 config.yaml 配置选择         │
│  • 支持 OpenCode/Claude Code/其他   │
```

**修改前**：
```markdown
| 阶段 | 流程引擎动作 | OpenCode 执行 |
|------|-------------|--------------|
| designing | 调用 designing skill | 执行需求分析和架构设计 |
```

**修改后**：
```markdown
| 阶段 | 流程引擎动作 | AI 工具执行 |
|------|-------------|--------------|
| designing | 调用 designing skill | 根据 config.yaml 配置选择 AI 工具执行需求分析和架构设计 |
```

#### 15.3.3 PRD-template.md 修改

**修改位置**：术语表和使用说明章节

**修改内容**：
- 将"OpenCode"相关描述改为"AI 工具（根据 config.yaml 配置选择）"

#### 15.3.4 TRD-template.md 修改

**修改位置**：系统架构图和调用关系章节

**修改内容**：
- 将"OpenCode"相关描述改为"AI 工具（根据 config.yaml 配置选择）"

### 15.4 非功能需求

- **不生成额外文件** - 仅修改现有文件，不创建新文件
- **保持与现有流程一致** - 遵循 clawdevflow 完整流程
- **向后兼容** - 不影响现有功能

### 15.5 验收标准

#### 15.5.1 Given

- PRD.md v3.1.3 和 TRD.md v3.1.3 存在
- PRD-template.md 和 TRD-template.md 存在
- config.yaml 包含 AI 工具配置

#### 15.5.2 When

- 执行 designing 阶段修复
- 审阅 PRD.md 和 TRD.md
- 执行 ReviewDesignAgent v3.1.0 检查

#### 15.5.3 Then

- ✅ PRD.md v3.1.4 描述 AI 工具为"根据 config.yaml 配置选择"
- ✅ TRD.md v3.1.4 描述 AI 工具为"根据 config.yaml 配置选择"
- ✅ PRD-template.md 更新为"根据 config.yaml 配置选择"
- ✅ TRD-template.md 更新为"根据 config.yaml 配置选择"
- ✅ ReviewDesignAgent 审查得分 >= 90%
- ✅ 用户验收通过

### 15.6 需求追溯矩阵更新

| 需求 ID | REQUIREMENTS.md 章节 | PRD 章节 | PRD 行号 | 映射状态 |
|---------|---------------------|---------|---------|---------|
| REQ-010 | L580-630 | 15.1-15.6 | 待计算 | ✅ 已映射 |

#### 15.6.1 覆盖率统计

- **需求总数**: 10
- **已映射需求**: 10
- **覆盖率**: 100%
- **未映射需求**: 无

---

### 15.7 版本历史更新

| 版本 | 日期 | 变更说明 | Issue ID | 对齐 REQUIREMENTS 版本 | PRD 哈希 |
|------|------|---------|----------|----------------------|---------|
| v1.0.0 | 2026-03-26 | 初始版本（原始需求） | - | v1.0.0 | `git-hash` |
| v1.1.0 | 2026-03-26 | FEATURE-001：增加 OpenCode 调用说明 | FEATURE-001 | v1.1.0 | `git-hash` |
| v2.0.0 | 2026-03-28 | FEATURE-002：审阅驱动 + 会话隔离 + 工具无关 | FEATURE-002 | v2.0.0 | `git-hash` |
| v2.0.1 | 2026-03-30 | BUG-002 修复：补充 02_roadmapping/和 03_detailing/ | BUG-002 | v2.0.1 | `git-hash` |
| v2.1.0 | 2026-04-02 | FEATURE-003：Roadmap Agent 优化 | FEATURE-003 | v2.1.0 | `git-hash` |
| v3.1.0 | 2026-04-02 | FEATURE-004：DESIGNING 阶段审阅优化 | FEATURE-004 | v3.1.0 | `git-hash` |
| v3.1.1 | 2026-04-02 | BUG-005 修复：PRD/TRD 文档修复 | BUG-005 | v3.1.0 | `55b2eae` |
| v3.1.2 | 2026-04-02 | BUG-006 修复：PRD/TRD 审查问题修复（哈希对齐 + 异常处理完善） | BUG-006 | v3.1.0 | `f0e4491` |
| v3.1.3 | 2026-04-02 | FEATURE-005：DESIGNING 阶段用户确认签字优化 | FEATURE-005 | v3.1.0 | `待计算` |
| **v3.1.4** | **2026-04-02** | **BUG-007 修复：PRD/TRD 描述 AI 工具为 config.yaml 配置** | **BUG-007** | **v3.1.0** | **`待计算`** |

---

## 16. v3.1.5 产品需求 - ROADMAPPING 审阅 Agent 规则优化

### 16.1 需求背景

#### 16.1.1 问题描述

当前 roadmapping 审阅 Agent 只有 10 项检查清单，缺少关键的质量控制规则：
- ❌ 无 Freshness 对齐检查（文档不更新到最新）
- ❌ 无显式需求引用（Traceability 不足）
- ❌ 无 MVP 可交付性检查（空泛计划）
- ❌ 无依赖检查（只检查风险）
- ❌ 无范围膨胀预警

#### 16.1.2 影响范围

- roadmapping skill 的自审阅检查清单需要扩展
- opencode.js 适配器的 roadmapping 任务描述需要更新
- 审查决策规则需要调整（critical 项一票否决）

---

### 16.2 产品目标

#### 16.2.1 核心目标

扩展 roadmapping 审阅检查清单从 10 项到 12 项，新增 Freshness/Traceability/MVP/依赖/范围控制规则。

#### 16.2.2 具体目标

| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **Freshness** | 对齐最新需求 | ROADMAP.md 包含 alignedTo + requirementsHash |
| **Traceability** | 能追溯到 PRD/需求 | ROADMAP 显式引用需求 ID（覆盖率 100%） |
| **Deliverability** | 具备可交付性 | 有 MVP/里程碑 1 段落（scope/验收/工作量） |
| **风险管理** | 依赖与风险完整 | 有 Dependencies/Risks 段落 |
| **范围控制** | 预警范围膨胀 | 检测"可能/可选/未来"关键词（warning） |

---

### 16.3 功能需求

#### 16.3.1 新增检查规则（5 项）

| 规则 | 检查点 | 关键性 | 说明 |
|------|--------|--------|------|
| R0 | Freshness 对齐 | critical | ROADMAP.md 必须包含 alignedTo + requirementsHash |
| R1 | Traceability（需求引用） | critical | ROADMAP 必须显式引用需求 ID（覆盖率 100%） |
| R2 | MVP 可交付性 | critical | 必须存在 MVP/Phase 1/里程碑 1 段落 |
| R3 | 依赖与风险 | critical | ROADMAP 必须有 Dependencies/Risks 段落 |
| R4 | 范围膨胀风险 | non-critical | 检测"可能/可选/未来"等关键词（warning） |

#### 16.3.2 保留检查规则（7 项）

保留原有 10 项检查清单中的 7 项：
- ✅ 1: 任务拆分
- ✅ 2: 工作量评估
- ✅ 3: 收尾项
- ✅ 4: 任务命名
- ✅ 5: 描述规范
- ✅ 7: 技术对齐
- ✅ 8: 代码现状（增量）

移除 2 项（与新增规则重复）：
- ❌ 6: 需求覆盖（与 R1 Traceability 重复）
- ❌ 9: 风险评估（与 R3 依赖与风险重复）

#### 16.3.3 12 项检查清单（最终版）

| # | 规则 | 检查点 | 关键性 | 标准 |
|---|------|--------|--------|------|
| R0 | Freshness | 文档对齐最新需求 | critical | ROADMAP.md 包含 alignedTo + requirementsHash |
| R1 | Traceability | 显式需求引用 | critical | ROADMAP 显式引用需求 ID（覆盖率 100%） |
| R2 | Deliverability | MVP 可交付性 | critical | 必须存在 MVP/Phase 1/里程碑 1 段落 |
| R3 | Dependencies | 依赖与风险 | critical | ROADMAP 必须有 Dependencies/Risks 段落 |
| R4 | Scope | 范围膨胀风险 | non-critical | 检测"可能/可选/未来"等关键词（warning） |
| 1 | 任务拆分 | 按模块和前后端拆分 | non-critical | 每个任务职责单一 |
| 2 | 工作量评估 | 单个任务 ≤ 2 人天 | non-critical | 超过 2 人天的任务已拆分 |
| 3 | 收尾项 | 联调测试和演示项 | non-critical | 每个任务都有联调测试 + 演示 |
| 4 | 任务命名 | 固定格式 | non-critical | `【任务简称】(前端/后端) 任务简述` |
| 5 | 描述规范 | 只描述"做什么" | non-critical | 不涉及"怎么做"的技术实现 |
| 7 | 技术对齐 | 与 TRD 一致 | non-critical | 无冲突 |
| 8 | 代码现状 | 增量需求分析 | non-critical | 增量需求必须包含代码现状章节 |

#### 16.3.4 评分决策规则更新

| 评分 | 决策 | 后续动作 |
|------|------|---------|
| 所有 critical 项通过 | ✅ 通过 | 直接写入 ROADMAP.md |
| 任一 critical 项失败 | ❌ 驳回 | 重新生成开发计划（最多 3 次） |
| 所有 critical 项通过 + non-critical 项有失败 | ⚠️ 条件通过 | 修正后写入 ROADMAP.md |

**关键变化**：
- critical 项（R0-R3）一票否决
- non-critical 项（R4 + 1-5, 7-8）允许条件通过

---

### 16.4 非功能需求

#### 16.4.1 文件约束

- **不生成额外文件** - 仅修改 SKILL.md 和 opencode.js
- **保持与现有流程一致** - 遵循 clawdevflow 完整流程
- **向后兼容** - 不影响现有功能

#### 16.4.2 性能要求

- 自审阅时间：< 2 分钟（增加 2 项检查）
- 修正次数：最多 3 次
- 总体执行时间：< 10 分钟

---

### 16.5 验收标准

#### 16.5.1 Given

- REQUIREMENTS.md 已追加 REQ-011（v3.1.5）
- bundled-skills/roadmapping/SKILL.md 存在
- adapters/opencode.js 存在

#### 16.5.2 When

- 执行完整 clawdevflow 流程（designing→roadmapping→detailing→coding→reviewing）
- 审阅所有产出文档

#### 16.5.3 Then

- ✅ PRD.md v3.1.5 包含新规则说明（第 16 章）
- ✅ TRD.md v3.1.5 包含技术实现方案
- ✅ bundled-skills/roadmapping/SKILL.md 更新 10 项检查清单为 12 项
- ✅ adapters/opencode.js 更新 roadmapping 任务描述
- ✅ ReviewDesignAgent 审查得分 >= 90%
- ✅ 用户验收通过

---

### 16.6 需求追溯矩阵更新

| 需求 ID | REQUIREMENTS.md 章节 | PRD 章节 | PRD 行号 | 映射状态 |
|---------|---------------------|---------|---------|---------|
| REQ-011 | L630-700 | 16.1-16.6 | 待计算 | ✅ 已映射 |

#### 16.6.1 覆盖率统计

- **需求总数**: 11
- **已映射需求**: 11
- **覆盖率**: 100%
- **未映射需求**: 无

---

### 16.7 版本历史更新

| 版本 | 日期 | 变更说明 | Issue ID | 对齐 REQUIREMENTS 版本 | PRD 哈希 |
|------|------|---------|----------|----------------------|---------|
| v1.0.0 | 2026-03-26 | 初始版本（原始需求） | - | v1.0.0 | `git-hash` |
| v1.1.0 | 2026-03-26 | FEATURE-001：增加 OpenCode 调用说明 | FEATURE-001 | v1.1.0 | `git-hash` |
| v2.0.0 | 2026-03-28 | FEATURE-002：审阅驱动 + 会话隔离 + 工具无关 | FEATURE-002 | v2.0.0 | `git-hash` |
| v2.0.1 | 2026-03-30 | BUG-002 修复：补充 02_roadmapping/和 03_detailing/ | BUG-002 | v2.0.1 | `git-hash` |
| v2.1.0 | 2026-04-02 | FEATURE-003：Roadmap Agent 优化 | FEATURE-003 | v2.1.0 | `git-hash` |
| v3.1.0 | 2026-04-02 | FEATURE-004：DESIGNING 阶段审阅优化 | FEATURE-004 | v3.1.0 | `git-hash` |
| v3.1.1 | 2026-04-02 | BUG-005 修复：PRD/TRD 文档修复 | BUG-005 | v3.1.0 | `55b2eae` |
| v3.1.2 | 2026-04-02 | BUG-006 修复：PRD/TRD 审查问题修复（哈希对齐 + 异常处理完善） | BUG-006 | v3.1.0 | `f0e4491` |
| v3.1.3 | 2026-04-02 | FEATURE-005：DESIGNING 阶段用户确认签字优化 | FEATURE-005 | v3.1.0 | `待计算` |
| v3.1.4 | 2026-04-02 | BUG-007 修复：PRD/TRD 描述 AI 工具为 config.yaml 配置 | BUG-007 | v3.1.0 | `待计算` |
| **v3.1.5** | **2026-04-02** | **FEATURE-006：ROADMAPPING 审阅 Agent 规则优化** | **FEATURE-006** | **v3.1.0** | **`e0d59dd`** |
| **v3.1.6** | **2026-04-02** | **FEATURE-007：ROADMAPPING 环节优化（R4 规则优化 + 不生成 SELF-REVIEW.md）** | **FEATURE-007** | **v3.1.0** | **`待计算`** |

---

## 17. v3.1.6 产品需求 - ROADMAPPING 环节优化

### 17.1 需求背景

#### 17.1.1 问题描述

ROADMAPPING 环节 v3.1.5 执行发现两个问题：
1. ⚠️ **R4 范围膨胀风险误报** - 检测到"可选"关键词，但已标注缓解措施
2. ❌ **生成 SELF-REVIEW.md** - 增加额外文件，不符合"不生成额外文件"原则

#### 17.1.2 影响范围

- roadmapping skill 的自审阅 R4 检查规则需要优化
- SELF-REVIEW.md 生成逻辑需要调整
- opencode.js 适配器的 roadmapping 任务描述需要更新

---

### 17.2 产品目标

#### 17.2.1 核心目标

优化 R4 检查规则减少误报，简化 SELF-REVIEW.md 生成逻辑。

#### 17.2.2 具体目标

| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **解决 R4 范围膨胀** | 优化 R4 检查规则，减少误报 | R4 检查通过（无误报） |
| **不生成 SELF-REVIEW.md** | 简化输出，只在 critical 项失败时生成 | 无 SELF-REVIEW.md 文件 |

---

### 17.3 功能需求

#### 17.3.1 R4 规则优化

**需求描述**：检测到"可能/可选/未来"关键词时，检查是否有缓解措施。

**优化方案**：
1. **检测关键词** - "可能/可选/未来/或许/大概/也许/maybe/optional"等
2. **检查缓解措施** - 同一段落是否包含"缓解/应对/措施/方案"等关键词
3. **判定规则**：
   - 有关键词 + 无缓解措施 → warning（标注范围膨胀风险）
   - 有关键词 + 有缓解措施 → 通过（不误报）
   - 无关键词 → 通过

**示例**：
```markdown
<!-- 误报场景（已有缓解措施） -->
可选功能：用户头像上传（后续版本实现）
缓解措施：MVP 版本不包含此功能，已标注为 Phase 2
→ 应判定为通过

<!-- 真实风险场景（无缓解措施） -->
可能需要在未来考虑性能优化
→ 应判定为 warning
```

#### 17.3.2 SELF-REVIEW.md 生成逻辑优化

**需求描述**：只在 critical 项失败时生成 SELF-REVIEW.md。

**生成规则**：
| 场景 | Critical 项 | Non-Critical 项 | 生成 SELF-REVIEW.md |
|------|------------|-----------------|---------------------|
| 全部通过 | ✅ 全部通过 | ✅ 全部通过 | ❌ 不生成 |
| 小问题 | ✅ 全部通过 | ⚠️ 1-2 项失败 | ❌ 不生成（修正后直接输出） |
| Critical 失败 | ❌ 任一失败 | - | ✅ 生成（记录失败原因） |

**优化理由**：
- 符合"不生成额外文件"原则
- 减少文件冗余
- Critical 项失败时才需要记录审阅过程用于调试

---

### 17.4 非功能需求

#### 17.4.1 文件约束

- **不生成额外文件** - 仅修改 SKILL.md 和 opencode.js
- **保持与现有流程一致** - 遵循 clawdevflow 完整流程
- **向后兼容** - 不影响现有功能

#### 17.4.2 性能要求

- R4 检查时间：< 30 秒（增加缓解措施检查）
- 自审阅时间：< 2 分钟
- 修正次数：最多 3 次

---

### 17.5 验收标准

#### 17.5.1 Given

- REQUIREMENTS.md 已追加 REQ-012（v3.1.6）
- bundled-skills/roadmapping/SKILL.md v3.1.5 存在
- adapters/opencode.js 存在

#### 17.5.2 When

- 重新执行 roadmapping 环节
- 审阅 ROADMAP.md v3.1.6

#### 17.5.3 Then

- ✅ R4 范围膨胀风险通过（无误报）
- ✅ 不生成 SELF-REVIEW.md
- ✅ 自审阅得分 >= 90%
- ✅ ReviewDesignAgent 审查得分 >= 90%
- ✅ 用户验收通过

---

### 17.6 需求追溯矩阵更新

| 需求 ID | REQUIREMENTS.md 章节 | PRD 章节 | PRD 行号 | 映射状态 |
|---------|---------------------|---------|---------|---------|
| REQ-012 | L700-770 | 17.1-17.6 | 待计算 | ✅ 已映射 |

#### 17.6.1 覆盖率统计

- **需求总数**: 12
- **已映射需求**: 12
- **覆盖率**: 100%
- **未映射需求**: 无

---

### 17.7 版本历史更新

| 版本 | 日期 | 变更说明 | Issue ID | 对齐 REQUIREMENTS 版本 | PRD 哈希 |
|------|------|---------|----------|----------------------|---------|
| v1.0.0 | 2026-03-26 | 初始版本（原始需求） | - | v1.0.0 | `git-hash` |
| v1.1.0 | 2026-03-26 | FEATURE-001：增加 OpenCode 调用说明 | FEATURE-001 | v1.1.0 | `git-hash` |
| v2.0.0 | 2026-03-28 | FEATURE-002：审阅驱动 + 会话隔离 + 工具无关 | FEATURE-002 | v2.0.0 | `git-hash` |
| v2.0.1 | 2026-03-30 | BUG-002 修复：补充 02_roadmapping/和 03_detailing/ | BUG-002 | v2.0.1 | `git-hash` |
| v2.1.0 | 2026-04-02 | FEATURE-003：Roadmap Agent 优化 | FEATURE-003 | v2.1.0 | `git-hash` |
| v3.1.0 | 2026-04-02 | FEATURE-004：DESIGNING 阶段审阅优化 | FEATURE-004 | v3.1.0 | `git-hash` |
| v3.1.1 | 2026-04-02 | BUG-005 修复：PRD/TRD 文档修复 | BUG-005 | v3.1.0 | `55b2eae` |
| v3.1.2 | 2026-04-02 | BUG-006 修复：PRD/TRD 审查问题修复（哈希对齐 + 异常处理完善） | BUG-006 | v3.1.0 | `f0e4491` |
| v3.1.3 | 2026-04-02 | FEATURE-005：DESIGNING 阶段用户确认签字优化 | FEATURE-005 | v3.1.0 | `待计算` |
| v3.1.4 | 2026-04-02 | BUG-007 修复：PRD/TRD 描述 AI 工具为 config.yaml 配置 | BUG-007 | v3.1.0 | `待计算` |
| v3.1.5 | 2026-04-02 | FEATURE-006：ROADMAPPING 审阅 Agent 规则优化 | FEATURE-006 | v3.1.0 | `e0d59dd` |
| **v3.1.6** | **2026-04-02** | **FEATURE-007：ROADMAPPING 环节优化（R4 规则优化 + 不生成 SELF-REVIEW.md）** | **FEATURE-007** | **v3.1.0** | **`待计算`** |
| **v3.1.7** | **2026-04-02** | **问题分析：DETAILING 环节审阅 Agent 缺失** | **REQ-013 分析** | **v3.1.0** | **`待计算`** |
| **v3.1.8** | **2026-04-02** | **FEATURE-008：DETAILING 审阅 Agent 优化（Hard Gates + 输入输出规范）** | **FEATURE-008** | **v3.1.0** | **`待计算`** |

---

## 18. v3.1.8 产品需求 - DETAILING 审阅 Agent 优化

### 18.1 需求背景

#### 18.1.1 问题描述

DETAILING 环节不存在审阅 Agent，导致：
- ❌ DETAIL.md 质量无法保证
- ❌ 可能遗漏关键设计细节
- ❌ 可能与 PRD/TRD/ROADMAP 不一致
- ❌ CODING 阶段发现设计问题，需要返工
- ❌ 不符合"审阅驱动"设计理念

#### 18.1.2 影响范围

- detailing skill 需要增加自审阅功能
- opencode.js 适配器的 detailing 任务描述需要更新
- 审查决策规则需要调整（Hard Gates 一票否决）

---

### 18.2 产品目标

#### 18.2.1 核心目标

为 DETAILING 环节增加审阅 Agent，包含输入/输出规范、Hard Gates 和 10 项检查清单。

#### 18.2.2 具体目标

| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **输入/输出规范** | 明确审阅 Agent 输入输出 | 读取 5 个文件，输出 3 项 |
| **Hard Gates** | 3 项 Critical 强门禁 | HG1 Freshness/HG2 可追溯/HG3 可测试 |
| **检查清单** | 10 项检查（5 critical + 5 normal） | Critical 一票否决 |
| **输出格式** | 审阅结论 + 失败项 + 修复建议 | JSON 格式，明确到章节/行号 |

---

### 18.3 功能需求

#### 18.3.1 输入规范（必须读取 5 个文件）

| 文件 | 用途 | 说明 |
|------|------|------|
| REQUIREMENTS.md | 最新需求 source of truth | 验证需求对齐 |
| PRD.md | 产品需求 | 验证功能完整性 |
| TRD.md | 技术设计 | 验证技术一致性 |
| ROADMAP.md | 开发计划 | 验证计划对齐 |
| DETAIL.md | 被审阅对象 | 详细设计文档 |

#### 18.3.2 输出规范（必须生成 3 项）

| 输出项 | 格式 | 说明 |
|--------|------|------|
| 审阅结论 | pass/conditional/reject | 明确决策 |
| 失败项列表 | 章节/行号 | 明确到具体位置 |
| 修复建议 | 示例 | 指出如何修复 |

#### 18.3.3 Hard Gates（3 项 Critical）

| 门禁 | 检查点 | 关键性 | 说明 |
|------|--------|--------|------|
| HG1 | Freshness 对齐 | critical | DETAIL.md 必须包含 alignedTo + requirementsHash |
| HG2 | 需求可追溯 | critical | 可定位映射（章节 + 行号），不能凭描述匹配 |
| HG3 | 验收可测试 | critical | 验收标准必须包含 Given/When/Then，否则 coding 只能靠感觉 |

#### 18.3.4 检查清单（10 项）

**Critical（5 项）**:
- HG1: Freshness 对齐
- HG2: 需求可追溯
- HG3: 验收可测试
- D0: 章节完整性
- D2: 技术一致性

**Normal（5 项）**:
- D3: 计划对齐
- D4: 接口定义完整性
- D5: 数据结构设计
- D6: 异常处理
- D7: 向后兼容（仅增量需求）

#### 18.3.5 评分决策规则

| 评分 | 决策 | 后续动作 |
|------|------|---------|
| 所有 Critical 项通过 | ✅ 通过 | 直接进入 coding 阶段 |
| 任一 Critical 项失败 | ❌ 驳回 | 重新执行 detailing 阶段（最多 3 次） |
| 所有 Critical 项通过 + Normal 项有失败 | ⚠️ 条件通过 | 修正后进入 coding 阶段 |

---

### 18.4 非功能需求

#### 18.4.1 文件约束

- **不生成额外文件** - 仅修改 SKILL.md 和 opencode.js
- **保持与现有流程一致** - 遵循 clawdevflow 完整流程
- **向后兼容** - 不影响现有功能

#### 18.4.2 性能要求

- 自审阅时间：< 2 分钟
- 修正次数：最多 3 次
- 总体执行时间：< 10 分钟

---

### 18.5 验收标准

#### 18.5.1 Given

- REQUIREMENTS.md 已追加 REQ-013（v3.1.8）
- bundled-skills/detailing/SKILL.md 存在
- adapters/opencode.js 存在

#### 18.5.2 When

- 执行完整 clawdevflow 流程（designing→roadmapping→detailing→coding→reviewing）
- 审阅所有产出文档

#### 18.5.3 Then

- ✅ PRD.md v3.1.8 包含 DETAILING 审阅 Agent 说明（第 18 章）
- ✅ TRD.md v3.1.8 包含技术实现方案
- ✅ bundled-skills/detailing/SKILL.md 新增 10 项检查清单
- ✅ adapters/opencode.js 更新 detailing 任务描述
- ✅ ReviewDesignAgent 审查得分 >= 90%
- ✅ 用户验收通过

---

### 18.6 需求追溯矩阵更新

| 需求 ID | REQUIREMENTS.md 章节 | PRD 章节 | PRD 行号 | 映射状态 |
|---------|---------------------|---------|---------|---------|
| REQ-013 | L780-900 | 18.1-18.6 | 待计算 | ✅ 已映射 |

#### 18.6.1 覆盖率统计

- **需求总数**: 13
- **已映射需求**: 13
- **覆盖率**: 100%
- **未映射需求**: 无

---

### 18.7 版本历史更新

| 版本 | 日期 | 变更说明 | Issue ID | 对齐 REQUIREMENTS 版本 | PRD 哈希 |
|------|------|---------|----------|----------------------|---------|
| v1.0.0 | 2026-03-26 | 初始版本（原始需求） | - | v1.0.0 | `git-hash` |
| v1.1.0 | 2026-03-26 | FEATURE-001：增加 OpenCode 调用说明 | FEATURE-001 | v1.1.0 | `git-hash` |
| v2.0.0 | 2026-03-28 | FEATURE-002：审阅驱动 + 会话隔离 + 工具无关 | FEATURE-002 | v2.0.0 | `git-hash` |
| v2.0.1 | 2026-03-30 | BUG-002 修复：补充 02_roadmapping/和 03_detailing/ | BUG-002 | v2.0.1 | `git-hash` |
| v2.1.0 | 2026-04-02 | FEATURE-003：Roadmap Agent 优化 | FEATURE-003 | v2.1.0 | `git-hash` |
| v3.1.0 | 2026-04-02 | FEATURE-004：DESIGNING 阶段审阅优化 | FEATURE-004 | v3.1.0 | `git-hash` |
| v3.1.1 | 2026-04-02 | BUG-005 修复：PRD/TRD 文档修复 | BUG-005 | v3.1.0 | `55b2eae` |
| v3.1.2 | 2026-04-02 | BUG-006 修复：PRD/TRD 审查问题修复（哈希对齐 + 异常处理完善） | BUG-006 | v3.1.0 | `f0e4491` |
| v3.1.3 | 2026-04-02 | FEATURE-005：DESIGNING 阶段用户确认签字优化 | FEATURE-005 | v3.1.0 | `待计算` |
| v3.1.4 | 2026-04-02 | BUG-007 修复：PRD/TRD 描述 AI 工具为 config.yaml 配置 | BUG-007 | v3.1.0 | `待计算` |
| v3.1.5 | 2026-04-02 | FEATURE-006：ROADMAPPING 审阅 Agent 规则优化 | FEATURE-006 | v3.1.0 | `e0d59dd` |
| v3.1.6 | 2026-04-02 | FEATURE-007：ROADMAPPING 环节优化（R4 规则优化 + 不生成 SELF-REVIEW.md） | FEATURE-007 | v3.1.0 | `待计算` |
| **v3.1.7** | **2026-04-02** | **问题分析：DETAILING 环节审阅 Agent 缺失** | **REQ-013 分析** | **v3.1.0** | **`待计算`** |
| **v3.1.8** | **2026-04-02** | **FEATURE-008：DETAILING 审阅 Agent 优化（Hard Gates + 输入输出规范）** | **FEATURE-008** | **v3.1.0** | **`待计算`** |

---

*PRD 文档结束*
