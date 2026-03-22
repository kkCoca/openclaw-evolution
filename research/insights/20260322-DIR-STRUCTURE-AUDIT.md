# 工程目录结构审查报告

> **文档编号**: AUDIT-20260322-001  
> **版本**: 1.0.0  
> **创建日期**: 2026-03-22 10:50  
> **审查人**: OpenClaw (主权维护者)  
> **审查范围**: 系统私有区 + 项目主权区  
> **审查目的**: 清理不规范文件结构，达到精华级别

---

## 🎯 执行摘要

**审查发现**:
- 🔴 严重问题：3 个
- 🟡 中等问题：5 个
- 🟢 轻微问题：4 个

**建议清理**:
- 删除文件：12 个
- 合并文件：3 个
- 移动文件：5 个
- 重命名目录：2 个

**优先级**: 
- P0 (立即清理): 3 项
- P1 (本周清理): 5 项
- P2 (本月清理): 4 项

---

## 📊 审查范围

### 区域 1: 系统私有区 (~/.openclaw/workspace/)

**目录结构**:
```
~/.openclaw/workspace/
├── AGENTS.md ✅
├── SOUL.md ✅
├── MEMORY.md ✅
├── HEARTBEAT.md ✅
├── NORMS/ ✅ (规范体系)
├── tasks/ ⚠️ (应移动到项目区)
├── skills/ ⚠️ (应使用 clawhub 管理)
├── extensions/ ⚠️ (应移动到项目区)
├── research/ ⚠️ (应移动到项目区)
├── memory/ ❌ (冗余，应合并到 MEMORY.md)
├── notes/ ❌ (冗余，应删除)
├── logs/ ⚠️ (需整理)
└── .state/ ✅ (状态追踪)
```

### 区域 2: 项目主权区 (openclaw-universe)

**目录结构**:
```
openclaw-universe/
├── tasks/ ✅
├── extensions/ ✅
├── research/insights/ ✅
├── scripts/ ✅
├── briefings/ ⚠️ (需整理)
├── logs/ ⚠️ (需整理)
├── NORMS -> ~/.openclaw/workspace/NORMS ✅ (软链接)
└── AGENTS.md ⚠️ (与系统区重复)
```

---

## 🔴 严重问题 (P0 - 立即清理)

### 问题 1: 系统私有区包含应归档的 tasks

**位置**: `~/.openclaw/workspace/tasks/`

**问题文件**:
```
tasks/20260318-duckduckgo-provider/ (已完成，应归档)
tasks/20260318-duckduckgo-provider-integration/ (重复，应删除)
tasks/20260319-ddg-fallback-skill/ (已完成，应归档)
tasks/20260319-plan-execute-experiment/ (应移动到项目区)
```

**影响**: 
- 系统私有区与项目主权区混淆
- 违反 AGENTS.md 物理边界原则

**整改措施**:
```bash
# 1. 删除重复目录
rm -rf ~/.openclaw/workspace/tasks/20260318-duckduckgo-provider-integration/

# 2. 移动未完成到项目区
mv ~/.openclaw/workspace/tasks/20260319-plan-execute-experiment/ \
   /home/ouyp/Learning/Practice/openclaw-universe/tasks/

# 3. 归档已完成
mkdir -p ~/.openclaw/workspace/tasks/archive/
mv ~/.openclaw/workspace/tasks/20260318-* ~/.openclaw/workspace/tasks/archive/
mv ~/.openclaw/workspace/tasks/20260319-ddg-fallback-skill/ ~/.openclaw/workspace/tasks/archive/
```

**责任人**: OpenClaw  
**截止时间**: 2026-03-22 12:00

---

### 问题 2: memory/ 目录冗余

**位置**: `~/.openclaw/workspace/memory/`

