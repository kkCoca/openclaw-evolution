# 详细设计文档（DETAIL）

## 文档信息

| 字段 | 值 |
|------|-----|
| 版本 | v1.1.0 |
| 日期 | 2026-03-26 |
| 状态 | 待评审 |
| 作者 | openclaw-ouyp |

---

## 1. 系统架构

### 1.1 三方协作架构

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

---

## 2. 文件设计

### 2.1 workflow.md 修改设计

**文件路径**：`04_coding/openclaw-research-workflow/workflow.md`

**修改策略**：在每个阶段的描述中明确"调用 OpenCode 执行 XXX skill"

#### 阶段 1: designing

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
4. OpenCode 执行 designing skill 询问需求细节（一次一问）
5. OpenCode 执行 designing skill 输出 PRD.md + TRD.md
6. 流程引擎验证文档完整性
```

#### 阶段 2: roadmapping

**修改前**：
```markdown
### 阶段 2: roadmapping

调用 roadmapping skill：
- **输入**: PRD.md + TRD.md
- **输出**: `02_roadmapping/ROADMAP.md`
```

**修改后**：
```markdown
### 阶段 2: roadmapping

**调用 OpenCode 执行 roadmapping skill**：
- **输入**: PRD.md + TRD.md
- **输出**: `02_roadmapping/ROADMAP.md`
- **检查点**: 开发计划可行性
- **触发条件**: designing 阶段完成后

**执行步骤**:
1. 流程引擎将 PRD.md + TRD.md 传递给 OpenCode
2. OpenCode 执行 roadmapping skill 分析需求规模和复杂度
3. OpenCode 执行 roadmapping skill 制定开发阶段和里程碑
4. OpenCode 执行 roadmapping skill 输出 ROADMAP.md
5. 流程引擎验证开发计划可行性
```

#### 阶段 3: detailing

**修改前**：
```markdown
### 阶段 3: detailing

调用 detailing skill：
- **输入**: PRD.md + TRD.md + ROADMAP.md
- **输出**: `03_detailing/DETAIL.md`
```

**修改后**：
```markdown
### 阶段 3: detailing

**调用 OpenCode 执行 detailing skill**：
- **输入**: PRD.md + TRD.md + ROADMAP.md
- **输出**: `03_detailing/DETAIL.md`
- **检查点**: 文件级设计完整性
- **触发条件**: roadmapping 阶段完成后

**执行步骤**:
1. 流程引擎将 PRD.md + TRD.md + ROADMAP.md 传递给 OpenCode
2. OpenCode 执行 detailing skill 分析系统架构和模块划分
3. OpenCode 执行 detailing skill 设计文件结构和接口
4. OpenCode 执行 detailing skill 输出 DETAIL.md
5. 流程引擎验证文件级设计完整性
```

#### 阶段 4: coding

**修改前**：
```markdown
### 阶段 4: coding

调用 coding skill：
- **输入**: DETAIL.md
- **输出**: `04_coding/src/` + `04_coding/tests/` + `04_coding/README.md`
```

**修改后**：
```markdown
### 阶段 4: coding

**调用 OpenCode 执行 coding skill**：
- **输入**: DETAIL.md
- **输出**: `04_coding/src/` + `04_coding/tests/` + `04_coding/README.md`
- **检查点**: 代码质量 + 测试覆盖率
- **触发条件**: detailing 阶段完成后

**执行步骤**:
1. 流程引擎将 DETAIL.md 传递给 OpenCode
2. OpenCode 执行 coding skill 按照设计实现代码
3. OpenCode 执行 coding skill 编写单元测试
4. OpenCode 执行 coding skill 编写文档
5. 流程引擎验证代码质量和测试覆盖率
```

#### 阶段 5: reviewing

**修改前**：
```markdown
### 阶段 5: reviewing

调用 reviewing skill：
- **输入**: 所有产出（PRD+TRD+ROADMAP+DETAIL+ 代码 + 测试 + 文档）
- **输出**: `05_reviewing/REVIEW-REPORT.md`
```

**修改后**：
```markdown
### 阶段 5: reviewing

**调用 OpenCode 执行 reviewing skill**：
- **输入**: 所有产出（PRD+TRD+ROADMAP+DETAIL+ 代码 + 测试 + 文档）
- **输出**: `05_reviewing/REVIEW-REPORT.md`
- **检查点**: 验收通过
- **触发条件**: coding 阶段完成后

**执行步骤**:
1. 流程引擎将所有产出传递给 OpenCode
2. OpenCode 执行 reviewing skill 执行代码审查
3. OpenCode 执行 reviewing skill 执行文档审查
4. OpenCode 执行 reviewing skill 输出验收报告
5. 流程引擎验证验收通过
```

---

### 2.2 README.md 修改设计

**文件路径**：`04_coding/openclaw-research-workflow/README.md`

**修改策略**：在"工作流程"章节后增加"工作原理"章节

#### 新增章节：工作原理

**插入位置**：在"工作流程"章节之后，"故障排除"章节之前

**内容设计**：
```markdown
## 工作原理

### 三方协作架构

流程引擎 Skill 采用三方协作架构，明确分工：

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

### 调用流程

每个阶段的调用流程如下：

```
用户需求 → openclaw-ouyp → sessions_spawn → 流程引擎 → 调用 → OpenCode → 执行 skill → 输出
```

### 阶段调用说明

| 阶段 | 流程引擎动作 | OpenCode 执行 | 输出 |
|------|-------------|--------------|------|
| designing | 调用 designing skill | 执行需求分析和架构设计 | PRD.md + TRD.md |
| roadmapping | 调用 roadmapping skill | 执行开发计划制定 | ROADMAP.md |
| detailing | 调用 detailing skill | 执行文件级设计 | DETAIL.md |
| coding | 调用 coding skill | 执行代码实现 + 测试 + 文档 | src/ + tests/ + README.md |
| reviewing | 调用 reviewing skill | 执行验收验证 | REVIEW-REPORT.md |
```

---

## 3. 修改清单

| 文件 | 修改类型 | 修改内容 | 行数变化 |
|------|---------|---------|----------|
| workflow.md | 编辑 | 5 个阶段增加"调用 OpenCode 执行"说明 | +50 行 |
| README.md | 编辑 | 增加"工作原理"章节 | +40 行 |

---

## 4. 验收标准

### 4.1 workflow.md 验收

- [ ] 阶段 1: designing 明确"调用 OpenCode 执行 designing skill"
- [ ] 阶段 2: roadmapping 明确"调用 OpenCode 执行 roadmapping skill"
- [ ] 阶段 3: detailing 明确"调用 OpenCode 执行 detailing skill"
- [ ] 阶段 4: coding 明确"调用 OpenCode 执行 coding skill"
- [ ] 阶段 5: reviewing 明确"调用 OpenCode 执行 reviewing skill"
- [ ] 每个阶段的执行步骤明确流程引擎和 OpenCode 的分工

### 4.2 README.md 验收

- [ ] 增加"工作原理"章节
- [ ] 包含三方协作架构图
- [ ] 包含调用流程说明
- [ ] 包含阶段调用说明表格
- [ ] 与 AGENTS.md 保持一致

### 4.3 回归验收

- [ ] 保留原始需求（独立完整/零感知安装/流程标准化/易于分享）
- [ ] 不影响现有功能
- [ ] 文档风格一致

---

## 5. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0.0 | 2026-03-26 | 初始版本（原始需求） |
| v1.0.1 | 2026-03-26 | BUG-001 修复（目录结构问题） |
| v1.1.0 | 2026-03-26 | FEATURE-001：增加 OpenCode 调用说明 |
