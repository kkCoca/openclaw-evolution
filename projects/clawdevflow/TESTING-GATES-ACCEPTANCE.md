# Testing Gates 验收用例

> **版本**: v1.0  
> **日期**: 2026-04-08  
> **用途**: Testing 阶段质量门禁验收测试（6 条用例）

---

## 测试环境准备

```bash
# 创建测试项目
mkdir -p /tmp/test-testing-gates
cd /tmp/test-testing-gates

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
```

---

## 验收用例（6 条）

### 用例 1: 缺 manifest → reject → 自动返工

**测试步骤**：
```bash
# 删除 PROJECT_MANIFEST.json
rm -f PROJECT_MANIFEST.json

# 启动流程到 testing 阶段
```

**期望结果**：
- testing 自动审阅 reject
- fixItems: `[{ id: 'TG0_MANIFEST_MISSING', ... }]`
- retryCount++
- 自动返工触发（不出现 BLOCKED）

**证据点**：
- `.cdf-state.json` → `stages.testing.retryCount` 递增
- `.cdf-state.json` → `stages.testing.lastRegenerateHint` 包含修复建议
- console log → "TG0_MANIFEST_MISSING"

**状态**: ✅ 待验证

---

### 用例 2: 缺 commands.verify → reject → 自动返工

**测试步骤**：
```bash
# 创建不含 verify 的 manifest
cat > PROJECT_MANIFEST.json << 'EOF'
{
  "language": "node",
  "commands": {
    "test": "echo 'tests passed'"
  }
}
EOF
```

**期望结果**：
- testing 自动审阅 reject
- fixItems: `[{ id: 'TG0_VERIFY_COMMAND_MISSING', ... }]`
- retryCount++
- 自动返工补齐 verify 命令

**证据点**：
- `.cdf-state.json` → `stages.testing.lastBlockingIssues[].id == 'TG0_VERIFY_COMMAND_MISSING'`
- `06_testing/VERIFY_RESULTS.json` → `ERROR == 'VERIFY_COMMAND_MISSING'`

**状态**: ✅ 待验证

---

### 用例 3: test fail → reject → 自动返工

**测试步骤**：
```bash
# 创建 test 命令会失败的 manifest
cat > PROJECT_MANIFEST.json << 'EOF'
{
  "language": "node",
  "commands": {
    "test": "exit 1",
    "verify": "echo 'verify passed'"
  }
}
EOF
```

**期望结果**：
- testing 自动审阅 reject
- fixItems: `[{ id: 'TG5_TEST_FAILED', ... }]`
- retryCount++
- 自动返工修复测试

**证据点**：
- `06_testing/TEST_RESULTS.json` → `result: FAIL`
- `.cdf-state.json` → `stages.testing.lastBlockingIssues[].id = 'TG5_TEST_FAILED'`
- console log → "TG5_TEST_FAILED"

**状态**: ✅ 待验证

---

### 用例 4: verify fail → reject → 自动返工

**测试步骤**：
```bash
# 创建 verify 命令会失败的 manifest
cat > PROJECT_MANIFEST.json << 'EOF'
{
  "language": "node",
  "commands": {
    "test": "echo 'tests passed'",
    "verify": "exit 1"
  }
}
EOF
```

**期望结果**：
- testing 自动审阅 reject
- fixItems: `[{ id: 'TG5_VERIFY_FAILED', ... }]`
- retryCount++
- 自动返工修复验收

**证据点**：
- `06_testing/VERIFY_RESULTS.json` → `result: FAIL`
- `.cdf-state.json` → `stages.testing.lastBlockingIssues[].id = 'TG5_VERIFY_FAILED'`
- console log → "TG5_VERIFY_FAILED"

**状态**: ✅ 待验证

---

### 用例 5: 报告缺失/字段不全 → reject → 自动返工

**测试步骤**：
```bash
# 手动删除 VERIFICATION_REPORT.md
rm -f 06_testing/VERIFICATION_REPORT.md
```

**期望结果**：
- testing 自动审阅 reject
- fixItems: `[{ id: 'TG3_VERIFICATION_REPORT_MISSING', ... }]`
- retryCount++
- 自动返工重新生成报告

**证据点**：
- `.cdf-state.json` → `stages.testing.reviewDecision = 'reject'`
- console log → "TG3_VERIFICATION_REPORT_MISSING"

**状态**: ✅ 待验证

---

### 用例 6: 耗尽 2 次 → TERMINATED（硬失败）

**测试步骤**：
```bash
# 创建始终失败的 manifest
cat > PROJECT_MANIFEST.json << 'EOF'
{
  "language": "node",
  "commands": {
    "test": "exit 1",
    "verify": "exit 1"
  }
}
EOF

# 启动流程到 testing 阶段，观察重试耗尽
```

**期望结果**：
- retryCount: 0 → 1 → 2
- 第 2 次重试失败后 → TERMINATED
- stageStatus: 'terminated'

**证据点**：
- `.cdf-state.json` → `stages.testing.retryCount = 2`
- `.cdf-state.json` → `stages.testing.stageStatus = 'terminated'`
- console log → "超过最大重试次数，终止流程"

**状态**: ✅ 待验证

---

## 测试结果汇总表

| 用例编号 | 用例名称 | 预期结果 | 实际结果 | 证据位置 | 测试日期 | 测试人 |
|---------|---------|---------|---------|---------|---------|--------|
| 1 | 缺 manifest → reject → 返工 | reject + retryCount++ | | | | |
| 2 | 缺 commands.verify → reject → 返工 | reject + retryCount++ | | | | |
| 3 | test fail → reject → 返工 | reject + TEST_FAILED | | | | |
| 4 | verify fail → reject → 返工 | reject + VERIFY_FAILED | | | | |
| 5 | 报告缺失 → reject → 返工 | reject + REPORT_MISSING | | | | |
| 6 | 耗尽 2 次 → TERMINATED | stageStatus='terminated' | | | | |

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
| repo | `05f8ffa` | finalize professional closure |
| repo | `0071533` | professional closure docs |
| repo | `9b71c91` | restore auto-convergence |

### 测试结果

| 用例编号 | 结果（✅/❌） | 备注 | 证据位置 |
|---------|------------|------|---------|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |
| 6 | | | |

### 证据示例

**用例 1 证据**（示例）：
```json
{
  "stages": {
    "testing": {
      "retryCount": 1,
      "lastRegenerateHint": "【TG0_MANIFEST_MISSING】请创建 PROJECT_MANIFEST.json",
      "reviewDecision": "reject"
    }
  }
}
```

**用例 6 证据**（示例）：
```json
{
  "stages": {
    "testing": {
      "retryCount": 2,
      "stageStatus": "terminated",
      "reviewDecision": "reject"
    }
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

*Testing Gates 验收用例 by openclaw-ouyp*  
**版本**: v1.0 | **日期**: 2026-04-08