**问题文件**:
```
memory/2026-03-07.md (旧，应合并到 MEMORY.md)
memory/2026-03-07-qq-bot.md (旧，应删除)
memory/2026-03-07-qq-integration.md (旧，应删除)
memory/2026-03-11.md (旧，应合并)
memory/2026-03-17.md (旧，应合并)
memory/2026-03-22.md (旧，应合并)
memory/AI-LEARNING-PATH.md (应移动到 research/)
memory/AI-QUICKSTART.md (应移动到 research/)
memory/moltbook-favorites.md (应删除)
memory/MOLTBOOK-MANAGEMENT.md (应移动到 research/)
memory/MOLTBOOK-RSS-DESIGN.md (应移动到 research/)
```

**影响**:
- MEMORY.md 是单一事实源，memory/ 目录冗余
- 违反"单一事实源"原则

**整改措施**:
```bash
# 1. 备份重要文件
cp ~/.openclaw/workspace/memory/AI-LEARNING-PATH.md \
   /home/ouyp/Learning/Practice/openclaw-universe/research/

# 2. 删除冗余文件
rm -rf ~/.openclaw/workspace/memory/

# 3. 更新 MEMORY.md (如有需要合并的内容)
```

**责任人**: OpenClaw  
**截止时间**: 2026-03-22 12:00

---

### 问题 3: skills/ 目录管理混乱

**位置**: `~/.openclaw/workspace/skills/`

**问题**:
```
skills/duckduckgo-fallback/ (应使用 clawhub 管理)
skills/git/ (应使用 clawhub 管理)
skills/obsidian-auto-organizer/ (应使用 clawhub 管理)
skills/qwen-web-search/ (应使用 clawhub 管理)
skills/session-context-enhancer/ (应使用 clawhub 管理)
```

**影响**:
- skills 应通过 clawhub 统一管理
- 手动管理导致版本混乱

**整改措施**:
```bash
# 1. 使用 clawhub 同步 skills
clawhub sync

# 2. 或标记为本地 skills
mkdir -p ~/.openclaw/workspace/skills-local/
mv ~/.openclaw/workspace/skills/ ~/.openclaw/workspace/skills-local/
```

**责任人**: OpenClaw  
**截止时间**: 2026-03-22 15:00

---

## 🟡 中等问题 (P1 - 本周清理)

### 问题 4: notes/ 目录冗余

**位置**: `~/.openclaw/workspace/notes/`

**问题文件**:
```
notes/moltbook/README.md (冗余)
notes/moltbook/templates/ (冗余)
notes/user-interests.md (应合并到 USER.md)
```

**整改措施**:
```bash
# 1. 合并 user-interests 到 USER.md
cat ~/.openclaw/workspace/notes/user-interests.md >> ~/.openclaw/workspace/USER.md

# 2. 删除 notes 目录
rm -rf ~/.openclaw/workspace/notes/
```

**责任人**: OpenClaw  
**截止时间**: 2026-03-23

---

### 问题 5: extensions/ 目录位置错误

**位置**: `~/.openclaw/workspace/extensions/`

**问题**:
```
extensions/duckduckgo-fallback/ (应移动到项目区)
extensions/search_providers/ (应移动到项目区)
```

**整改措施**:
```bash
# 1. 移动到项目区
mv ~/.openclaw/workspace/extensions/duckduckgo-fallback/ \
   /home/ouyp/Learning/Practice/openclaw-universe/extensions/

# 2. 删除空目录
rmdir ~/.openclaw/workspace/extensions/
```

**责任人**: OpenClaw  
**截止时间**: 2026-03-23

---

### 问题 6: research/ 目录位置错误

**位置**: `~/.openclaw/workspace/research/`

**问题**:
```
research/insights/20260319-PLAN-AND-EXECUTE-REVOLUTION.md (应移动到项目区)
research/insights/20260319-plan-execute-report.md (重复)
research/insights/20260320-coding-experiment-report.md (应移动到项目区)
```

**整改措施**:
```bash
# 1. 移动到项目区
mv ~/.openclaw/workspace/research/insights/*.md \
   /home/ouyp/Learning/Practice/openclaw-universe/research/insights/

# 2. 删除重复文件
rm ~/.openclaw/workspace/research/insights/20260319-plan-execute-report.md

# 3. 删除空目录
rm -rf ~/.openclaw/workspace/research/
```

