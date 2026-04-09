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

### 3. 观察 actions.json

检查生成：`projects/cdf-smoke/.cdf/actions.json`

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

# Testing
mkdir -p projects/cdf-smoke/06_testing
echo "# TEST REPORT" > projects/cdf-smoke/06_testing/TEST-REPORT.md

# Reviewing
mkdir -p projects/cdf-smoke/05_reviewing
echo "# REVIEW REPORT" > projects/cdf-smoke/05_reviewing/REVIEW-REPORT.md

# Precommit
mkdir -p projects/cdf-smoke/07_precommit
echo "# PRECOMMIT CHECKLIST" > projects/cdf-smoke/07_precommit/PRECOMMIT-CHECKLIST.md

# Releasing
mkdir -p projects/cdf-smoke/08_releasing
echo "# RELEASE NOTES" > projects/cdf-smoke/08_releasing/RELEASE-NOTES.md
```

### 5. 验证推进

CDF 应该能扫描到产物并推进到下一阶段。

---

## 通过标准

- ✅ CDF 生成 `.cdf/actions.json`
- ✅ 手动创建产物后 CDF 能扫描通过
- ✅ 流程能推进到最后阶段

---

## 注意事项

- 本测试不依赖宿主消费 actions.json
- 手动创建产物模拟子会话输出
- 测试完成后可删除 `projects/cdf-smoke/`