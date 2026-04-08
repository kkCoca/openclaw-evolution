# Reviewing Gates 验收用例

> **版本**: v1.0  
> **日期**: 2026-04-08  
> **用途**: Reviewing 阶段质量门禁验收测试（3 条用例）

---

## 测试环境准备

```bash
# 创建测试项目
mkdir -p /tmp/test-reviewing-gates
cd /tmp/test-reviewing-gates

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

## 验收用例（3 条）

### 用例 1: 05_reviewing/ 不存在 → reject

**测试步骤**：
```bash
# 确保 05_reviewing/ 不存在
rm -rf 05_reviewing/

# 启动流程到 reviewing 阶段
```

**期望结果**：
- reviewing 自动审阅 reject
- fixItems: `[{ id: 'RG0_REVIEWING_DIR_MISSING', ... }]`
- 流程进入 handleReviewDecision 处理（重跑或终止）

**证据点**：
- `.cdf-state.json` → `stages.reviewing.reviewDecision = 'reject'`
- `.cdf-state.json` → `stages.reviewing.fixItems[].id = 'RG0_REVIEWING_DIR_MISSING'`
- console log → "RG0_REVIEWING_DIR_MISSING"

**状态**: ✅ 待验证

---

### 用例 2: 05_reviewing/ 存在但无 .md 文件 → reject

**测试步骤**：
```bash
# 创建空的 05_reviewing/ 目录
mkdir -p 05_reviewing/

# 或者创建只有非 md 文件的目录
echo "test" > 05_reviewing/test.txt
```

**期望结果**：
- reviewing 自动审阅 reject
- fixItems: `[{ id: 'RG1_REVIEWING_OUTPUT_EMPTY', ... }]`
- 流程进入 handleReviewDecision 处理

**证据点**：
- `.cdf-state.json` → `stages.reviewing.reviewDecision = 'reject'`
- `.cdf-state.json` → `stages.reviewing.fixItems[].id = 'RG1_REVIEWING_OUTPUT_EMPTY'`
- console log → "RG1_REVIEWING_OUTPUT_EMPTY"

**状态**: ✅ 待验证

---

### 用例 3: FINAL_REPORT.md 为空 → reject

**测试步骤**：
```bash
# 创建 05_reviewing/ 目录
mkdir -p 05_reviewing/

# 创建空的 FINAL_REPORT.md
touch 05_reviewing/FINAL_REPORT.md

# 可选：创建其他非空 .md 文件（测试 RG2 独立触发）
echo "# Report" > 05_reviewing/other.md
```

**期望结果**：
- reviewing 自动审阅 reject
- fixItems: `[{ id: 'RG2_REVIEWING_REPORT_EMPTY', ... }]`
- 流程进入 handleReviewDecision 处理

**证据点**：
- `.cdf-state.json` → `stages.reviewing.reviewDecision = 'reject'`
- `.cdf-state.json` → `stages.reviewing.fixItems[].id = 'RG2_REVIEWING_REPORT_EMPTY'`
- `.cdf-state.json` → `stages.reviewing.fixItems[].suggestion` 包含"结论/变更摘要/验证链接"
- console log → "RG2_REVIEWING_REPORT_EMPTY"

**状态**: ✅ 待验证

---

## 测试结果汇总表

| 用例编号 | 用例名称 | 预期结果 | 实际结果 | 证据位置 | 测试日期 | 测试人 |
|---------|---------|---------|---------|---------|---------|--------|
| 1 | 05_reviewing/ 不存在 → reject | reject + RG0_REVIEWING_DIR_MISSING | | | | |
| 2 | 05_reviewing/ 存在但无 .md → reject | reject + RG1_REVIEWING_OUTPUT_EMPTY | | | | |
| 3 | FINAL_REPORT.md 为空 → reject | reject + RG2_REVIEWING_REPORT_EMPTY | | | | |

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
| repo | `d990d28` | update testing 用例 2 证据点 |
| repo | `ecf8b3a` | align testing gates |
| repo | `17647b1` | implement testing stage |

### 测试结果

| 用例编号 | 结果（✅/❌） | 备注 | 证据位置 |
|---------|------------|------|---------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

### 证据示例

**用例 1 证据**（示例）：
```json
{
  "stages": {
    "reviewing": {
      "reviewDecision": "reject",
      "fixItems": [
        {
          "id": "RG0_REVIEWING_DIR_MISSING",
          "description": "05_reviewing/ 目录不存在",
          "suggestion": "请执行 Reviewing 阶段生成验收报告"
        }
      ]
    }
  }
}
```

**用例 2 证据**（示例）：
```json
{
  "stages": {
    "reviewing": {
      "reviewDecision": "reject",
      "fixItems": [
        {
          "id": "RG1_REVIEWING_OUTPUT_EMPTY",
          "description": "05_reviewing/ 目录没有任何 .md 文件",
          "suggestion": "请执行 Reviewing 阶段生成至少一个 markdown 验收报告"
        }
      ]
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

*Reviewing Gates 验收用例 by openclaw-ouyp*  
**版本**: v1.0 | **日期**: 2026-04-08
