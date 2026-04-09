# ClawDevFlow 端到端流程矩阵

> 版本：v3.4.0  
> 更新日期：2026-04-09  
> 状态：生产就绪 ✅

---

## 流程总览

```
REQUIREMENTS.md → designing → roadmapping → detailing → coding → testing → reviewing → precommit → (人工提交) → releasing
```

| 阶段 | 输入物 | 产出物 | 检查点 | Gate |
|------|--------|--------|--------|------|
| designing | REQUIREMENTS.md | PRD.md, TRD.md | 需求完整性、可测试性 | DI0-DI4 |
| roadmapping | PRD.md, TRD.md | ROADMAP.md | 可追溯性、结构完整性 | RD0-RD3 |
| detailing | PRD.md, TRD.md, ROADMAP.md | DETAIL.md | 任务分解、依赖关系 | DT0-DT3 |
| coding | DETAIL.md, PROJECT_MANIFEST.json | src/, CHANGESET.md | 代码规范、测试覆盖 | CD0-CD3 |
| testing | src/, PROJECT_MANIFEST.json | TEST.log, VERIFY.log, VERIFICATION_REPORT.md | 测试通过、验收通过 | TS0-TS5 |
| reviewing | 全部阶段产出 | FINAL_REPORT.md, RELEASE_READINESS.json | 全部 Gate 通过 | RV0-RV3 |
| precommit | 项目工作区 | PRECOMMIT_PLAN.json, PRECOMMIT_REPORT.json, PRECOMMIT_SUMMARY.md | 无敏感文件、无未跟踪文件 | PC0-PC2 |
| releasing | RELEASE_READINESS.json (PASS) | RELEASE_RECORD.json, RELEASE_NOTES.md, CLEANUP_REPORT.json, ARTIFACT_MANIFEST.json | readiness=PASS, 无安全发现 | RL0-RL3 |

---

## 阶段详细矩阵

### 1. Designing 阶段

**位置**: `01_designing/`

| 类型 | 文件 | 说明 | 必需 |
|------|------|------|------|
| **输入** | `REQUIREMENTS.md` | openclaw-ouyp 提供的需求说明 | ✅ |
| **产出** | `PRD.md` | 产品需求文档（AI 生成） | ✅ |
| **产出** | `TRD.md` | 技术设计文档（AI 生成） | ✅ |
| **检查** | PRD 完整性 | 目标/范围/用户故事/验收标准 | DI0 |
| **检查** | 可测试性 | Given/When/Then 格式 | DI1 |
| **检查** | 需求追溯 | REQUIREMENTS.md → PRD.md 映射 | DI2 |
| **检查** | 技术约束 | 架构决策、技术栈、接口定义 | DI3 |
| **检查** | 风险评估 | 已知风险、缓解措施 | DI4 |

**Gate 失败处理**: reject → 自动返工（最多 3 次）

---

### 2. Roadmapping 阶段

**位置**: `02_roadmapping/`

