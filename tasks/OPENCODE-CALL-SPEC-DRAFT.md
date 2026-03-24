# OpenCode 调用规范（修正草案）

> **版本**: v1.0（草案）  
> **创建日期**: 2026-03-24  
> **适用范围**: 所有研发任务（OpenCode 调用）  
> **状态**: 🟡 待主人审批

---

## 📋 问题背景

**历史问题**：
- OpenCode 调用超时/无响应
- 未在 git 仓库执行导致拒绝运行
- 任务描述模糊导致执行偏离
- 无超时控制导致长时间等待

**根因分析**：
- 未使用 PTY 模式（`bash -c`）
- 未检查 git 仓库环境
- 任务描述不规范
- 未设置超时控制

---

## 🎯 修正目标

1. ✅ **调用成功率**：100%（不超时/不卡住）
2. ✅ **环境检查**：执行前自动检查
3. ✅ **任务描述**：标准化模板
4. ✅ **超时控制**：按阶段设置合理超时

---

## 📊 调用节点梳理

### 研发流程中的调用点

| 阶段 | 调用点 | 调用方 | 被调用方 | 产出 |
|------|--------|--------|---------|------|
| **阶段 1→2** | 启动研发执行 | OpenClaw | OpenCode | PRD+TRD+ROADMAP+DETAIL+CODE |
| **阶段 2 内部** | designing skill | OpenCode | designing skill | PRD.md + TRD.md |
| **阶段 2 内部** | roadmapping skill | OpenCode | roadmapping skill | ROADMAP.md |
| **阶段 2 内部** | detailing skill | OpenCode | detailing skill | DETAIL.md + CONTEXT_PREFIX.md |
| **阶段 2 内部** | coding skill | OpenCode | coding skill | 代码 + 测试 |
| **阶段 2 内部** | code-commit skill | OpenCode | code-commit skill | 自我验证报告 |
| **阶段 2 内部** | reviewing skill | OpenCode | reviewing skill | 审查请求 |

---

## 🔧 修正方案

### 修正 1：调用方式标准化

**标准格式**：
```bash
cd <任务目录> && timeout <超时秒数> bash -c 'opencode run "任务描述"'
```

**超时标准**：
| 阶段 | 超时时间 | 说明 |
|------|---------|------|
| designing | 300 秒 | PRD + TRD（需求分析） |
| roadmapping | 300 秒 | ROADMAP（规划分解） |
| detailing | 300 秒 | DETAIL + CONTEXT_PREFIX（详设） |
| coding | 600 秒 | 代码 + 测试（编码较长） |
| code-commit | 300 秒 | 自我验证 |
| reviewing | 300 秒 | 请求审查 |

**示例**：
```bash
# designing skill
cd tasks/20260324-ddg-websearch && \
timeout 300 bash -c 'opencode run "读取 REQUIREMENTS.md，调用 designing skill 编写 PRD.md + TRD.md"'

# coding skill
cd tasks/20260324-ddg-websearch && \
timeout 600 bash -c 'opencode run "读取 DETAIL.md，调用 coding skill 编写代码 + 测试"'
```

---

### 修正 2：调用前检查清单

**执行前必查（4 项）**：

```bash
# 1. opencode 是否安装
which opencode || { echo "❌ opencode 未安装"; exit 1; }

# 2. 是否在 git 仓库
cd <任务目录> && git rev-parse --is-inside-work-tree || { echo "❌ 非 git 仓库"; exit 1; }

# 3. 需求文档是否存在
test -f 01_designing/REQUIREMENTS.md || { echo "❌ 需求文档不存在"; exit 1; }

# 4. 目录结构是否完整
for dir in 01_designing 02_roadmapping 03_detailing 04_coding 05_documentation; do
  test -d "$dir" || { echo "❌ 目录不存在：$dir"; exit 1; }
done
```

**检查通过后**：方可调用 OpenCode

---

### 修正 3：任务描述模板

