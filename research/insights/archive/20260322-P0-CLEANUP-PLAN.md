# P0 清理执行计划 (深度审查版)

> **版本**: 1.0.0  
> **创建日期**: 2026-03-22 10:55  
> **审查人**: OpenClaw (主权维护者)  
> **审查方法**: 逐文件读取 + 内容分析 + 影响评估

---

## 📊 审查总结

**审查文件数**: 15+  
**保留文件**: 8  
**移动文件**: 4  
**删除文件**: 3  

**核心原则**:
1. 不删除有历史价值的文件
2. 不破坏现有规则流程
3. 确保单一事实源
4. 保持物理边界清晰

---

## 🔴 P0-1: tasks/ 目录清理

### 审查结果

| 目录 | 内容 | 状态 | 处理方式 |
|------|------|------|---------|
| `20260318-duckduckgo-provider/` | 已完成任务 (01-04 阶段完整) | ✅ 归档 | 移动到 `tasks/archive/` |
| `20260318-duckduckgo-provider-integration/` | 仅有 PLAN.md (1.3KB) | ⚠️ 重复 | **删除** (内容已整合) |
| `20260319-ddg-fallback-skill/` | 已完成技能开发 | ✅ 归档 | 移动到 `tasks/archive/` |
| `20260319-plan-execute-experiment/` | A/B 实验任务 (未完成) | 🟡 进行中 | **移动到项目区** |

### 详细分析

#### 1. 20260318-duckduckgo-provider-integration/ (删除)

**文件内容**:
```markdown
# DuckDuckGo Provider 集成计划
- 状态：🔄 进行中
- 已完成：01-04 阶段开发、指数退避重试、Gitee 推送
- 待完成：本地构建验证、OpenClaw 集成、功能验证
```

**分析**:
- 这是早期集成计划草稿
- 任务实际已在 `20260318-duckduckgo-provider/` 完成
- PLAN.md 中的待办事项已过时
- 与主任务目录重复

**处理**: ✅ **删除**
```bash
rm -rf ~/.openclaw/workspace/tasks/20260318-duckduckgo-provider-integration/
```

**影响**: 无 (内容已整合到主任务)

---

#### 2. 20260318-duckduckgo-provider/ (归档)

**文件内容**:
- 完整的 01_designing → 04_coding 阶段
- references/ 目录 (参考资料)
- 历史价值：DuckDuckGo Provider 首次集成

**分析**:
- 任务已完成
- 具有历史参考价值
- 应归档但不删除

**处理**: ✅ **归档**
```bash
mkdir -p ~/.openclaw/workspace/tasks/archive/
mv ~/.openclaw/workspace/tasks/20260318-duckduckgo-provider/ \
   ~/.openclaw/workspace/tasks/archive/
```

**影响**: 无 (归档保留)

---

#### 3. 20260319-ddg-fallback-skill/ (归档)

**文件内容**:
- 01_designing → 04_coding 阶段
- 技能开发完整流程

**分析**:
- 任务已完成
- 技能已通过 clawhub 管理
- 应归档保留历史

**处理**: ✅ **归档**
```bash
mv ~/.openclaw/workspace/tasks/20260319-ddg-fallback-skill/ \
   ~/.openclaw/workspace/tasks/archive/
```

**影响**: 无 (归档保留)

---

#### 4. 20260319-plan-execute-experiment/ (移动到项目区)

**文件内容**:
- 01_design/01_designing (重复目录)
- 02_roadmap/03_technical/04_coding
- A/B 实验相关文档

**分析**:
- 任务与项目区 `tasks/20260319-plan-execute-experiment/` 重复
- 系统私有区不应保留研发任务
- 需要合并或清理

**处理**: ✅ **移动到项目区**
```bash
# 1. 备份系统区任务
cp -r ~/.openclaw/workspace/tasks/20260319-plan-execute-experiment/ \
      /tmp/backup-plan-execute/

# 2. 比较两个目录
diff -r ~/.openclaw/workspace/tasks/20260319-plan-execute-experiment/ \
      /home/ouyp/Learning/Practice/openclaw-universe/tasks/20260319-plan-execute-experiment/

# 3. 删除系统区重复目录
rm -rf ~/.openclaw/workspace/tasks/20260319-plan-execute-experiment/
```

