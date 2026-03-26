# 技术需求文档（TRD）

## 文档信息

| 字段 | 值 |
|------|-----|
| 版本 | v1.1.0 |
| 日期 | 2026-03-26 |
| 状态 | 待评审 |
| 作者 | openclaw-ouyp |

---

## 1. 技术架构

### 1.1 系统架构

```
┌─────────────────────────────────────┐
│  openclaw-ouyp (审阅者)              │
│  • 需求整理                         │
│  • 任务分配                         │
│  • 验收验证                         │
│  • Git 管理                         │
│  • 部署上线                         │
└─────────────────────────────────────┘
              ↓ sessions_spawn
┌─────────────────────────────────────┐
│  流程引擎 Skill (编排者)             │
│  • 自动调用 skills                   │
│  • 流程监督                         │
│  • 生成审查报告                     │
└─────────────────────────────────────┘
              ↓ 调用
┌─────────────────────────────────────┐
│  OpenCode (执行者)                  │
│  • designing → PRD + TRD            │
│  • roadmapping → ROADMAP            │
│  • detailing → DETAIL               │
│  • coding → 代码 + 测试             │
│  • reviewing → 验收报告             │
└─────────────────────────────────────┘
```

### 1.2 调用关系

| 阶段 | 流程引擎动作 | OpenCode 执行 |
|------|-------------|--------------|
| designing | 调用 designing skill | 执行需求分析和架构设计 |
| roadmapping | 调用 roadmapping skill | 执行开发计划制定 |
| detailing | 调用 detailing skill | 执行文件级设计 |
| coding | 调用 coding skill | 执行代码实现 + 测试 + 文档 |
| reviewing | 调用 reviewing skill | 执行验收验证 |

---

## 2. 修改方案

### 2.1 workflow.md 修改

**修改位置**：每个阶段的"执行步骤"部分

**修改前**：
```markdown
### 阶段 1: designing

调用 designing skill：
- **输入**: 用户需求
- **输出**: `01_designing/PRD.md` + `01_designing/TRD.md`
```

**修改后**：
```markdown
### 阶段 1: designing

**调用 OpenCode 执行 designing skill**：
- **输入**: 用户需求
- **输出**: `01_designing/PRD.md` + `01_designing/TRD.md`
- **检查点**: 文档完整性
- **触发条件**: 用户确认需求后

**执行步骤**:
1. 流程引擎将用户需求传递给 OpenCode
2. OpenCode 执行 designing skill 分析需求类型
3. OpenCode 执行 designing skill 与用户确认模式
4. OpenCode 执行 designing skill 询问需求细节
5. OpenCode 执行 designing skill 输出 PRD.md + TRD.md
6. 流程引擎验证文档完整性
```

### 2.2 README.md 修改

**新增章节**：在"工作流程"章节后增加"工作原理"章节

**内容**：
```markdown
## 工作原理

### 三方协作架构

流程引擎 Skill 采用三方协作架构：

1. **openclaw-ouyp（审阅者）**：负责任务分配和验收验证
2. **流程引擎（编排者）**：负责流程监督和 skill 调用
3. **OpenCode（执行者）**：负责具体研发任务执行

### 调用流程

```
用户需求 → openclaw-ouyp → sessions_spawn → 流程引擎 → 调用 → OpenCode → 执行 skill → 输出
```

### 阶段调用说明

| 阶段 | 流程引擎动作 | OpenCode 执行 |
|------|-------------|--------------|
| designing | 调用 designing skill | 执行需求分析和架构设计 |
| roadmapping | 调用 roadmapping skill | 执行开发计划制定 |
| detailing | 调用 detailing skill | 执行文件级设计 |
| coding | 调用 coding skill | 执行代码实现 + 测试 + 文档 |
| reviewing | 调用 reviewing skill | 执行验收验证 |
```

---

## 3. 文件修改清单

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| workflow.md | 编辑 | 每个阶段增加"调用 OpenCode 执行"说明 |
| README.md | 编辑 | 增加"工作原理"章节 |

---

## 4. 技术约束

### 4.1 保留原始需求

- ✅ 独立完整：一个包包含所有依赖 skills
- ✅ 零感知安装：用户只需安装 1 个 skill
- ✅ 流程标准化：所有场景都走完整研发流程
- ✅ 易于分享：支持多种安装方式

### 4.2 文档规范

- 保持与现有文档风格一致
- 使用 Markdown 格式
- 图表使用 ASCII art 或 Mermaid

---

## 5. 验收标准

### 5.1 功能验收

- [ ] workflow.md 每个阶段明确"调用 OpenCode 执行 XXX skill"
- [ ] README.md 增加"工作原理"章节
- [ ] 三方协作架构图清晰展示

### 5.2 质量验收

- [ ] 文档语言简洁清晰
- [ ] 结构层次分明
- [ ] 与 AGENTS.md 保持一致

### 5.3 回归验收

- [ ] 原始需求仍然满足
- [ ] 不影响现有功能
- [ ] 所有研发过程文档完整

---

## 6. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0.0 | 2026-03-26 | 初始版本（原始需求） |
| v1.0.1 | 2026-03-26 | BUG-001 修复（目录结构问题） |
| v1.1.0 | 2026-03-26 | FEATURE-001：增加 OpenCode 调用说明 |
