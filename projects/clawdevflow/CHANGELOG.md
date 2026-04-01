# 变更日志（CHANGELOG）

## 版本历史

所有重要的项目变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [v3.1.0] - 2026-04-01

### Added

- **测试框架**: 新增完整的单元测试套件
  - test-state-manager.js: State Manager 测试（29 个测试用例，100% 通过）
  - test-ai-tool-adapter.js: AI Tool Adapter 测试（18 个测试用例）
  - run-all-tests.js: 全量测试运行脚本
  - 测试覆盖率目标：80%+

- **package.json**: 新增 npm 脚本支持
  - `npm test`: 运行全量测试
  - `npm run test:state`: State Manager 测试
  - `npm run test:adapter`: AI Tool Adapter 测试
  - `npm run test:workflow`: Workflow Orchestrator 测试
  - `npm run test:review`: Review 系统测试

### Changed

- 版本号：v3.0.1 → v3.1.0（测试覆盖增强版）

---

## [v3.0.1] - 2026-04-01

### Changed

- **文档精简**: 删除研发过程报告，保持项目目录简洁
  - 删除 AGENTS-UPDATE-LOG.md（内容已合并）
  - 删除 DEPLOYMENT-REPORT.md（内容已合并）
  - 删除 INSTALLATION-CHECK.md（临时验证文件）
  - 删除 REPAIR-PLAN.md（内容已合并到 ISSUES.md）
  - 删除 UPGRADE-LOG.md（内容已合并）
  - 删除 WORKFLOW-V2-SUMMARY.md（内容已合并）
  - 删除 04_coding/src/PHASE2-IMPLEMENTATION.md（临时文件）
  - 删除 04_coding/src/PHASE3-SUMMARY.md（临时文件）

### Added

- **README.md**: 新增完整的 skill 介绍和使用指南
  - 功能特性说明
  - 安装步骤
  - 使用示例
  - 配置说明
  - 常见问题

### Changed

- **SKILL.md**: 移除 "Meta-Skill" 描述，统一称为 "流程引擎 skill"

---

## [v3.0.0] - 2026-03-31

### Changed

- **重命名**: openclaw-research-workflow → clawdevflow
  - 统一使用 clawdevflow 名称
  - 更新所有引用和文档

### Added

- **安装脚本**: install.sh / install.bat / install.js
  - 支持 Linux/Mac/Windows
  - 自动检测 Node.js 版本
  - 自动安装 bundled skills

---

## [v2.0.1] - 2026-03-30

### Bugfix

- **BUG-002**: 补充 02_roadmapping/和 03_detailing/阶段产物
  - 创建 02_roadmapping/ROADMAP.md
  - 创建 03_detailing/DETAIL.md
  - 追加 PRD.md v2.0.1 章节
  - 追加 TRD.md v2.0.1 章节
  - 创建 CHANGELOG.md
  - 更新 REVIEW-REPORT.md v2.0.1
  - 保留 04_coding/src/ 中的所有源代码

### 问题根因

- PRD v2.0.0 需求定义不完整，没有明确要求输出 ROADMAP.md 和 DETAIL.md
- 流程引擎未执行自己定义的 5 阶段标准
- 验收报告造假（REVIEW-REPORT.md 声称文件存在，但实际不存在）

### 验收标准

- ✅ 01_designing/PRD.md 存在（含 v2.0.1 章节）
- ✅ 01_designing/TRD.md 存在（含 v2.0.1 章节）
- ✅ 02_roadmapping/ROADMAP.md 存在（新增）
- ✅ 03_detailing/DETAIL.md 存在（新增）
- ✅ 04_coding/src/ 存在（保留原有代码）
- ✅ 05_reviewing/REVIEW-REPORT.md 存在（v2.0.1 验收报告）
- ✅ CHANGELOG.md 存在（新增）

---

## [v2.0.0] - 2026-03-28

### Added

- **FEATURE-002**: 审阅驱动 + 会话隔离 + 工具无关
  - 状态机管理（StateManager 类）
  - 子会话调度（sessions_spawn）
  - 审阅协议执行（REVIEW-PROTOCOL.md）
  - 配置文件支持（config.yaml）
  - 状态持久化（state-manager.js）
  - AI 工具适配器（ai-tool-adapter.js）

### Changed

- 重写 workflow.md（流程编排逻辑）
- 更新 SKILL.md（使用说明）
- 追加 PRD.md v2.0.0 章节
- 追加 TRD.md v2.0.0 章节

### 需求目标

- **审阅驱动**: 每个阶段必须 openclaw-ouyp 确认后才继续
- **会话隔离**: 每个阶段独立子会话执行
- **工具无关**: 可配置 AI 工具（OpenCode/Claude Code/其他）
- **状态可追溯**: 完整记录每个阶段的执行状态和审阅结论
- **回滚灵活**: 支持阶段级回滚（策略 A）

---

## [v1.1.0] - 2026-03-26

### Added

- **FEATURE-001**: 增加 OpenCode 调用说明
  - workflow.md 每个阶段明确"调用 OpenCode 执行 XXX skill"
  - README.md 增加"工作原理"章节
  - 三方协作架构图（openclaw-ouyp → 流程引擎 → OpenCode）

### Changed

- 更新 workflow.md（每个阶段增加调用 OpenCode 说明）
- 更新 README.md（增加工作原理章节）
- 追加 PRD.md v1.1.0 章节
- 追加 TRD.md v1.1.0 章节

### 问题背景

- 流程引擎 Skill 没有明确体现调用 OpenCode 执行研发流程
- AGENTS.md 与 workflow.md 内容不一致
- 开发者无法了解流程引擎的工作原理

---

## [v1.0.1] - 2026-03-26

### Fixed

- **BUG-001**: 修复目录结构问题
  - 修正输出目录路径
  - 确保文档结构正确

---

## [v1.0.0] - 2026-03-26

### Added

- **初始版本**: 流程引擎 Skill（openclaw-research-workflow）
  - 独立完整：一个包包含所有依赖 skills（designing/roadmapping/detailing/coding/reviewing）
  - 零感知安装：用户只需安装 1 个 skill，依赖自动注册
  - 流程标准化：所有场景都走完整研发流程（designing→roadmapping→detailing→coding→reviewing）
  - 易于分享：支持 clawhub/脚本/压缩包多种安装方式

### 核心功能

- 自动调用 bundled skills
- 流程监督
- 生成审查报告
- 支持全新功能/增量需求/问题修复三种场景

---

## 版本说明

### 版本号规则

- **主版本号（Major）**: 不兼容的 API 变更或架构重构（如 v1.x.x → v2.x.x）
- **次版本号（Minor）**: 向后兼容的功能性新增（如 v1.0.x → v1.1.x）
- **修订号（Patch）**: 向后兼容的问题修复（如 v1.0.0 → v1.0.1）

### 变更类型

- **Added**: 新增功能
- **Changed**: 变更现有功能
- **Deprecated**: 即将移除的功能
- **Removed**: 已移除的功能
- **Fixed**: Bug 修复
- **Security**: 安全修复

---

## 相关链接

- [AGENTS.md](../../.openclaw/workspace/AGENTS.md) - 操作手册
- [REQUIREMENTS.md](REQUIREMENTS.md) - 需求说明
- [workflow.md](04_coding/src/workflow.md) - 流程编排逻辑
- [SKILL.md](04_coding/src/SKILL.md) - 使用说明

---

*CHANGELOG 由流程引擎生成，openclaw-ouyp 维护*
