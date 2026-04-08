# Reviewing to Releasing 验收用例（Release Readiness Gate）

> **版本**: v1.0  
> **日期**: 2026-04-08  
> **用途**: Reviewing 阶段 Release Readiness Gate 验收测试（4 条用例）

---

## 测试环境准备

```bash
# 创建测试项目
mkdir -p /tmp/test-reviewing-readiness
cd /tmp/test-reviewing-readiness

# 创建 REQUIREMENTS.md
cat > REQUIREMENTS.md << 'EOF'
# 测试需求
### REQ-001: 简单加法函数
EOF

# 创建 01_designing/PRD.md 和 TRD.md
mkdir -p 01_designing
cat > 01_designing/PRD.md << 'EOF'
# PRD
EOF
cat > 01_designing/TRD.md << 'EOF'
# TRD
EOF

# 创建 03_detailing/DETAIL.md
mkdir -p 03_detailing
cat > 03_detailing/DETAIL.md << 'EOF'
# DETAIL
## 接口设计
## 数据结构
## 测试方案
## 异常处理
EOF

# 创建 04_coding/src
mkdir -p 04_coding/src
echo "console.log('hello');" > 04_coding/src/index.js

# 创建 04_coding/CHANGESET.md
cat > 04_coding/CHANGESET.md << 'EOF'
# 变更说明
## 如何跑命令
```bash
npm test
```
EOF

# 创建 PROJECT_MANIFEST.json
cat > PROJECT_MANIFEST.json << 'EOF'
{
  "language": "node",
  "commands": {
    "test": "echo 'tests passed'",
    "verify": "echo 'verify passed'"
  }
}
EOF

# 创建 05_testing 证据包（让流程能到 reviewing）
mkdir -p 05_testing
cat > 05_testing/TEST_RESULTS.json << 'EOF'
{
  "TEST_CMD": "echo 'tests passed'",
  "RESULT": "PASS"
}
EOF
cat > 05_testing/VERIFY_RESULTS.json << 'EOF'
{
  "VERIFY_CMD": "echo 'verify passed'",
  "RESULT": "PASS"
}
EOF
cat > 05_testing/VERIFICATION_REPORT.md << 'EOF'
# 验收报告
**RESULT: PASS**
EOF
```

---

## 验收用例（4 条）

### 用例 1: 缺 testing evidence → reject

**测试步骤**：
```bash
# 删除 testing evidence
rm -f 05_testing/VERIFY_RESULTS.json

# 启动流程到 reviewing 阶段
```

**期望结果**：
- reviewing 自动审阅 reject
- fixItems: `[{ id: 'RG2_TESTING_EVIDENCE_MISSING', ... }]`
- `05_reviewing/RELEASE_READINESS.json` 存在且 `result=FAIL`
- blockingIssues 至少 1 条

**证据点**：
- `.cdf-state.json` → `stages.reviewing.reviewDecision = 'reject'`
- `.cdf-state.json` → `stages.reviewing.fixItems[].id = 'RG2_TESTING_EVIDENCE_MISSING'`
- `05_reviewing/RELEASE_READINESS.json` → `result: FAIL`
- `05_reviewing/RELEASE_READINESS.json` → `blockingIssues[].evidencePath = '05_testing/VERIFY_RESULTS.json'`

**状态**: ✅ 待验证

---

### 用例 2: testing 不通过 → reject

**测试步骤**：
```bash
# 修改 test 结果为 FAIL
cat > 05_testing/TEST_RESULTS.json << 'EOF'
{
  "TEST_CMD": "exit 1",
  "RESULT": "FAIL"
}
EOF
```

**期望结果**：
- reviewing 自动审阅 reject
- fixItems: `[{ id: 'RG3_TESTING_NOT_PASS', ... }]`
- `05_reviewing/RELEASE_READINESS.json` 存在且 `result=FAIL`
- blockingIssues 指向 test results

**证据点**：
- `.cdf-state.json` → `stages.reviewing.reviewDecision = 'reject'`
- `.cdf-state.json` → `stages.reviewing.fixItems[].id = 'RG3_TESTING_NOT_PASS'`
- `05_reviewing/RELEASE_READINESS.json` → `result: FAIL`
- `05_reviewing/RELEASE_READINESS.json` → `blockingIssues[].evidencePath = '05_testing/TEST_RESULTS.json'`

**状态**: ✅ 待验证

---

### 用例 3: manifest/changeset 缺失 → reject

**测试步骤**：
```bash
# 删除 manifest 或 changeset
rm -f PROJECT_MANIFEST.json
# 或
rm -f 04_coding/CHANGESET.md
```

