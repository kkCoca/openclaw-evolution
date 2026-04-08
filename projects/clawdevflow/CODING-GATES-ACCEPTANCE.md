# Coding Gates 验收用例

> **版本**: v2.0  
> **日期**: 2026-04-08  
> **用途**: Coding 阶段质量门禁验收测试（8 条用例）

---

## 测试环境准备

```bash
# 创建测试项目
mkdir -p /tmp/test-coding-gates
cd /tmp/test-coding-gates

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
```

---

## 验收用例（8 条）

### 用例 1: 无 PROJECT_MANIFEST.json → reject → 自动返工

**测试步骤**：
```bash
# 不创建 PROJECT_MANIFEST.json
# 启动流程
/sessions_spawn clawdevflow
# 任务：测试功能
# 场景类型：全新功能
# 需求说明：REQUIREMENTS.md
# 输出目录：/tmp/test-coding-gates/
```

**期望结果**：
- coding 阶段自动审阅 reject
- fixItems: `[{ id: 'MANIFEST_MISSING', ... }]`
- retryCount++
- 自动返工触发

**证据点**：
- `.cdf-state.json` → `stages.coding.retryCount` 递增
- `.cdf-state.json` → `stages.coding.lastRegenerateHint` 包含修复建议
- console log → "MANIFEST_MISSING"

**状态**: ✅ 待验证

---

### 用例 2: manifest JSON 无效 → reject

**测试步骤**：
```bash
# 创建无效的 JSON
cat > PROJECT_MANIFEST.json << 'EOF'
{ invalid json
EOF
```

**期望结果**：
- coding 阶段自动审阅 reject
- fixItems: `[{ id: 'MANIFEST_INVALID', ... }]`
- retryCount++

**证据点**：
- `.cdf-state.json` → `stages.coding.reviewDecision = 'reject'`
- console log → "MANIFEST_INVALID"

**状态**: ✅ 待验证

---

### 用例 3: commands.test 执行失败 → reject

**测试步骤**：
```bash
# 创建有效的 manifest，但 test 命令会失败
cat > PROJECT_MANIFEST.json << 'EOF'
{
  "language": "node",
  "commands": {
    "test": "exit 1",
    "verify": "echo verify"
  }
}
EOF

# 创建简单的 src 文件
mkdir -p 04_coding/src
echo "console.log('hello');" > 04_coding/src/index.js
```

**期望结果**：
- coding 阶段自动审阅 reject
- fixItems: `[{ id: 'TEST_FAILED', ... }]`
- retryCount++

**证据点**：
- `.cdf-state.json` → `stages.coding.lastBlockingIssues[].id = 'TEST_FAILED'`
- console log → "TEST_FAILED"

**状态**: ✅ 待验证

---

### 用例 4: commands.test 通过 → pass

**测试步骤**：
```bash
# 创建有效的 manifest 和测试
cat > PROJECT_MANIFEST.json << 'EOF'
{
  "language": "node",
  "commands": {
    "test": "echo 'tests passed'",
    "verify": "echo verify"
  }
}
EOF

# 创建 CHANGESET.md
mkdir -p 04_coding
cat > 04_coding/CHANGESET.md << 'EOF'
# 变更说明
## 如何跑命令
```bash
echo 'tests passed'
```
EOF
```

**期望结果**：
- coding 阶段自动审阅 pass
- 进入下一阶段

**证据点**：
- `.cdf-state.json` → `stages.coding.reviewDecision = 'pass'`
- `.cdf-state.json` → `stages.coding.status = 'passed'`
- console log → "所有质量门禁通过"

**状态**: ✅ 待验证

---

### 用例 5: 配置 lint/build 时失败必须 reject

**测试步骤**：
```bash
# 创建包含 lint/build 的 manifest
cat > PROJECT_MANIFEST.json << 'EOF'
{
  "language": "node",
  "commands": {
    "test": "echo 'tests passed'",
    "lint": "exit 1",
    "build": "echo 'build ok'",
    "verify": "echo verify"
  }
}
EOF
```

**期望结果**：
- coding 阶段自动审阅 reject
- fixItems: `[{ id: 'LINT_FAILED', ... }]`

**证据点**：
- `.cdf-state.json` → `stages.coding.lastBlockingIssues[].id = 'LINT_FAILED'`
- console log → "LINT_FAILED"

