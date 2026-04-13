# ClawDevFlow 运行与部署指南

> 版本：v3.4.0  
> 目标：提供面向部署的完整说明（定位/架构/阶段职责/审阅策略/状态恢复/配置/运行态文件）

---

## 1. 定位与边界

- **定位**：ClawDevFlow（CDF）是一个流程编排引擎 Skill，用于将 designing→roadmapping→detailing→coding→testing→reviewing→precommit→releasing 统一编排。
- **目标**：以审阅驱动的方式控制质量，保证阶段产物可追溯、可回滚、可恢复。
- **边界**：CDF 不直接实现业务逻辑，它只负责“调度 + 审阅 + 产物校验 + 状态管理”。

---

## 2. 体系架构

```
用户需求
  ↓ sessions_spawn
ClawDevFlow (编排者)
  ↓ spawn opencode
OpenCode / 子 Skill (执行者)
  ↓
阶段产物 + 审阅结论
```

关键组件：
- **workflow-executor**：入口与任务参数解析。
- **workflow-orchestrator**：阶段编排 + 状态管理。
- **stage-executor**：路由到各阶段执行器。
- **review-orchestrator**：审阅编排（自动/人工）。
- **output-scanner**：按 config.outputsAllOf 校验产物。

---

## 3. 阶段职责与产出

阶段顺序以代码常量 `STAGE_SEQUENCE` 与 `config/config.yaml` 为唯一事实源：

1. **designing** → `01_designing/PRD.md` + `01_designing/TRD.md`
2. **roadmapping** → `02_roadmapping/ROADMAP.md`
3. **detailing** → `03_detailing/DETAIL.md`
4. **coding** → `04_coding/src/` + `04_coding/CHANGESET.md`
5. **testing** → `06_testing/TEST_CONTEXT.json` + `TEST.log` + `TEST_RESULTS.json` + `VERIFY.log` + `VERIFY_RESULTS.json` + `VERIFICATION_REPORT.md`
6. **reviewing** → `05_reviewing/FINAL_REPORT.md` + `RELEASE_READINESS.json`
7. **precommit** → `07_precommit/PRECOMMIT_PLAN.json` + `PRECOMMIT_REPORT.json` + `PRECOMMIT_SUMMARY.md`
8. **releasing** → `08_releasing/RELEASE_RECORD.json` + `RELEASE_NOTES.md` + `ARTIFACT_MANIFEST.json` + `CLEANUP_PLAN.json` + `CLEANUP_REPORT.json`

> 输出目录编号 **05_reviewing/06_testing** 保持不变，以便与已有产物与脚本兼容。

---

## 4. 审阅策略

- **designing**：人工审阅（review-request 文件）。
- **roadmapping ~ releasing**：自动审阅（gates），如需可通过 `requireReview=false` 跳过。
- **审阅结论**：pass / conditional / reject / clarify / terminate
  - conditional：除 designing 外会触发返工
  - clarify：进入 BLOCKED 状态，可恢复

审阅请求默认保存到：
```
.cdf-work/review-requests/review-request-{stage}.md
```

---

## 5. 状态与恢复

- **状态文件**：`<project>/.cdf-state.json`
- **恢复方式**：再次执行 CDF 时自动检测并续跑。

```bash
/sessions_spawn clawdevflow
# 任务：恢复流程
```

---

## 6. 运行态文件与提交策略

运行态文件不应提交：
- `.cdf-state.json`
- `.cdf-work/`（审阅请求/临时产物）
- `06_testing/`、`07_precommit/`、`08_releasing/`

如果 precommit 发现未跟踪文件，请优先检查是否为运行态目录。

---

## 7. 配置与环境变量

核心配置在 `04_coding/src/config/config.yaml`：

```yaml
global:
  workspaceRoot: ${OPENCLAW_WORKSPACE_ROOT:-../../..}
  defaultAITool: opencode
  logLevel: info
  runtimeDir: ${CDF_RUNTIME_DIR:-.cdf-work}
```

- `requireReview=false`：跳过审阅自动通过（适用于演示或快速通路）。
- `outputsAllOf`：每阶段产物合同，必须与文档一致。

---

## 8. 部署与使用步骤

1. 安装：
   ```bash
   cd projects/clawdevflow/04_coding/src
   ./install.sh   # 或 install.bat / node install.js
   ```
2. 配置：修改 `config/config.yaml` 或设置环境变量。
3. 运行：
   ```bash
   /sessions_spawn clawdevflow
   # 任务：xxx
   # 场景类型：全新功能|增量需求|问题修复
   # 需求说明：REQUIREMENTS.md（可用“需求描述”替代）
   # 问题记录（问题修复）：ISSUES.md
   # 输出目录：projects/xxx/
   ```

---

## 9. 兼容性与迁移说明

- 仍然兼容旧版输出目录（05_reviewing/06_testing）。
- `TEST_RESULTS.json` 与 `VERIFY_RESULTS.json` 支持 `result` / `RESULT` 两种字段名（建议统一使用 `result`）。
- 新增运行态目录 `.cdf-work/`，已加入 `.gitignore`，不影响已有项目。
