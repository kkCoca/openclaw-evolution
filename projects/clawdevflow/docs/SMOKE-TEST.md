# Smoke 测试指南

> 日期：2026-04-09  
> 状态：待执行

---

## 测试目标

验证 CDF 能通过扫描推进流程（即使 review 逻辑暂时弱也要能跑通 happy path）。

---

## 测试步骤

### 1. 创建测试项目

```bash
cd openclaw-evolution/projects
mkdir -p cdf-smoke
echo "# Smoke Test" > cdf-smoke/REQUIREMENTS.md
```

### 2. 运行 CDF

```bash
node projects/clawdevflow/04_coding/src/workflow-executor.js --scenario "全新功能" --output "projects/cdf-smoke"
```

### 3. 观察 opencode 执行日志

确保控制台输出包含：

- `[OpenCode]   CLI 命令：opencode ...`
- `[OpenCode] ✅ 阶段完成：designing`

### 4. 手动创建合同文件（模拟子会话）

```bash
# Designing
mkdir -p projects/cdf-smoke/01_designing
echo "# PRD" > projects/cdf-smoke/01_designing/PRD.md
echo "# TRD" > projects/cdf-smoke/01_designing/TRD.md

# Roadmapping
mkdir -p projects/cdf-smoke/02_roadmapping
echo "# ROADMAP" > projects/cdf-smoke/02_roadmapping/ROADMAP.md

# Detailing
mkdir -p projects/cdf-smoke/03_detailing
echo "# DETAIL" > projects/cdf-smoke/03_detailing/DETAIL.md

# Coding
mkdir -p projects/cdf-smoke/04_coding/src
echo "// code" > projects/cdf-smoke/04_coding/src/index.js
echo "# CHANGESET" > projects/cdf-smoke/04_coding/CHANGESET.md

# Testing
mkdir -p projects/cdf-smoke/06_testing
echo '{}' > projects/cdf-smoke/06_testing/TEST_CONTEXT.json
echo 'TEST LOG' > projects/cdf-smoke/06_testing/TEST.log
echo '{"RESULT":"PASS"}' > projects/cdf-smoke/06_testing/TEST_RESULTS.json
echo 'VERIFY LOG' > projects/cdf-smoke/06_testing/VERIFY.log
echo '{"RESULT":"PASS"}' > projects/cdf-smoke/06_testing/VERIFY_RESULTS.json
echo "# VERIFICATION REPORT" > projects/cdf-smoke/06_testing/VERIFICATION_REPORT.md

# Reviewing
mkdir -p projects/cdf-smoke/05_reviewing
echo "# FINAL REPORT" > projects/cdf-smoke/05_reviewing/FINAL_REPORT.md
echo '{"result":"PASS"}' > projects/cdf-smoke/05_reviewing/RELEASE_READINESS.json

# Precommit
mkdir -p projects/cdf-smoke/07_precommit
echo '{}' > projects/cdf-smoke/07_precommit/PRECOMMIT_PLAN.json
echo '{"result":"PASS","securityFindings":[],"untrackedFiles":[],"blockingIssues":[]}' > projects/cdf-smoke/07_precommit/PRECOMMIT_REPORT.json
echo "# PRECOMMIT SUMMARY" > projects/cdf-smoke/07_precommit/PRECOMMIT_SUMMARY.md

# Releasing
mkdir -p projects/cdf-smoke/08_releasing
echo '{}' > projects/cdf-smoke/08_releasing/RELEASE_RECORD.json
echo "# RELEASE NOTES" > projects/cdf-smoke/08_releasing/RELEASE_NOTES.md
echo '{}' > projects/cdf-smoke/08_releasing/ARTIFACT_MANIFEST.json
echo '{}' > projects/cdf-smoke/08_releasing/CLEANUP_PLAN.json
echo '{"securityFindings":[],"summary":{"totalSecurityFindings":0}}' > projects/cdf-smoke/08_releasing/CLEANUP_REPORT.json
```

### 5. 验证推进

CDF 应该能扫描到产物并推进到下一阶段。

---

## 通过标准

- ✅ 手动创建产物后 CDF 能扫描通过
- ✅ 流程能推进到最后阶段

---

## 注意事项

- 本测试不依赖宿主消费运行态文件
- 手动创建产物模拟子会话输出
- 测试完成后可删除 `projects/cdf-smoke/`
