# OpenCode 调用规范（最终版）

> **版本**: v1.0（最终版）  
> **创建日期**: 2026-03-24  
> **适用范围**: 所有研发任务（OpenCode 调用）  
> **状态**: ✅ 已审批

---

## 📋 问题背景

**历史问题**：
- OpenCode 尝试访问系统目录规范文件（沙箱权限拒绝）
- 任务描述引用规范路径（导致 OpenCode 读取外部文件）
- 规范多处引用可能导致不一致

**根因分析**：
- 系统规范在系统目录（`~/.openclaw/workspace/NORMS/`）
- OpenCode 沙箱权限限制：仅允许访问项目目录
- 任务设计让 OpenCode 读取规范文件（越权）

---

## 🎯 核心原则

| 原则 | 说明 | 不可妥协 |
|------|------|---------|
| **1. 系统规范在系统目录** | `~/.openclaw/workspace/NORMS/` 为单一事实源 | ✅ 是 |
| **2. OpenCode 不读取规范** | 任务描述中不引用规范路径 | ✅ 是 |
| **3. OpenClaw 传递具体要求** | 任务描述中明确具体要求 | ✅ 是 |
| **4. OpenClaw 负责验收** | L4 检查脚本验证规范合规 | ✅ 是 |

---

## 📊 职责边界

| 职责 | OpenClaw | OpenCode |
|------|---------|---------|
| **规范维护** | ✅ 负责（系统目录） | ❌ 不参与 |
| **规范验收** | ✅ 负责（L4 检查） | ❌ 不参与 |
| **任务描述** | ✅ 负责（传递具体要求） | ❌ 不参与 |
| **任务执行** | ❌ 不越权 | ✅ 负责（按任务描述执行） |
| **产出合规** | ✅ 验收 | ✅ 按任务描述执行 |

---

## 🔧 调用方式标准化

### 标准格式

```bash
cd <任务目录> && timeout <超时秒数> bash -c 'opencode run "任务描述"'
```

### 超时标准

| 阶段 | 超时时间 | 说明 |
|------|---------|------|
| designing | 300 秒 | PRD + TRD（需求分析） |
| roadmapping | 300 秒 | ROADMAP（规划分解） |
| detailing | 300 秒 | DETAIL + CONTEXT_PREFIX（详设） |
| coding | 600 秒 | 代码 + 测试（编码较长） |
| code-commit | 300 秒 | 自我验证 |
| reviewing | 300 秒 | 请求审查 |

---

## 📋 任务描述模板

### 正确的任务描述

```markdown
你正在参与 <任务名称> 研发任务（任务 ID: <任务 ID>）。

请阅读 01_designing/REQUIREMENTS.md（<N>个功能需求）。

你的任务：
1. 调用 <skill 名称> skill 编写 <产出文件>
2. 命名统一为 <模块名>
3. 生产区仅包含 dist/
4. 测试覆盖率 ≥ 80%

完成后 OpenClaw 会进行规范验收。
```

### 错误的任务描述

```markdown
❌ 遵循 L1-L4 规范（核心定位/生产区纯净/命名归一化/Plan-and-Execute）
❌ 详见 ~/.openclaw/workspace/NORMS/core/04-plan-and-execute.md
```

**区别**：
- ✅ 正确：OpenClaw 传递具体要求，OpenCode 执行
- ❌ 错误：让 OpenCode 读取规范文件（沙箱权限拒绝）

---

## 🔍 调用前检查（4 项必查）

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

---

## ✅ 调用后验证（3 项必查）

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

```
1. 调用前检查（4 项）
   ↓
2. 构建任务描述（明确要求，不引用规范路径）
   ↓
3. 执行调用（PTY 模式 + 超时控制）
   ↓
4. 调用后验证（3 项）
   ↓
5. L4 规范检查（OpenClaw 负责）
   ↓
6. 记录调用结果
```

---

## 🔗 相关链接

- [L4 规范 v3.0](../../../.openclaw/workspace/NORMS/core/04-plan-and-execute.md)
- [L1 规范](../../../.openclaw/workspace/NORMS/core/01-core-positioning.md)
- [需求清单模板](01_designing/REQUIREMENTS.md)

---

## 📝 修订历史

| 版本 | 日期 | 变更说明 | 作者 |
|------|------|---------|------|
| v1.0 | 2026-03-24 | 最终版（规范内嵌 + 职责清晰） | OpenClaw |

---

*草案创建完成于 2026-03-24*  
*创建人：OpenClaw*  
*状态：✅ 已审批*
