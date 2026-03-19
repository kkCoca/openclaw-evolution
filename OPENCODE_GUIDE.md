# OpenCode 使用指南 - OmniForge 万象锻造

> **版本**: v1.0  
> **创建时间**: 2026-03-18  
> **用途**：规范 OpenCode 编码代理的使用方式

---

## ✅ OpenCode 已安装验证

```bash
which opencode
# 输出：/home/ouyp/.npm-global/bin/opencode
```

---

## 🚀 基本用法

### 1. 一次性任务（简单查询）

```bash
bash pty:true workdir:<任务目录> command:"opencode run '任务描述'"
```

**示例**：
```bash
bash pty:true workdir:/home/ouyp/Learning/Practice/openclaw-universe/tasks/20260318-duckduckgo-provider \
command:"opencode run '读取 01_designing/PRD.md，总结核心目标'"
```

### 2. 长时间研发任务（后台执行）

```bash
bash pty:true workdir:<任务目录> background:true command:"opencode run '完整任务描述'"
```

**返回**：`sessionId` 用于后续监控

**示例**：
```bash
bash pty:true workdir:/home/ouyp/Learning/Practice/openclaw-universe/tasks/20260318-duckduckgo-provider \
background:true \
command:"opencode run '读取 01/PRD.md，依次执行 02_roadmapping 和 03_detailing 阶段，生成 ROADMAP.md + TRD.md + DETAIL.md'"
```

---

## 📊 监控进度

### 列出所有运行中的会话

```bash
process action:list
```

### 查看特定会话输出

```bash
process action:log sessionId:<sessionId>
```

### 检查会话是否完成

```bash
process action:poll sessionId:<sessionId>
```

### 发送输入（如果 OpenCode 提问）

```bash
# 发送数据 + Enter 键
process action:submit sessionId:<sessionId> data:"yes"

# 仅发送数据（不按 Enter）
process action:write sessionId:<sessionId> data:"y"
```

### 终止会话

```bash
process action:kill sessionId:<sessionId>
```

---

## 📋 OmniForge 研发流程中的使用

### 阶段 1：任务发起（首席顾问执行）

```markdown
1. 创建任务目录
2. 读取 designing/SKILL.md
3. 执行五步流程（启动分析→确认→询问→输出→一致性检查）
4. 生成 PRD.md
```

### 阶段 2：链式推进（OpenCode 执行）

```bash
# 召唤 OpenCode
bash pty:true workdir:<任务目录> background:true \
command:"opencode run '
读取 01_designing/PRD.md，然后：
1. 读取 /home/ouyp/Documents/ai-toolkit/skills/roadmapping/SKILL.md
2. 生成 02_roadmapping/ROADMAP.md
3. 读取 /home/ouyp/Documents/ai-toolkit/skills/detailing/SKILL.md
4. 生成 03_detailing/TRD.md 和 DETAIL.md
完成后运行：openclaw system event --text \"Done: 技术详述完成\" --mode now
'"
```

### 阶段 3：最终编码（OpenCode 执行）

```bash
# 主人确认后执行
bash pty:true workdir:<任务目录> background:true \
command:"opencode run '
读取 03_detailing/TRD.md 和 DETAIL.md，然后：
1. 读取 /home/ouyp/Documents/ai-toolkit/skills/coding/SKILL.md
2. 生成 04_coding/ 源码文件
3. 编写单元测试
4. 运行测试验证
完成后运行：openclaw system event --text \"Done: 编码完成，测试通过\" --mode now
'"
```

---

## ⚠️ 重要规则

### 必须遵守

| 规则 | 说明 |
|------|------|
| **PTY 模式** | OpenCode 是交互式终端应用，必须使用 `pty:true` |
| **工作目录** | 使用 `workdir` 限制 OpenCode 只能访问任务目录 |
| **Git 仓库** | OpenCode 可能需要 git 仓库，确保任务目录在 git 项目中 |
| **禁止路径** | 绝不允许 OpenCode 访问 `~/.openclaw/`（会读取敏感配置） |

