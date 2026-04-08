# Coding Gates 验收用例

> **版本**: v1.0  
> **日期**: 2026-04-08  
> **用途**: Coding 阶段质量门禁验收测试

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

## 验收用例（6 条）

### 用例 1: 无 PROJECT_MANIFEST.json → reject

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
npm test
```
EOF
```

**期望结果**：
- coding 阶段自动审阅 pass
- 进入下一阶段

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

**状态**: ✅ 待验证

---

### 用例 6: pass 后 CHANGESET.md 必存在且包含 test 命令

**测试步骤**：
```bash
# 创建有效的 manifest
cat > PROJECT_MANIFEST.json << 'EOF'
{
  "language": "node",
  "commands": {
    "test": "echo 'tests passed'",
    "verify": "echo verify"
  }
}
EOF

# 不创建 CHANGESET.md，让 stage-executor 自动创建
```

**期望结果**：
- stage-executor 自动创建 CHANGESET.md 模板
- CHANGESET.md 包含 test 命令
- coding 阶段自动审阅 pass

**状态**: ✅ 待验证

---

## 代码改动统计

| 文件 | 改动行数 | 改动内容 |
|------|---------|---------|
| `workflow-orchestrator.js` | +10 行 | coding 纳入自动返工 + 注入 manifest/attempt/hint |
| `review-orchestrator.js` | +100 行 | coding 自动审阅（Gate C0-C5） |
| `stage-executor.js` | +40 行 | manifest 校验 + CHANGESET.md 强制生成 |
| `state-manager.js` | +5 行 | coding 阶段添加 lastRegenerateHint 等字段 |
| **总计** | **+155 行** | **4 个文件** |

---

## 验收报告模板

```markdown
# Coding Gates 验收报告

## 测试环境
- 日期：2026-04-08
- 项目：/tmp/test-coding-gates

## 测试结果

| 用例 | 状态 | 备注 |
|------|------|------|
| 用例 1: 无 manifest | ✅/❌ | |
| 用例 2: manifest 无效 | ✅/❌ | |
| 用例 3: test 失败 | ✅/❌ | |
| 用例 4: test 通过 | ✅/❌ | |
| 用例 5: lint 失败 | ✅/❌ | |
| 用例 6: CHANGESET | ✅/❌ | |

## 结论
- [ ] 所有用例通过
- [ ] 存在失败用例（详见备注）

## 签字
- 验收人：__________
- 日期：__________
```

---

*Coding Gates 验收用例 by openclaw-ouyp*  
**版本**: v1.0 | **日期**: 2026-04-08