**责任人**: OpenClaw  
**截止时间**: 2026-03-23

---

### 问题 7: 项目区 AGENTS.md 重复

**位置**: `/home/ouyp/Learning/Practice/openclaw-universe/AGENTS.md`

**问题**:
- 与 `~/.openclaw/workspace/AGENTS.md` 重复
- 应使用软链接或只保留一份

**整改措施**:
```bash
# 方案 1: 删除项目区 AGENTS.md (推荐)
rm /home/ouyp/Learning/Practice/openclaw-universe/AGENTS.md

# 方案 2: 创建软链接
ln -sf ~/.openclaw/workspace/AGENTS.md \
        /home/ouyp/Learning/Practice/openclaw-universe/AGENTS.md
```

**责任人**: OpenClaw  
**截止时间**: 2026-03-23

---

### 问题 8: briefings/ 目录需整理

**位置**: `/home/ouyp/Learning/Practice/openclaw-universe/briefings/`

**问题文件**:
```
briefings/2026-03-18-首席顾问简报.md (旧，应归档)
briefings/2026-03-19-首席顾问简报.md (旧，应归档)
briefings/2026-03-20-管理审计与交班报告.md (旧，应归档)
briefings/20260321-td-001-release-announcement.md (保留)
briefings/README.md (保留)
```

**整改措施**:
```bash
# 1. 创建归档目录
mkdir -p /home/ouyp/Learning/Practice/openclaw-universe/briefings/archive/

# 2. 移动旧简报
mv /home/ouyp/Learning/Practice/openclaw-universe/briefings/2026-03-*.md \
   /home/ouyp/Learning/Practice/openclaw-universe/briefings/archive/
```

**责任人**: OpenClaw  
**截止时间**: 2026-03-23

---

### 问题 9: logs/ 目录需整理

**位置**: 两个 logs 目录

**问题**:
```
~/.openclaw/workspace/logs/ (sync 报告，应保留)
/openclaw-universe/logs/ (部署测试报告，应删除或归档)
```

**整改措施**:
```bash
# 1. 删除测试报告
rm /home/ouyp/Learning/Practice/openclaw-universe/logs/deploy_briefing_test_*.md

# 2. 或移动到 archive
mkdir -p /home/ouyp/Learning/Practice/openclaw-universe/logs/archive/
mv /home/ouyp/Learning/Practice/openclaw-universe/logs/*.md \
   /home/ouyp/Learning/Practice/openclaw-universe/logs/archive/
```

**责任人**: OpenClaw  
**截止时间**: 2026-03-23

---

## 🟢 轻微问题 (P2 - 本月清理)

### 问题 10: 旧版 CHECKLIST.md

**位置**: `/home/ouyp/Learning/Practice/openclaw-universe/CHECKLIST.md`

**问题**: 可能过时，应审查是否更新或删除

**整改措施**:
- 审查内容
- 更新或合并到 NORMS/
- 或删除

**责任人**: OpenClaw  
**截止时间**: 2026-03-31

---

### 问题 11: 软链接 universe-bridge

**位置**: `/home/ouyp/Learning/Practice/openclaw-universe/universe-bridge`

**问题**: 指向自身的软链接，冗余

**整改措施**:
```bash
rm /home/ouyp/Learning/Practice/openclaw-universe/universe-bridge
```

**责任人**: OpenClaw  
**截止时间**: 2026-03-31

---

### 问题 12: 任务目录命名不一致

**位置**: `tasks/` 目录

**问题**:
```
20260319-plan-execute-experiment/01_design/ (应为 01_designing)
20260319-plan-execute-experiment/02_roadmap/ (应为 02_roadmapping)
20260319-plan-execute-experiment/03_technical/ (应为 03_detailing)
```

**整改措施**:
```bash
cd /home/ouyp/Learning/Practice/openclaw-universe/tasks/20260319-plan-execute-experiment/
mv 01_design 01_designing
mv 02_roadmap 02_roadmapping
mv 03_technical 03_detailing
```