**状态**: ✅ 待验证

---

### 用例 6: CHANGESET 自动生成且包含真实 testCmd → pass

**测试步骤**：
```bash
# 创建有效的 manifest
cat > PROJECT_MANIFEST.json << 'EOF'
{
  "language": "node",
  "commands": {
    "test": "jest --coverage",
    "verify": "echo verify"
  }
}
EOF

# 不创建 CHANGESET.md，让 stage-executor 自动创建
```

**期望结果**：
- stage-executor 自动创建 CHANGESET.md 模板
- CHANGESET.md 包含真实 test 命令（`jest --coverage`）
- coding 阶段自动审阅 pass

**证据点**：
- `04_coding/CHANGESET.md` → 包含 `jest --coverage`
- console log → "CHANGESET.md 模板已创建（testCmd: jest --coverage）"

**状态**: ✅ 待验证

---

### 用例 7: roadmapping 缺 ROADMAP.md → reject → 自动返工

**测试步骤**：
```bash
# 删除 ROADMAP.md
rm -f 02_roadmapping/ROADMAP.md

# 启动流程到 roadmapping 阶段
```

**期望结果**：
- roadmapping 自动审阅 reject
- fixItems: `[{ id: 'ROADMAP_MISSING', ... }]`
- retryCount++
- 自动返工触发（不出现 BLOCKED）

**证据点**：
- `.cdf-state.json` → `stages.roadmapping.retryCount` 递增
- `.cdf-state.json` → `stages.roadmapping.reviewDecision = 'reject'`
- console log → "ROADMAP_MISSING"

**状态**: ✅ 待验证

---

### 用例 8: coding 缺 manifest → reject → 自动返工补齐

**测试步骤**：
```bash
# 删除 PROJECT_MANIFEST.json
rm -f PROJECT_MANIFEST.json

# 启动流程到 coding 阶段
```

**期望结果**：
- coding 自动审阅 reject
- fixItems: `[{ id: 'MANIFEST_MISSING', ... }]`
- retryCount++
- 写入 lastRegenerateHint
- 自动返工补齐 manifest（不出现 BLOCKED）

**证据点**：
- `.cdf-state.json` → `stages.coding.retryCount` 递增
- `.cdf-state.json` → `stages.coding.lastRegenerateHint` 包含修复建议
- console log → "MANIFEST_MISSING"

**状态**: ✅ 待验证

---

## 测试结果汇总表

| 用例编号 | 用例名称 | 预期结果 | 实际结果 | 证据位置 | 测试日期 | 测试人 |
|---------|---------|---------|---------|---------|---------|--------|
| 1 | 无 manifest → reject → 返工 | reject + retryCount++ | | | | |
| 2 | manifest 无效 → reject | reject + retryCount++ | | | | |
| 3 | test 失败 → reject | reject + TEST_FAILED | | | | |
| 4 | test 通过 → pass | pass | | | | |
| 5 | lint 失败 → reject | reject + LINT_FAILED | | | | |
| 6 | CHANGESET 自动生成 | pass + 包含真实 testCmd | | | | |
| 7 | roadmapping 缺 ROADMAP → reject → 返工 | reject + retryCount++ | | | | |
| 8 | coding 缺 manifest → reject → 返工 | reject + retryCount++ | | | | |

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
| repo | `9b71c91` | restore auto-convergence |
| repo | `a05104e` | 更新验收用例 |

### 测试结果

| 用例编号 | 结果（✅/❌） | 备注 | 证据位置 |
|---------|------------|------|---------|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |
| 6 | | | |
| 7 | | | |
| 8 | | | |

### 证据示例

**用例 1 证据**（示例）：
```json
{
  "stages": {
    "coding": {
      "retryCount": 1,
      "lastRegenerateHint": "【MANIFEST_MISSING】请创建 PROJECT_MANIFEST.json",
      "reviewDecision": "reject"
    }
  }
}
```

**用例 7 证据**（示例）：
```json
{
  "stages": {
    "roadmapping": {
      "retryCount": 2,
      "lastBlockingIssues": [
        {
          "id": "ROADMAP_MISSING",
          "message": "ROADMAP.md 文件不存在"
        }
      ],
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

*Coding Gates 验收用例 by openclaw-ouyp*  
**版本**: v2.0 | **日期**: 2026-04-08