### 禁止行为

- ❌ 首席顾问自己直接写代码（必须召唤 OpenCode）
- ❌ 在非 git 目录运行 OpenCode
- ❌ 在 `~/clawd/` 或 `~/.openclaw/` 中运行 OpenCode
- ❌ 跳过文档直接编码（必须文档驱动）

---

## 🎯 完整示例：DuckDuckGo Provider 任务

### 步骤 1：首席顾问生成 PRD

```markdown
[首席顾问执行]
1. 创建目录：tasks/20260318-duckduckgo-provider/
2. 读取：/home/ouyp/Documents/ai-toolkit/skills/designing/SKILL.md
3. 执行五步流程 → 生成 01_designing/PRD.md
4. 汇报主人："PRD 已就绪，是否开始研发？"
```

### 步骤 2：主人确认

```
主人：请开始研发
```

### 步骤 3：首席顾问召唤 OpenCode

```bash
bash pty:true \
workdir:/home/ouyp/Learning/Practice/openclaw-universe/tasks/20260318-duckduckgo-provider \
background:true \
command:"opencode run '
你正在参与 DuckDuckGo Provider 研发任务。

任务目录结构：
- 01_designing/PRD.md (已完成)
- 02_roadmapping/ (待生成)
- 03_detailing/ (待生成)
- 04_coding/ (待生成)

你的任务：
1. 读取 01_designing/PRD.md
2. 读取技能规范：/home/ouyp/Documents/ai-toolkit/skills/roadmapping/SKILL.md
3. 生成 02_roadmapping/ROADMAP.md
4. 读取技能规范：/home/ouyp/Documents/ai-toolkit/skills/detailing/SKILL.md
5. 生成 03_detailing/TRD.md 和 DETAIL.md
6. 完成后向首席顾问汇报

完成后运行：openclaw system event --text \"Done: 02+03 阶段完成\" --mode now
'"
```

### 步骤 4：监控进度

```bash
# 列出会话
process action:list

# 查看输出
process action:log sessionId:<sessionId>

# 检查完成状态
process action:poll sessionId:<sessionId>
```

### 步骤 5：汇报主人

```markdown
尊主，OpenCode 已完成 02+03 阶段：
- ✅ 02_roadmapping/ROADMAP.md
- ✅ 03_detailing/TRD.md
- ✅ 03_detailing/DETAIL.md

**是否开始 04_coding 最终编码？**
```

---

## 📈 最佳实践

### 1. 任务描述要具体

```bash
# ❌ 模糊
opencode run "写代码"

# ✅ 具体
opencode run "读取 03_detailing/TRD.md，实现 DDGProvider 类，包含 search() 方法和缓存功能"
```

### 2. 指定参考文档

```bash
opencode run "
参考以下文档：
- /home/ouyp/Documents/ai-toolkit/skills/coding/SKILL.md
- 03_detailing/TRD.md
- 03_detailing/DETAIL.md

生成 04_coding/ 源码文件。
"
```

### 3. 设置完成通知

```bash
opencode run "
... 任务描述 ...

完成后运行：openclaw system event --text \"Done: 任务完成\" --mode now
"
```

### 4. 后台任务定期监控

```bash
# 每 5 分钟检查一次
process action:poll sessionId:<sessionId>
process action:log sessionId:<sessionId> limit:50
```

---

## 🔧 故障排除

### OpenCode 拒绝运行

**原因**：不在 git 仓库中

**解决**：
```bash
cd <任务目录> && git init
```

### OpenCode 卡住不动

**检查**：
```bash
process action:log sessionId:<sessionId> limit:100
```

**解决**：
```bash
# 发送 Enter 键
process action:submit sessionId:<sessionId> data:""

# 或终止会话
process action:kill sessionId:<sessionId>
```

### 输出乱码

**原因**：未使用 PTY 模式

**解决**：必须使用 `pty:true`

---

*本文档由 openclaw-ouyp 按 AGENTS.md v2.8 标准生成*
