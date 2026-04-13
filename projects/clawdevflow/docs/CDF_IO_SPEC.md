# ClawDevFlow 端到端 I/O 规范 (CDF_IO_SPEC)

> 版本：v3.4.0  
> 生效日期：2026-04-09  
> 状态：生产就绪 ✅

本文档是 ClawDevFlow 流程引擎的**唯一 I/O 规范**，定义每个阶段的输入物、产出物、检查点和门禁凭证。

---

## 流程总览

```
REQUIREMENTS.md → designing → roadmapping → detailing → coding → testing → reviewing → precommit → (人工提交) → releasing
```

| 阶段 | 执行输入 | 执行产出 | 门禁检查输入 | 门禁凭证 | Gate |
|------|---------|---------|-------------|---------|------|
| designing | REQUIREMENTS.md | PRD.md, TRD.md | 需求完整性 | PRD.md 非空 | DI0-DI4 |
| roadmapping | PRD.md, TRD.md | ROADMAP.md | designing.status=approved | ROADMAP.md 非空 | RD0-RD3 |
| detailing | PRD.md, TRD.md, ROADMAP.md | DETAIL.md | roadmapping.status=approved | DETAIL.md 非空 | DT0-DT3 |
| coding | DETAIL.md, PROJECT_MANIFEST.json | src/, CHANGESET.md | detailing.status=approved | src/ 非空 | CD0-CD3 |
| testing | src/, PROJECT_MANIFEST.json | TEST.log, VERIFY.log, VERIFICATION_REPORT.md | coding.status=approved | VERIFICATION_REPORT.md | TS0-TS5 |
| reviewing | 全部阶段产出 | FINAL_REPORT.md, RELEASE_READINESS.json | testing 完成 | RELEASE_READINESS.json | RV0-RV3 |
| precommit | 项目工作区 (git) | PRECOMMIT_PLAN.json, PRECOMMIT_REPORT.json, PRECOMMIT_SUMMARY.md | reviewing.status=approved | PRECOMMIT_REPORT.json (result=PASS) | PC0-PC2 |
| releasing | RELEASE_READINESS.json (PASS) | RELEASE_RECORD.json, RELEASE_NOTES.md, CLEANUP_REPORT.json, ARTIFACT_MANIFEST.json | precommit.status=approved + readiness.result=PASS | RELEASE_RECORD.json | RL0-RL3 |

---

## 阶段详细规范

### 1. Designing 阶段

**目录**: `01_designing/`

| 类型 | 文件 | 必需 | Schema/格式 | 说明 |
|------|------|------|-------------|------|
| **输入** | `REQUIREMENTS.md` | ✅ | Markdown | openclaw-ouyp 提供的需求说明 |
| **产出** | `PRD.md` | ✅ | Markdown | 产品需求文档（AI 生成） |
| **产出** | `TRD.md` | ✅ | Markdown | 技术设计文档（AI 生成） |
| **门禁检查** | PRD.md 存在且非空 | ✅ | - | DI0 |
| **门禁检查** | TRD.md 存在且非空 | ✅ | - | DI1 |
| **门禁检查** | 需求可追溯 (REQUIREMENTS.md → PRD.md) | ✅ | - | DI2 |
| **门禁检查** | 技术约束明确 | ✅ | - | DI3 |
| **门禁检查** | 风险评估完整 | ✅ | - | DI4 |

**Gate 失败处理**: reject → 自动返工（最多 3 次）

**凭证**: `PRD.md` + `TRD.md` 存在且非空

---

### 2. Roadmapping 阶段

**目录**: `02_roadmapping/`