**期望结果**：
- reviewing 自动审阅 reject
- fixItems: `[{ id: 'RG4_MANIFEST_MISSING_OR_INVALID', ... }]` 或 `RG5_CHANGESET_MISSING`
- `05_reviewing/RELEASE_READINESS.json` 存在且 `result=FAIL`

**证据点**：
- `.cdf-state.json` → `stages.reviewing.reviewDecision = 'reject'`
- `.cdf-state.json` → `stages.reviewing.fixItems[].id` = `RG4_MANIFEST_MISSING_OR_INVALID` 或 `RG5_CHANGESET_MISSING`
- `05_reviewing/RELEASE_READINESS.json` → `result: FAIL`
- `05_reviewing/RELEASE_READINESS.json` → `blockingIssues[].evidencePath` 指向缺失文件

**状态**: ✅ 待验证

---

### 用例 4: 全通过 → pass（可进入 releasing）

**测试步骤**：
```bash
# 确保所有证据齐全
# - 05_testing/TEST_RESULTS.json (RESULT=PASS)
# - 05_testing/VERIFY_RESULTS.json (RESULT=PASS)
# - 05_testing/VERIFICATION_REPORT.md (存在)
# - PROJECT_MANIFEST.json (存在且有效)
# - 04_coding/CHANGESET.md (存在且非空)
# - 05_reviewing/FINAL_REPORT.md (存在且非空)
```

**期望结果**：
- reviewing 自动审阅 pass
- `05_reviewing/RELEASE_READINESS.json` 存在且 `result=PASS`
- blockingIssues=[]
- 可进入 releasing 阶段

**证据点**：
- `.cdf-state.json` → `stages.reviewing.reviewDecision = 'pass'`
- `.cdf-state.json` → `stages.reviewing.fixItems = []`
- `05_reviewing/RELEASE_READINESS.json` → `result: PASS`
- `05_reviewing/RELEASE_READINESS.json` → `blockingIssues: []`

**状态**: ✅ 待验证

---

## 测试结果汇总表

| 用例编号 | 用例名称 | 预期结果 | 实际结果 | 证据位置 | 测试日期 | 测试人 |
|---------|---------|---------|---------|---------|---------|--------|
| 1 | 缺 testing evidence → reject | reject + RG2 | | | | |
| 2 | testing 不通过 → reject | reject + RG3 | | | | |
| 3 | manifest/changeset 缺失 → reject | reject + RG4/RG5 | | | | |
| 4 | 全通过 → pass（可进入 releasing） | pass + readiness.result=PASS | | | | |

---

## 验收报告模板

### 测试环境

| 项目 | 值 |
|------|-----|
| 操作系统 | |
| Node 版本 | |
| 执行机器/CI | |
| 测试日期 | |

### 流程版本

| 项目 | Commit SHA | 说明 |
|------|-----------|------|
| repo | `9a9ce1c` | improve RG2 suggestion |
| repo | `898d912` | reviewing auto-reviewed |
| repo | `17647b1` | implement testing stage |

### 测试结果

| 用例编号 | 结果（✅/❌） | 备注 | 证据位置 |
|---------|------------|------|---------|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |

### 证据示例

**用例 1 证据**（示例）：
```json
{
  "stages": {
    "reviewing": {
      "reviewDecision": "reject",
      "fixItems": [
        {
          "id": "RG2_TESTING_EVIDENCE_MISSING",
          "description": "05_testing/VERIFY_RESULTS.json 文件不存在",
          "suggestion": "重新执行 testing 阶段生成完整 evidence pack",
          "evidencePath": "05_testing/VERIFY_RESULTS.json"
        }
      ]
    }
  }
}
```

**用例 4 证据**（示例）：
```json
{
  "path": "05_reviewing/RELEASE_READINESS.json",
  "content": {
    "schemaVersion": "v1",
    "result": "PASS",
    "generatedAt": "2026-04-08T17:00:00Z",
    "inputs": {
      "projectPath": "/tmp/test-reviewing-readiness",
      "attempt": 1
    },
    "evidence": {
      "manifest": "PROJECT_MANIFEST.json",
      "changeset": "04_coding/CHANGESET.md",
      "testing": {
        "test_results": "05_testing/TEST_RESULTS.json",
        "verify_results": "05_testing/VERIFY_RESULTS.json",
        "verification_report": "05_testing/VERIFICATION_REPORT.md"
      }
    },
    "blockingIssues": []
  }
}
```

### 验收结论

- [ ] 所有用例通过
- [ ] 存在失败用例（详见备注）

### 签字

| 角色 | 姓名 | 日期 |
|------|------|------|
| 验收人 | | |
| 审核人 | | |

---

*Reviewing to Releasing 验收用例 by openclaw-ouyp*  
**版本**: v1.0 | **日期**: 2026-04-08