**责任人**: OpenClaw  
**截止时间**: 2026-03-31

---

## 📋 清理计划

### 今天执行 (2026-03-22)

| 任务 | 优先级 | 状态 |
|------|--------|------|
| 删除重复 tasks 目录 | P0 | ⏳ |
| 清理 memory/ 目录 | P0 | ⏳ |
| 整理 skills/ 目录 | P0 | ⏳ |
| 删除 norms-violations.log | P0 | ⏳ |

### 本周执行 (2026-03-22 ~ 2026-03-28)

| 任务 | 优先级 | 状态 |
|------|--------|------|
| 清理 notes/ 目录 | P1 | ⏳ |
| 移动 extensions/ 到项目区 | P1 | ⏳ |
| 移动 research/ 到项目区 | P1 | ⏳ |
| 处理 AGENTS.md 重复 | P1 | ⏳ |
| 整理 briefings/ 目录 | P1 | ⏳ |
| 整理 logs/ 目录 | P1 | ⏳ |

### 本月执行 (2026-03-22 ~ 2026-03-31)

| 任务 | 优先级 | 状态 |
|------|--------|------|
| 审查 CHECKLIST.md | P2 | ⏳ |
| 删除冗余软链接 | P2 | ⏳ |
| 重命名任务目录 | P2 | ⏳ |

---

## 📊 清理后目录结构

### 系统私有区 (~/.openclaw/workspace/)

```
~/.openclaw/workspace/
├── AGENTS.md ✅ (宪法)
├── SOUL.md ✅ (核心灵魂)
├── MEMORY.md ✅ (技术认知树)
├── HEARTBEAT.md ✅ (贤者律动)
├── IDENTITY.md ✅ (身份定义)
├── USER.md ✅ (用户信息)
├── TOOLS.md ✅ (工具说明)
├── BOOTSTRAP.md ✅ (启动指南)
├── NORMS/ ✅ (规范体系)
│   ├── core/ (8 条规范)
│   ├── checks/ (7 个检查脚本)
│   ├── templates/ (5 个模板)
│   ├── tech/ (3 个流程文档)
│   ├── logs/ (审计日志)
│   └── .state/ (状态追踪)
├── .crontab/ ✅ (Cron Job)
├── logs/ ✅ (同步报告)
└── skills-local/ ✅ (本地 skills)
```

### 项目主权区 (openclaw-universe)

```
openclaw-universe/
├── README.md ✅
├── OMNIFORGE_SOP.md ✅
├── tasks/ ✅ (研发区)
│   ├── 20260319-plan-execute-experiment/
│   └── 20260321-duckduckgo-fallback/
├── extensions/ ✅ (生产区)
│   └── duckduckgo-fallback/
├── research/insights/ ✅ (白皮书)
├── scripts/ ✅ (工具脚本)
├── briefings/ ✅ (简报)
├── logs/ ✅ (日志)
├── NORMS -> ~/.openclaw/workspace/NORMS ✅ (软链接)
└── .githooks/ ✅ (Git Hook)
```

---

## ✅ 验收清单

### P0 验收 (今天)

- [ ] 重复 tasks 目录删除
- [ ] memory/ 目录清理
- [ ] skills/ 目录整理
- [ ] norms-violations.log 删除

### P1 验收 (本周)

- [ ] notes/ 目录删除
- [ ] extensions/ 移动到项目区
- [ ] research/ 移动到项目区
- [ ] AGENTS.md 重复处理
- [ ] briefings/ 整理
- [ ] logs/ 整理

### P2 验收 (本月)

- [ ] CHECKLIST.md 审查
- [ ] 冗余软链接删除
- [ ] 任务目录重命名

---

*本审查报告由 openclaw-ouyp 编写*  
**版本**: 1.0.0 | **日期**: 2026-03-22 10:50  
**状态**: 🟡 待执行  
**首次清理**: 2026-03-22 12:00
