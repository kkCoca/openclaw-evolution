# 产品需求文档（PRD）

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

### 7.1 相关文档

- AGENTS.md - 操作手册
- REQUIREMENTS.md - 需求说明
- workflow.md - 流程编排逻辑
- README.md - 使用文档

### 7.2 术语表

| 术语 | 说明 |
|------|------|
| OpenCode | 执行者，负责具体研发任务执行 |
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
- **向后兼容**: 不影响现有功能，环境变量语法可选使用
- **文档一致性**: 所有文档版本历史保持一致

---

*PRD 文档结束*