**标准格式**：

```markdown
你正在参与 <任务名称> 研发任务（任务 ID: <任务 ID>）。

任务目录结构：
- 01_designing/ (设计阶段) - 已有 REQUIREMENTS.md
- 02_roadmapping/ (规划阶段) - 待生成
- 03_detailing/ (详设阶段) - 待生成
- 04_coding/ (编码阶段) - 待生成
- 05_documentation/ (文档阶段) - 待生成

你的任务：
1. 读取 01_designing/REQUIREMENTS.md（<N>个功能需求）
2. 调用 <skill 名称> skill 编写 <产出文件>
3. 遵循 L1-L4 规范（核心定位/生产区纯净/命名归一化/Plan-and-Execute）
4. 命名统一为 <模块名>
5. 测试覆盖率 ≥ 80%

完成后向 OpenClaw 汇报，请求验收验证。
```

**示例**：
```
你正在参与 DDG Web Search 研发任务（任务 ID: 20260324-ddg-websearch）。

任务目录结构：
- 01_designing/ (设计阶段) - 已有 REQUIREMENTS.md
- 02_roadmapping/ (规划阶段) - 待生成
- 03_detailing/ (详设阶段) - 待生成
- 04_coding/ (编码阶段) - 待生成
- 05_documentation/ (文档阶段) - 待生成

你的任务：
1. 读取 01_designing/REQUIREMENTS.md（15 个功能需求）
2. 调用 designing skill 编写 PRD.md + TRD.md
3. 遵循 L1-L4 规范
4. 命名统一为 ddg-websearch
5. 测试覆盖率 ≥ 80%

完成后向 OpenClaw 汇报，请求验收验证。
```

---

### 修正 4：调用后验证

**执行后必查（3 项）**：

```bash
# 1. 检查退出码
if [ $? -eq 0 ]; then
  echo "✅ OpenCode 执行成功"
elif [ $? -eq 124 ]; then
  echo "❌ OpenCode 执行超时"
else
  echo "❌ OpenCode 执行失败"
fi

# 2. 检查产出文件
ls -lh 01_designing/PRD.md 2>/dev/null || echo "❌ PRD.md 未生成"
ls -lh 02_roadmapping/ROADMAP.md 2>/dev/null || echo "❌ ROADMAP.md 未生成"

# 3. 检查 L4 规范
~/.openclaw/workspace/NORMS/checks/check-norm-04.sh
```

---

## 📊 执行流程

### 完整调用流程

```
1. 调用前检查（4 项）
   ↓
2. 构建任务描述（标准模板）
   ↓
3. 执行调用（PTY 模式 + 超时控制）
   ↓
4. 调用后验证（3 项）
   ↓
5. L4 规范检查
   ↓
6. 记录调用结果
```

---

## 📋 验收标准

| 验收项 | 标准 | 验证方法 |
|--------|------|---------|
| **调用成功率** | 100% | 10 次调用全部成功 |
| **超时控制** | 不超设定时间 | timeout 命令验证 |
| **环境检查** | 自动检查 4 项 | 检查脚本验证 |
| **产出完整** | PRD+ROADMAP+DETAIL+CODE | 文件存在验证 |
| **规范通过** | L4 检查通过 | check-norm-04.sh 验证 |

---

## 🔗 相关链接

- [L4 规范](../../../.openclaw/workspace/NORMS/core/04-plan-and-execute.md)
- [L1 规范](../../../.openclaw/workspace/NORMS/core/01-core-positioning.md)
- [OpenCode 验证报告](../20260324-ddg-websearch/OPENCODE-VERIFICATION.md)

---

## 📝 修订历史

| 版本 | 日期 | 变更说明 | 作者 |
|------|------|---------|------|
| v1.0 | 2026-03-24 | 初始草案 | OpenClaw |

---

*草案创建完成于 2026-03-24*  
*创建人：OpenClaw*  
*状态：🟡 待主人审批*