| 类型 | 文件 | 说明 | 必需 |
|------|------|------|------|
| **输入** | `PRD.md` | 产品需求文档 | ✅ |
| **输入** | `TRD.md` | 技术设计文档 | ✅ |
| **产出** | `ROADMAP.md` | 研发路线图（AI 生成） | ✅ |
| **检查** | 可追溯性 | PRD/TRD → ROADMAP 映射 | RD0 |
| **检查** | 结构完整性 | 里程碑/任务/依赖/验收标准 | RD1 |
| **检查** | 入口门禁 | designing.status = 'approved' | RD2 (Gate#2) |
| **检查** | 自审阅报告 | ROADMAP-SELF-REVIEW.md | RD3 |

**Gate 失败处理**: reject → 自动返工（最多 3 次）

---

### 3. Detailing 阶段

**位置**: `03_detailing/`

| 类型 | 文件 | 说明 | 必需 |
|------|------|------|------|
| **输入** | `PRD.md` | 产品需求文档 | ✅ |
| **输入** | `TRD.md` | 技术设计文档 | ✅ |
| **输入** | `ROADMAP.md` | 研发路线图 | ✅ |
| **产出** | `DETAIL.md` | 详细任务分解（AI 生成） | ✅ |
| **检查** | 任务分解 | 原子任务、可执行 | DT0 |
| **检查** | 依赖关系 | 任务前置/后置依赖 | DT1 |
| **检查** | 验收标准 | 每个任务的完成定义 | DT2 |
| **检查** | 资源估算 | 时间、依赖、风险 | DT3 |

**Gate 失败处理**: reject → 自动返工（最多 3 次）

---

### 4. Coding 阶段

**位置**: `04_coding/src/`

| 类型 | 文件 | 说明 | 必需 |
|------|------|------|------|
| **输入** | `DETAIL.md` | 详细任务分解 | ✅ |
| **输入** | `PROJECT_MANIFEST.json` | 项目配置（commands.test/verify） | ✅ |
| **产出** | `src/` | 源代码（AI 生成） | ✅ |
| **产出** | `CHANGESET.md` | 变更说明（自动创建） | ✅ |
| **检查** | 代码规范 | ESLint/Prettier 通过 | CD0 |
| **检查** | 测试覆盖 | 单元测试覆盖率 ≥80% | CD1 |
| **检查** | 功能实现 | 所有任务完成 | CD2 |
| **检查** | Manifest 校验 | commands.test/verify 存在 | CD3 |

**Gate 失败处理**: reject → 自动返工（最多 3 次）

---

### 5. Testing 阶段

**位置**: `05_testing/`

| 类型 | 文件 | 说明 | 必需 |
|------|------|------|------|
| **输入** | `src/` | 源代码 | ✅ |
| **输入** | `PROJECT_MANIFEST.json` | 项目配置（commands.test/verify） | ✅ |
| **产出** | `TEST_CONTEXT.json` | 测试上下文 | ✅ |
| **产出** | `TEST.log` | 测试执行日志 | ✅ |
| **产出** | `TEST_RESULTS.json` | 测试结果（结构化） | ✅ |
| **产出** | `VERIFY.log` | 验收执行日志 | ✅ |
| **产出** | `VERIFY_RESULTS.json` | 验收结果（结构化） | ✅ |
| **产出** | `VERIFICATION_REPORT.md` | 最终验收报告 | ✅ |
| **检查** | T0 Preflight | 上下文准备 | TS0 |
| **检查** | T1 Install | 依赖安装（可选） | TS1 |
| **检查** | T2 Lint | 代码检查（可选） | TS2 |
| **检查** | T3 Build | 构建（可选） | TS3 |
| **检查** | T4 Test | 测试执行（必需） | TS4 |
| **检查** | T5 Verify | 验收执行（必需） | TS5 |

**Gate 失败处理**: 记录到报告，由 reviewing 阶段决定是否 reject

---

### 6. Reviewing 阶段

**位置**: `05_reviewing/`

| 类型 | 文件 | 说明 | 必需 |
|------|------|------|------|
| **输入** | 全部阶段产出 | designing → testing | ✅ |
| **产出** | `FINAL_REPORT.md` | 项目收口报告 | ✅ |
| **产出** | `RELEASE_READINESS.json` | 发布就绪检查 | ✅ |
| **检查** | RV0 | 全部阶段证据包存在 | ✅ |
| **检查** | RV1 | 全部 Gate 通过 | ✅ |
| **检查** | RV2 | 测试/验收通过 | ✅ |
| **检查** | RV3 | 无 P0/P1 问题 | ✅ |

**Gate 失败处理**: reject → 返回对应阶段返工

---

### 7. Precommit 阶段

**位置**: `07_precommit/`

| 类型 | 文件 | 说明 | 必需 |
|------|------|------|------|
| **输入** | 项目工作区 | git 仓库 | ✅ |
| **产出** | `PRECOMMIT_PLAN.json` | 清理计划 | ✅ |
| **产出** | `PRECOMMIT_REPORT.json` | 检查报告 | ✅ |
| **产出** | `PRECOMMIT_SUMMARY.md` | 人类可读报告 | ✅ |
| **检查** | PC0 | 无敏感文件（.env, *.pem, *.key, id_rsa） | ✅ |
| **检查** | PC1 | 无未跟踪文件（git status ??）不在白名单 | ✅ |
| **检查** | PC2 | releasing 目录未被 git 跟踪 | ✅ |

**Gate 失败处理**: FAIL → 阻断提交，修复后重试

---

### 8. Releasing 阶段

**位置**: `06_releasing/`

| 类型 | 文件 | 说明 | 必需 |
|------|------|------|------|
| **输入** | `RELEASE_READINESS.json` | result=PASS | ✅ |
| **产出** | `RELEASE_RECORD.json` | 发布记录 | ✅ |
| **产出** | `RELEASE_NOTES.md` | 发布说明 | ✅ |
| **产出** | `CLEANUP_PLAN.json` | 清理计划 | ✅ |
| **产出** | `CLEANUP_REPORT.json` | 清理报告（含 securityFindings） | ✅ |
| **产出** | `ARTIFACT_MANIFEST.json` | 制品清单 | ✅ |
| **检查** | RL0 | readiness 存在且 result=PASS | ✅ |
| **检查** | RL1 | 全部产出文件存在 | ✅ |
| **检查** | RL2 | CLEANUP_REPORT.json 可解析 | ✅ |
| **检查** | RL3 | securityFindings=0 | ✅ |

**Gate 失败处理**: reject → 禁止发布，修复后重试

---

## 核心代码文件

| 文件 | 职责 | 行数 | 必需 |
|------|------|------|------|
| `cdf-orchestrator/stage-executor.js` | 阶段执行（8 个阶段） | ~1200 | ✅ |
| `cdf-orchestrator/state-manager.js` | 状态管理（.cdf-state.json） | ~400 | ✅ |
| `cdf-orchestrator/workflow-orchestrator.js` | 流程编排 | ~600 | ✅ |
| `review-orchestrator/review-orchestrator.js` | 自动审阅 | ~900 | ✅ |
| `adapters/opencode.js` | AI 工具适配器（opencode） | ~300 | ✅ |
| `utils/validate-roadmapping-entry.js` | Roadmapping 入口门禁 | ~50 | ✅ |

---

## 冗余/临时文件识别

### 可删除文件

| 文件 | 原因 | 建议 |
|------|------|------|
| `04_coding/src/.nyc_output/*` | 测试覆盖率临时文件 | ✅ 删除 |
| `04_coding/src/coverage/*` | 测试覆盖率报告（临时） | ✅ 删除 |
| `04_coding/src/state-manager.js` | 旧文件（已移至 cdf-orchestrator/） | ✅ 删除 |
| `04_coding/src/workflow-orchestrator.js` | 旧文件（已移至 cdf-orchestrator/） | ✅ 删除 |
| `04_coding/src/workflow-executor.js` | 旧文件（功能已合并） | ✅ 删除 |
| `04_coding/src/parallel-executor.js` | 未使用 | ✅ 删除 |
| `04_coding/src/remind-service.js` | 未使用 | ✅ 删除 |
| `04_coding/src/resume-manager.js` | 未使用 | ✅ 删除 |
| `04_coding/src/review-result-viewer.js` | 未使用 | ✅ 删除 |
| `04_coding/src/log-viewer.js` | 未使用 | ✅ 删除 |
| `04_coding/src/review/review-protocol.js` | 旧文件（已移至 review-orchestrator/） | ✅ 删除 |
| `tests/test-*.js` | 临时测试（集成测试已合并） | ⚠️ 评估后删除 |
| `04_coding/src/examples/*.md` | 示例（可移至 docs/） | ⚠️ 移至 docs/ |
| `04_coding/src/bundled-skills/*/TEMPLATES.md` | 模板（可合并到 SKILL.md） | ⚠️ 合并 |

### 可合并文件

| 文件 | 建议 |
|------|------|
| `adapters/claude-code.js`, `adapters/custom.js` | 如不使用可删除 |
| `review-agents/*.js` | 如已整合到 review-orchestrator 可删除 |
| `review-generators/*.js` | 如已整合到 review-orchestrator 可删除 |

---

## 文档整理

### 核心文档（保留）

| 文档 | 位置 | 用途 |
|------|------|------|
| `README.md` | 项目根目录 | 项目说明 |
| `REQUIREMENTS.md` | 项目根目录 | 需求说明（openclaw-ouyp 提供） |
| `CHANGELOG.md` | 项目根目录 | 变更日志 |
| `TASK-TEMPLATE.md` | `04_coding/src/` | 任务模板 |
| `SKILL.md` | `04_coding/src/` | 技能定义 |

### 临时报告（可归档）

| 文档 | 建议 |
|------|------|
| `04_coding/CODING-COMPLETE-REPORT-v*.md` | 归档到 `docs/archive/` |
| `05_reviewing/REVIEW-REPORT-v*.md` | 归档到 `docs/archive/` |
| `05_reviewing/DESIGNING-REVIEW-REPORT-v*.md` | 归档到 `docs/archive/` |
| `bundled-skills/roadmapping/CHECKLIST-v*.md` | 版本化命名 → 合并到 CHECKLIST.md |

---

## .gitignore 建议

```gitignore
# 临时文件
.nyc_output/
coverage/
*.log
logs/

# 测试临时文件
tests/test-p*.js

# 旧文件备份
*.bak
*.old

# 系统文件
.DS_Store
Thumbs.db
```

---

## 下一步行动

1. **清理冗余代码** - 删除旧文件、未使用文件
2. **归档临时报告** - 移动版本化报告到 `docs/archive/`
3. **合并模板** - TEMPLATES.md → SKILL.md
4. **更新 .gitignore** - 排除临时文件
5. **验证流程** - 端到端测试确保清理后流程正常
