# Releasing Gates 验收用例

> **版本**: v1.0  
> **日期**: 2026-04-08  
> **用途**: Releasing 阶段质量门禁验收测试（4 条用例）

---

## 测试环境准备

```bash
# 创建测试项目（已经完成 designing→reviewing）
mkdir -p /tmp/test-releasing-gates
cd /tmp/test-releasing-gates

# ... 省略前面阶段的准备工作 ...

# 创建 05_reviewing/RELEASE_READINESS.json (PASS)
mkdir -p 05_reviewing
cat > 05_reviewing/RELEASE_READINESS.json << 'EOF'
{
  "schemaVersion": "v1",
  "result": "PASS",
  "generatedAt": "2026-04-08T17:00:00Z",
  "blockingIssues": []
}
EOF
```

---

## 验收用例（4 条）

### 用例 1: readiness 缺失 → reject

**测试步骤**：
```bash
# 删除 readiness 文件
rm -f 05_reviewing/RELEASE_READINESS.json

# 启动流程到 releasing 阶段
```

**期望结果**：
- releasing 自动审阅 reject
- fixItems: `[{ id: 'RL0_READINESS_MISSING', ... }]`
- 提示先完成 reviewing 阶段

**证据点**：
- `.cdf-state.json` → `stages.releasing.reviewDecision = 'reject'`
- `.cdf-state.json` → `stages.releasing.fixItems[].id = 'RL0_READINESS_MISSING'`
- console log → "RL0_READINESS_MISSING"

**状态**: ✅ 待验证

---

### 用例 2: readiness.result != PASS → reject

**测试步骤**：
```bash
# 修改 readiness 结果为 FAIL
cat > 05_reviewing/RELEASE_READINESS.json << 'EOF'
{
  "schemaVersion": "v1",
  "result": "FAIL",
  "generatedAt": "2026-04-08T17:00:00Z",
  "blockingIssues": [
    {
      "stage": "testing",
      "gateId": "RG3_TESTING_NOT_PASS",
      "description": "测试未通过"
    }
  ]
}
EOF
```

**期望结果**：
- releasing 自动审阅 reject
- fixItems: 包含 reviewing 阻塞项
- 提示修复 reviewing 阻塞项

**证据点**：
- `.cdf-state.json` → `stages.releasing.reviewDecision = 'reject'`
- `.cdf-state.json` → `stages.releasing.fixItems[].id` 包含 `RL0_READINESS_RG3_TESTING_NOT_PASS`
- console log → "Release Readiness 检查结果为 FAIL"

**状态**: ✅ 待验证

---

### 用例 3: releasing 产出缺失 → reject

**测试步骤**：
```bash
# 删除 releasing 产出文件
rm -rf 06_releasing/

# 启动流程到 releasing 阶段
```

**期望结果**：
- releasing 自动审阅 reject
- fixItems: `[{ id: 'RL1_OUTPUT_MISSING', ... }]`
- 提示执行 Releasing 阶段生成完整的发布证据包

**证据点**：
- `.cdf-state.json` → `stages.releasing.reviewDecision = 'reject'`
- `.cdf-state.json` → `stages.releasing.fixItems[].id = 'RL1_OUTPUT_MISSING'`
- console log → "Releasing 产出文件缺失"

**状态**: ✅ 待验证

---

### 用例 4: 全通过 → pass

**测试步骤**：
```bash
# 确保 readiness.result = PASS
cat > 05_reviewing/RELEASE_READINESS.json << 'EOF'
{
  "schemaVersion": "v1",
  "result": "PASS",
  "generatedAt": "2026-04-08T17:00:00Z",
  "blockingIssues": []
}
EOF

# 确保 releasing 产出齐全
mkdir -p 06_releasing
# ... 执行 releasing 阶段生成所有产出文件 ...
```

**期望结果**：
- releasing 自动审阅 pass
- 06_releasing/ 包含所有产出文件：
  - RELEASE_RECORD.json
  - RELEASE_NOTES.md
  - ARTIFACT_MANIFEST.json
  - CLEANUP_PLAN.json
  - CLEANUP_REPORT.json

**证据点**：
- `.cdf-state.json` → `stages.releasing.reviewDecision = 'pass'`
- `.cdf-state.json` → `stages.releasing.fixItems = []`
- `06_releasing/` 目录包含所有必需文件

**状态**: ✅ 待验证

---

## 测试结果汇总表

| 用例编号 | 用例名称 | 预期结果 | 实际结果 | 证据位置 | 测试日期 | 测试人 |
|---------|---------|---------|---------|---------|---------|--------|
| 1 | readiness 缺失 → reject | reject + RL0_READINESS_MISSING | | | | |
| 2 | readiness.result != PASS → reject | reject + RL0_READINESS_* | | | | |
| 3 | releasing 产出缺失 → reject | reject + RL1_OUTPUT_MISSING | | | | |
| 4 | 全通过 → pass | pass | | | | |

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
| repo | `0863e44` | implement releasing stage |
| repo | `8f9875f` | ensure 05_reviewing/ exists |
| repo | `8a30c24` | remove duplicate executeReviewing |

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
    "releasing": {
      "reviewDecision": "reject",
      "fixItems": [
        {
          "id": "RL0_READINESS_MISSING",
          "description": "RELEASE_READINESS.json 文件不存在",
          "suggestion": "请先完成 reviewing 阶段并获得 PASS 放行凭证"
        }
      ]
    }
  }
}
```

**用例 4 证据**（示例）：
```json
{
  "stages": {
    "releasing": {
      "reviewDecision": "pass",
      "fixItems": []
    }
  }
}
```

**06_releasing/ 产出文件**（示例）：
```
06_releasing/
├── RELEASE_RECORD.json
├── RELEASE_NOTES.md
├── ARTIFACT_MANIFEST.json
├── CLEANUP_PLAN.json
└── CLEANUP_REPORT.json
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

*Releasing Gates 验收用例 by openclaw-ouyp*  
**版本**: v1.0 | **日期**: 2026-04-08