| 类型 | 文件 | 必需 | Schema/格式 | 说明 |
|------|------|------|-------------|------|
| **输入** | `PRD.md` | ✅ | Markdown | 产品需求文档 |
| **输入** | `TRD.md` | ✅ | Markdown | 技术设计文档 |
| **产出** | `ROADMAP.md` | ✅ | Markdown | 研发路线图（AI 生成） |
| **产出** | `ROADMAP-SELF-REVIEW.md` | ⚠️ | Markdown | 自审阅报告（可选） |
| **门禁检查** | ROADMAP.md 存在且非空 | ✅ | - | RD0 |
| **门禁检查** | 可追溯性 (PRD/TRD → ROADMAP) | ✅ | - | RD1 |
| **门禁检查** | designing.status = 'approved' | ✅ | .cdf-state.json | RD2 (Gate#2) |
| **门禁检查** | 结构完整性 (里程碑/任务/依赖) | ✅ | - | RD3 |

**Gate 失败处理**: reject → 自动返工（最多 3 次）

**凭证**: `ROADMAP.md` 存在且非空

---

### 3. Detailing 阶段

**目录**: `03_detailing/`

| 类型 | 文件 | 必需 | Schema/格式 | 说明 |
|------|------|------|-------------|------|
| **输入** | `PRD.md` | ✅ | Markdown | 产品需求文档 |
| **输入** | `TRD.md` | ✅ | Markdown | 技术设计文档 |
| **输入** | `ROADMAP.md` | ✅ | Markdown | 研发路线图 |
| **产出** | `DETAIL.md` | ✅ | Markdown | 详细任务分解（AI 生成） |
| **门禁检查** | DETAIL.md 存在且非空 | ✅ | - | DT0 |
| **门禁检查** | 任务分解原子化 | ✅ | - | DT1 |
| **门禁检查** | 依赖关系明确 | ✅ | - | DT2 |
| **门禁检查** | 验收标准完整 | ✅ | - | DT3 |

**Gate 失败处理**: reject → 自动返工（最多 3 次）

**凭证**: `DETAIL.md` 存在且非空

---

### 4. Coding 阶段

**目录**: `04_coding/src/`

| 类型 | 文件 | 必需 | Schema/格式 | 说明 |
|------|------|------|-------------|------|
| **输入** | `DETAIL.md` | ✅ | Markdown | 详细任务分解 |
| **输入** | `PROJECT_MANIFEST.json` | ✅ | JSON | 项目配置（commands.test/verify） |
| **产出** | `src/` | ✅ | 目录 | 源代码（AI 生成） |
| **产出** | `CHANGESET.md` | ✅ | Markdown | 变更说明（自动创建） |
| **门禁检查** | src/ 非空 | ✅ | - | CD0 |
| **门禁检查** | PROJECT_MANIFEST.json 包含 commands.test | ✅ | JSON | CD1 |
| **门禁检查** | 代码规范通过 (ESLint/Prettier) | ⚠️ | - | CD2 (可选) |
| **门禁检查** | 测试覆盖率 ≥80% | ⚠️ | - | CD3 (可选) |

**Gate 失败处理**: reject → 自动返工（最多 3 次）

**凭证**: `src/` 非空 + `CHANGESET.md` 存在

---

### 5. Testing 阶段

**目录**: `06_testing/`

| 类型 | 文件 | 必需 | Schema/格式 | 说明 |
|------|------|------|-------------|------|
| **输入** | `src/` | ✅ | 目录 | 源代码 |
| **输入** | `PROJECT_MANIFEST.json` | ✅ | JSON | 项目配置（commands.test/verify） |
| **产出** | `TEST_CONTEXT.json` | ✅ | JSON | 测试上下文 |
| **产出** | `TEST.log` | ✅ | Text | 测试执行日志 |
| **产出** | `TEST_RESULTS.json` | ✅ | JSON | 测试结果（结构化） |
| **产出** | `VERIFY.log` | ✅ | Text | 验收执行日志 |
| **产出** | `VERIFY_RESULTS.json` | ✅ | JSON | 验收结果（结构化） |
| **产出** | `VERIFICATION_REPORT.md` | ✅ | Markdown | 最终验收报告 |
| **门禁检查** | TEST_RESULTS.json.result = 'PASS' | ✅ | JSON | TS4 |
| **门禁检查** | VERIFY_RESULTS.json.result = 'PASS' | ✅ | JSON | TS5 |

**Gate 失败处理**: 记录到报告，由 reviewing 阶段决定是否 reject

**凭证**: `VERIFICATION_REPORT.md` + `TEST_RESULTS.json` + `VERIFY_RESULTS.json`

---

### 6. Reviewing 阶段

**目录**: `05_reviewing/`

| 类型 | 文件 | 必需 | Schema/格式 | 说明 |
|------|------|------|-------------|------|
| **输入** | 全部阶段产出 | ✅ | - | designing → testing |
| **产出** | `FINAL_REPORT.md` | ✅ | Markdown | 项目收口报告 |
| **产出** | `RELEASE_READINESS.json` | ✅ | JSON | 发布就绪检查 |
| **门禁检查** | 全部阶段证据包存在 | ✅ | - | RV0 |
| **门禁检查** | 全部 Gate 通过 | ✅ | - | RV1 |
| **门禁检查** | 测试/验收通过 | ✅ | - | RV2 |
| **门禁检查** | 无 P0/P1 问题 | ✅ | - | RV3 |

**RELEASE_READINESS.json Schema**:
```json
{
  "schemaVersion": "v1",
  "generatedAt": "2026-04-09T12:00:00.000Z",
  "result": "PASS|FAIL",
  "gates": {
    "RV0": { "passed": true, "notes": "" },
    "RV1": { "passed": true, "notes": "" },
    "RV2": { "passed": true, "notes": "" },
    "RV3": { "passed": true, "notes": "" }
  },
  "blockingIssues": []
}
```

**Gate 失败处理**: reject → 返回对应阶段返工

**凭证**: `RELEASE_READINESS.json` (result=PASS)

---

### 7. Precommit 阶段

**目录**: `07_precommit/`

| 类型 | 文件 | 必需 | Schema/格式 | 说明 |
|------|------|------|-------------|------|
| **输入** | 项目工作区 (git) | ✅ | Git Repo | 必须是 git 仓库 |
| **产出** | `PRECOMMIT_PLAN.json` | ✅ | JSON | 清理计划 |
| **产出** | `PRECOMMIT_REPORT.json` | ✅ | JSON | 检查报告 |
| **产出** | `PRECOMMIT_SUMMARY.md` | ✅ | Markdown | 人类可读报告 |
| **门禁检查** | PC0: 无敏感文件 | ✅ | - | .env, *.pem, *.key, id_rsa |
| **门禁检查** | PC1: 无未跟踪文件 (不在白名单) | ✅ | - | git status ?? |
| **门禁检查** | PC2: releasing 目录未被 git 跟踪 | ✅ | - | 08_releasing/ |

**PRECOMMIT_REPORT.json Schema**:
```json
{
  "version": "v1",
  "executedAt": "2026-04-09T12:00:00.000Z",
  "result": "PASS|FAIL",
  "deleted": [],
  "securityFindings": [],
  "untrackedFiles": [],
  "blockingIssues": [
    {
      "gateId": "PC0|PC1|PC2",
      "description": "...",
      "evidencePath": "07_precommit/PRECOMMIT_REPORT.json",
      "suggestion": "..."
    }
  ]
}
```

**Gate 失败处理**: FAIL → 阻断提交，修复后重试

**凭证**: `PRECOMMIT_REPORT.json` (result=PASS)

---

### 8. Releasing 阶段

**目录**: `08_releasing/`

| 类型 | 文件 | 必需 | Schema/格式 | 说明 |
|------|------|------|-------------|------|
| **输入** | `RELEASE_READINESS.json` | ✅ | JSON | result=PASS |
| **产出** | `RELEASE_RECORD.json` | ✅ | JSON | 发布记录 |
| **产出** | `RELEASE_NOTES.md` | ✅ | Markdown | 发布说明 |
| **产出** | `CLEANUP_PLAN.json` | ✅ | JSON | 清理计划 |
| **产出** | `CLEANUP_REPORT.json` | ✅ | JSON | 清理报告（含 securityFindings） |
| **产出** | `ARTIFACT_MANIFEST.json` | ✅ | JSON | 制品清单 |
| **门禁检查** | RL0: readiness 存在且 result=PASS | ✅ | JSON | - |
| **门禁检查** | RL1: 全部产出文件存在 | ✅ | - | - |
| **门禁检查** | RL2: CLEANUP_REPORT.json 可解析 | ✅ | JSON | - |
| **门禁检查** | RL3: securityFindings=0 | ✅ | JSON | - |

**CLEANUP_REPORT.json Schema**:
```json
{
  "version": "v1",
  "executedAt": "2026-04-09T12:00:00.000Z",
  "deleted": [],
  "securityFindings": [
    {
      "path": ".env",
      "pattern": ".env",
      "severity": "HIGH",
      "recommendation": "建议删除或加入 .gitignore"
    }
  ],
  "summary": {
    "totalDeleted": 0,
    "totalSecurityFindings": 0
  }
}
```

**Gate 失败处理**: reject → 禁止发布，修复后重试

**凭证**: `RELEASE_RECORD.json` + `CLEANUP_REPORT.json` (securityFindings=0)

---

## 状态管理

**状态文件**: `.cdf-state.json` (运行态，不应提交到仓库)

**运行态目录**: `.cdf-work/` (审阅请求与临时产物，不应提交到仓库)

**状态 Schema**:
```json
{
  "workflowId": "cdf-20260409-A1B2",
  "projectPath": "/path/to/project",
  "currentStage": "designing",
  "status": "running|paused|completed|failed",
  "stages": {
    "designing": {
      "status": "approved|rejected|pending",
      "reviewDecision": "pass|reject|conditional",
      "outputs": ["01_designing/PRD.md", "01_designing/TRD.md"]
    }
  }
}
```

---

## 文件保留策略

| 目录/文件 | 保留策略 | 说明 |
|----------|---------|------|
| `.cdf-state.json` | ❌ 不入库 | 运行态状态文件 |
| `.cdf-work/` | ❌ 不入库 | 运行态目录（审阅请求/临时产物） |
| `06_testing/` | ❌ 不入库 | 测试临时产物 |
| `08_releasing/` | ❌ 不入库 | 发布审计产物（留档用，不提交） |
| `07_precommit/` | ❌ 不入库 | 提交前检查产物 |
| `01_designing/` | ✅ 入库 | 设计文档 |
| `02_roadmapping/` | ✅ 入库 | 路线图 |
| `03_detailing/` | ✅ 入库 | 详细设计 |
| `04_coding/src/` | ✅ 入库 | 源代码 |
| `05_reviewing/` | ✅ 入库 | 审阅报告 + 发布就绪凭证 |

---

## 变更历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v3.4.0 | 2026-04-09 | 初始版本，整合 8 个阶段 I/O 规范 |