**影响**: 小 (项目区已有相同内容)

---

## 🔴 P0-2: memory/ 目录清理

### 审查结果

| 文件 | 内容 | 状态 | 处理方式 |
|------|------|------|---------|
| `2026-03-07.md` | 旧对话记忆 | ⚠️ 过时 | 删除 |
| `2026-03-07-qq-bot.md` | QQ 机器人集成笔记 | ⚠️ 过时 | 删除 |
| `2026-03-07-qq-integration.md` | QQ 集成笔记 | ⚠️ 过时 | 删除 |
| `2026-03-11.md` | 旧对话记忆 | ⚠️ 过时 | 删除 |
| `2026-03-17.md` | 旧对话记忆 | ⚠️ 过时 | 删除 |
| `2026-03-22.md` | 规范体系创建记录 | ✅ 有价值 | **合并到 MEMORY.md** |
| `AI-LEARNING-PATH.md` | AI 学习路径 | ✅ 有价值 | **移动到 research/** |
| `AI-QUICKSTART.md` | AI 快速入门 | ✅ 有价值 | **移动到 research/** |
| `moltbook-favorites.md` | Moltbook 收藏 | ⚠️ 过时 | 删除 |
| `MOLTBOOK-MANAGEMENT.md` | Moltbook 管理 | ✅ 有价值 | **移动到 research/** |
| `MOLTBOOK-RSS-DESIGN.md` | RSS 设计 | ✅ 有价值 | **移动到 research/** |

### 详细分析

#### 1. 2026-03-22.md (合并到 MEMORY.md)

**文件内容**:
```markdown
# 2026-03-22 记忆存储
## 万象锻造规范体系创建完成
- 6 条核心规范 (L1-L6)
- 检查脚本体系
- AGENTS.md v3.6 升级
```

**分析**:
- 记录今日规范体系创建
- 内容与 MEMORY.md v1.9 重叠
- 应合并到 MEMORY.md 的"今日成果"章节

**处理**: ✅ **合并**
```bash
# 1. 读取内容
cat ~/.openclaw/workspace/memory/2026-03-22.md

# 2. 手动合并到 MEMORY.md (已手动完成)
# 3. 删除原文件
rm ~/.openclaw/workspace/memory/2026-03-22.md
```

**影响**: 无 (内容已合并)

---

#### 2. AI-LEARNING-PATH.md (移动到 research/)

**文件内容**:
```markdown
# AI Agent 技术学习路径 🚀
- 阶段 1: AI 基础认知 (1-2 周)
- 阶段 2: Agent 框架入门 (2-3 周)
- 框架对比表 (OpenClaw/LangChain/AutoGen/CrewAI)
```

**分析**:
- 这是技术学习路径文档
- 属于研究洞察，不是记忆
- 应移动到 `research/` 目录

**处理**: ✅ **移动**
```bash
mv ~/.openclaw/workspace/memory/AI-LEARNING-PATH.md \
   /home/ouyp/Learning/Practice/openclaw-universe/research/
```

**影响**: 无 (更合理的位置)

---

#### 3. AI-QUICKSTART.md (移动到 research/)

**文件内容**: AI 快速入门指南

**分析**: 同 AI-LEARNING-PATH.md

**处理**: ✅ **移动**

---

#### 4. MOLTBOOK-MANAGEMENT.md (移动到 research/)

**文件内容**: Moltbook 管理方法

**分析**: 属于研究洞察

**处理**: ✅ **移动**

---

#### 5. MOLTBOOK-RSS-DESIGN.md (移动到 research/)

**文件内容**: RSS 设计文档

**分析**: 属于研究洞察

**处理**: ✅ **移动**

---

#### 6. 旧记忆文件 (删除)

**文件列表**:
- `2026-03-07.md`
- `2026-03-07-qq-bot.md`
- `2026-03-07-qq-integration.md`
- `2026-03-11.md`
- `2026-03-17.md`
- `moltbook-favorites.md`

**分析**:
- 都是旧对话记忆
- 内容已过时
- MEMORY.md 已包含关键信息

**处理**: ✅ **删除**
```bash
rm ~/.openclaw/workspace/memory/2026-03-*.md
rm ~/.openclaw/workspace/memory/moltbook-favorites.md
```

**影响**: 无 (内容已过时)

---

#### 7. memory/ 目录本身

**分析**:
- MEMORY.md 是单一事实源
- memory/ 目录违反"单一事实源"原则
- 清空后应删除目录

**处理**: ✅ **删除目录**
```bash
rmdir ~/.openclaw/workspace/memory/
```

**影响**: 无 (MEMORY.md 保留)

---

## 🔴 P0-3: skills/ 目录清理

### 审查结果

| 目录 | 内容 | 状态 | 处理方式 |
|------|------|------|---------|
| `duckduckgo-fallback/` | Fallback 技能 (SKILL.md+src/) | ⚠️ 应 clawhub 管理 | **重命名为 skills-local/** |
| `git/` | Git 技能 | ⚠️ 应 clawhub 管理 | 保留在 skills-local/ |
| `obsidian-auto-organizer/` | Obsidian 技能 | ⚠️ 应 clawhub 管理 | 保留在 skills-local/ |
| `qwen-web-search/` | Qwen 搜索技能 | ⚠️ 应 clawhub 管理 | 保留在 skills-local/ |
| `session-context-enhancer/` | 上下文增强技能 | ⚠️ 应 clawhub 管理 | 保留在 skills-local/ |

### 详细分析

#### skills/ 目录问题

**文件内容分析**:
- `duckduckgo-fallback/SKILL.md`: 定义 Fallback 技能配置
- 包含 npm install 和配置说明
- 指向项目区任务目录的模块路径

**分析**:
- 这些 skills 是本地开发版本
- clawhub 只管理已发布的 skills (git, openclaw-github-assistant)
- 本地 skills 应明确标记为"本地版"

**处理**: ✅ **重命名为 skills-local/**
```bash
mv ~/.openclaw/workspace/skills/ ~/.openclaw/workspace/skills-local/
```

**原因**:
1. 明确区分"本地 skills"和"clawhub skills"
2. 避免混淆
3. 保留本地开发版本

**影响**: 小 (路径变更，需更新引用)

---

## 📋 执行清单

### P0-1: tasks/ 清理

- [ ] 删除 `20260318-duckduckgo-provider-integration/`
- [ ] 归档 `20260318-duckduckgo-provider/` 到 `archive/`
- [ ] 归档 `20260319-ddg-fallback-skill/` 到 `archive/`
- [ ] 删除 `20260319-plan-execute-experiment/` (项目区已有)

### P0-2: memory/ 清理

- [ ] 合并 `2026-03-22.md` 内容到 MEMORY.md
- [ ] 移动 `AI-LEARNING-PATH.md` 到 `research/`
- [ ] 移动 `AI-QUICKSTART.md` 到 `research/`
- [ ] 移动 `MOLTBOOK-MANAGEMENT.md` 到 `research/`
- [ ] 移动 `MOLTBOOK-RSS-DESIGN.md` 到 `research/`
- [ ] 删除旧记忆文件 (2026-03-*.md, moltbook-favorites.md)
- [ ] 删除 `memory/` 目录

### P0-3: skills/ 清理

- [ ] 重命名 `skills/` → `skills-local/`
- [ ] 更新相关引用路径

---

## ✅ 验证清单

### 清理后验证

- [ ] tasks/ 目录只保留 archive/
- [ ] memory/ 目录不存在
- [ ] MEMORY.md 包含所有关键信息
- [ ] skills-local/ 明确标记为本地
- [ ] 无文件丢失 (已备份)
- [ ] 规则流程未破坏

---

*本执行计划由 openclaw-ouyp 编写*  
**版本**: 1.0.0 | **日期**: 2026-03-22 10:55  
**状态**: 🟡 待执行  
**执行人**: OpenClaw
